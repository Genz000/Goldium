import { GOLD_FRAGMENT, GOLD_VERTEX } from "./gold-shader";
import { curveTable, LOOK_STOPS, placeImage, type GoldSettings } from "./gold-settings";
import type { GoldSource } from "./gold-source";

type Surface = HTMLCanvasElement | OffscreenCanvas;

const UNIFORMS = [
  "uRes", "uScale", "uRect", "uImage", "uCurve", "uHasImage", "uLevels", "uTint", "uTintOpacity",
  "uLook", "uLookStrength", "uHueRange", "uHueSat", "uTexel", "uMetal",
] as const;

const RANGE_INDEX = { master: 0, reds: 1, yellows: 2 } as const;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader) ?? "unknown error"}`);
  }
  return shader;
}

export const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const v = m ? parseInt(m[1], 16) : 0;
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

/** One WebGL2 program drawing a full-screen triangle into the given surface. */
export class GoldRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly texture: WebGLTexture;
  private readonly loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  private readonly curveTexture: WebGLTexture;
  private curveKey = "";
  private source: GoldSource | null = null;

  constructor(readonly surface: Surface, preserveDrawingBuffer = false) {
    const gl = surface.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer }) as WebGL2RenderingContext | null;
    if (!gl) throw new Error("WebGL2 is not available in this browser.");
    this.gl = gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, GOLD_VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, GOLD_FRAGMENT));
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader link failed: ${gl.getProgramInfoLog(program) ?? "unknown error"}`);
    }
    this.program = program;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.loc = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as GoldRenderer["loc"];
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    this.curveTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /** Uploads the Curves table as a 256 x 1 float texture when the curve changes. */
  private updateCurve(shadows: number, highlights: number) {
    const key = `${shadows}|${highlights}`;
    if (key === this.curveKey) return;
    this.curveKey = key;
    const gl = this.gl;
    const table = new Float32Array(curveTable(shadows, highlights));
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 256, 1, 0, gl.RED, gl.FLOAT, table);
  }

  setSource(source: GoldSource | null) {
    if (source === this.source) return;
    this.source = source;
    if (!source) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.pixels);
  }

  /** Draws the scene (sceneW x sceneH scene pixels) into a backing of width x height pixels. */
  render(settings: GoldSettings, sceneW: number, sceneH: number, width: number, height: number) {
    const gl = this.gl;
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    if (this.surface.width !== w) this.surface.width = w;
    if (this.surface.height !== h) this.surface.height = h;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    const l = this.loc;
    const s = this.source;
    const rect = s ? placeImage(sceneW, sceneH, s.width, s.height, settings.fit, settings.scale) : { x: 0, y: 0, width: 1, height: 1 };
    gl.uniform2f(l.uRes, w, h);
    gl.uniform1f(l.uScale, w / Math.max(1, sceneW));
    gl.uniform4f(l.uRect, rect.x, rect.y, rect.width, rect.height);
    gl.uniform1f(l.uHasImage, s ? 1 : 0);
    gl.uniform3f(l.uLevels, settings.levelsBlack / 255, settings.levelsGamma, settings.levelsWhite / 255);
    gl.uniform3f(l.uTint, ...hexToRgb(settings.tint));
    gl.uniform1f(l.uTintOpacity, settings.tintOpacity / 100);
    gl.uniform3fv(l.uLook, LOOK_STOPS[settings.look].flatMap(hexToRgb));
    gl.uniform1f(l.uLookStrength, settings.lookStrength / 100);
    gl.uniform1f(l.uMetal, settings.metallic / 100);
    gl.uniform2f(l.uTexel, s ? 1 / s.width : 0, s ? 1 / s.height : 0);
    gl.uniform1i(l.uHueRange, RANGE_INDEX[settings.hueRange]);
    gl.uniform3f(l.uHueSat, settings.hue, settings.saturation / 100, settings.lightness / 100);
    this.updateCurve(settings.curveShadows, settings.curveHighlights);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.uniform1i(l.uCurve, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(l.uImage, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Frees GPU objects but keeps the context: React may mount the same canvas again. */
  dispose() {
    this.gl.deleteTexture(this.texture);
    this.gl.deleteTexture(this.curveTexture);
    this.gl.deleteProgram(this.program);
  }
}
