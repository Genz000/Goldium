export const GOLD_VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * The Photoshop gold stack, evaluated per pixel, bottom layer first:
 *  1. Levels (input black, gamma, input white) on the object
 *  2. Solid Color fill blended Color: object luminosity, fill hue and saturation
 *  3. Curves S-curve (256-entry table, per channel like RGB Curves)
 *  3b. Metal: wavy chrome curve + relief reflections (luminance only), glints added at the end
 *  4. Color Lookup: a five-stop gold look over luminance at Strength
 *  5. Hue/Saturation on Master, Reds or Yellows with Photoshop's range falloff
 */
export const GOLD_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uRes;        // backing pixels
uniform float uScale;     // backing pixels per scene pixel
uniform vec4 uRect;       // image rect in scene pixels (x, y, w, h)
uniform sampler2D uImage;
uniform sampler2D uCurve; // 256 x 1, red channel = output level
uniform float uHasImage;
uniform vec2 uTexel;      // one source texel in uv
uniform float uMetal;     // 0..1
uniform vec3 uLevels;     // black, gamma, white (0..1, gamma raw)
uniform vec3 uTint;
uniform float uTintOpacity;
uniform vec3 uLook[5];
uniform float uLookStrength;
uniform int uHueRange;    // 0 master, 1 reds, 2 yellows
uniform vec3 uHueSat;     // hue degrees, saturation -1..1, lightness -1..1

out vec4 outColor;

// Photoshop's non-separable blend luminosity.
float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec3 clipColor(vec3 c) {
  float l = lum(c);
  float n = min(min(c.r, c.g), c.b);
  float x = max(max(c.r, c.g), c.b);
  if (n < 0.0) c = l + (c - l) * l / max(l - n, 1e-5);
  if (x > 1.0) c = l + (c - l) * (1.0 - l) / max(x - l, 1e-5);
  return c;
}
vec3 setLum(vec3 c, float l) { return clipColor(c + (l - lum(c))); }

float curve(float v) { return texture(uCurve, vec2(clamp(v, 0.0, 1.0) * (255.0 / 256.0) + 0.5 / 256.0, 0.5)).r; }

vec3 look(float t) {
  float x = clamp(t, 0.0, 1.0) * 4.0;
  int i = int(min(floor(x), 3.0));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f) * 0.35 + f * 0.65;
  return mix(uLook[i], uLook[i + 1], f);
}

vec3 rgb2hsl(vec3 c) {
  float mx = max(max(c.r, c.g), c.b);
  float mn = min(min(c.r, c.g), c.b);
  float l = (mx + mn) * 0.5;
  float d = mx - mn;
  if (d < 1e-5) return vec3(0.0, 0.0, l);
  float s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
  float h;
  if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  return vec3(h * 60.0, s, l);
}
vec3 hsl2rgb(vec3 hsl) {
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + hsl.x / 30.0, 12.0);
  float a = hsl.y * min(hsl.z, 1.0 - hsl.z);
  return hsl.z - a * clamp(min(k - 3.0, 9.0 - k), -1.0, 1.0);
}

// Photoshop's default ranges: full inside +-15 deg of the centre, fading out over 30 deg more.
float rangeWeight(float h) {
  if (uHueRange == 0) return 1.0;
  float centre = uHueRange == 1 ? 0.0 : 60.0;
  float d = abs(mod(h - centre + 180.0, 360.0) - 180.0);
  return 1.0 - smoothstep(15.0, 45.0, d);
}

vec3 hueSat(vec3 c) {
  vec3 hsl = rgb2hsl(c);
  // Grey pixels carry no hue: in a ranged edit they are left alone, as in Photoshop.
  float w = uHueRange == 0 ? 1.0 : rangeWeight(hsl.x) * smoothstep(0.0, 0.08, hsl.y);
  if (w <= 0.0) return c;
  hsl.x = mod(hsl.x + uHueSat.x * w, 360.0);
  float s = uHueSat.y * w;
  hsl.y = s < 0.0 ? hsl.y * (1.0 + s) : hsl.y + (1.0 - hsl.y) * s * hsl.y;
  vec3 rgb = hsl2rgb(clamp(hsl, vec3(0.0), vec3(360.0, 1.0, 1.0)));
  float l = uHueSat.z * w;
  return l < 0.0 ? rgb * (1.0 + l) : mix(rgb, vec3(1.0), l);
}

float srcLum(vec2 uv) {
  vec4 s = texture(uImage, uv);
  return lum(s.rgb) * s.a;
}

// Surface normal from image luminance (bright = raised), softened over a few texels.
vec3 reliefNormal(vec2 uv) {
  vec2 o = uTexel * 2.0;
  float dx = srcLum(uv + vec2(o.x, 0.0)) - srcLum(uv - vec2(o.x, 0.0))
    + 0.5 * (srcLum(uv + vec2(o.x, o.y)) - srcLum(uv - vec2(o.x, -o.y)) + srcLum(uv + vec2(o.x, -o.y)) - srcLum(uv - vec2(o.x, o.y)));
  float dy = srcLum(uv + vec2(0.0, o.y)) - srcLum(uv - vec2(0.0, o.y))
    + 0.5 * (srcLum(uv + vec2(o.x, o.y)) - srcLum(uv + vec2(o.x, -o.y)) + srcLum(uv - vec2(o.x, -o.y)) - srcLum(uv - vec2(o.x, o.y)));
  return normalize(vec3(-dx * 3.0, dy * 3.0, 1.0));
}

// A soft studio around the object: bright softbox above, dark floor, a rim strip on the right.
float studio(vec3 r) {
  float top = smoothstep(0.05, 0.75, r.y);
  float floorDark = smoothstep(0.1, -0.6, r.y) * 0.85;
  float strip = exp(-pow((r.x - 0.55) * 7.0, 2.0)) * 0.6;
  return clamp(0.35 + top * 0.65 - floorDark + strip, 0.0, 1.2);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec2 uv = (p - uRect.xy) / uRect.zw;
  if (uHasImage < 0.5 || uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { outColor = vec4(0.0); return; }
  vec4 src = texture(uImage, uv);
  float alpha = src.a;
  if (alpha <= 0.002) { outColor = vec4(0.0); return; }

  // 1. Levels
  vec3 c = clamp((src.rgb - uLevels.x) / max(uLevels.z - uLevels.x, 1e-3), 0.0, 1.0);
  c = pow(c, vec3(1.0 / max(uLevels.y, 0.01)));

  // 2. Solid Color, blend mode Color
  c = mix(c, setLum(uTint, lum(c)), uTintOpacity);

  // 3. Curves
  c = vec3(curve(c.r), curve(c.g), curve(c.b));

  // 3b. Metal: polished metal is all reflection, so tone comes from a banded chrome curve
  // of the object's own shading times what its relief reflects; glints are added later.
  vec3 n = vec3(0.0, 0.0, 1.0);
  if (uMetal > 0.0) {
    n = reliefNormal(uv);
    float L = lum(c);
    float chrome = L + 0.22 * sin(L * 6.2831853 * 1.5 - 0.6);
    vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
    float env = studio(normalize(r + vec3(0.0, (L - 0.5) * 0.8, 0.0)));
    // env averages about 0.6 over the hemisphere, so this factor keeps mean brightness.
    float metalL = clamp(chrome * (0.45 + 0.95 * env) + 0.08 * env, 0.0, 1.0);
    c = mix(c, setLum(c, metalL), uMetal);
  }

  // 4. Color Lookup
  c = mix(c, look(lum(c)), uLookStrength);

  // 5. Hue/Saturation
  c = clamp(hueSat(c), 0.0, 1.0);

  // Glints: sharp highlights where the relief faces the key light, in the look's brightest tone.
  if (uMetal > 0.0) {
    vec3 h = normalize(vec3(-0.35, 0.55, 1.0) + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, h), 0.0), 90.0) * 1.4 + pow(max(dot(n, h), 0.0), 18.0) * 0.18;
    c = clamp(c + uLook[4] * spec * uMetal * smoothstep(0.25, 0.7, lum(c)), 0.0, 1.0);
  }

  outColor = vec4(c * alpha, alpha);
}
`;
