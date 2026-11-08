export const IMAGE_TARGET = "source.image";
export const BACKGROUND_TARGET = "appearance.background";

export type FitMode = "contain" | "cover";
export type LookId = "amber" | "rose" | "antique" | "champagne";
export type HueRange = "master" | "reds" | "yellows";

/**
 * Every value mirrors one adjustment layer of the Photoshop "turn anything into gold" recipe:
 * Levels → Solid Color (Color blend) → Curves → Color Lookup (EdgeAmber) → Hue/Saturation.
 * Units follow Photoshop's panels so tutorial numbers can be typed in directly.
 */
export type GoldSettings = {
  fit: FitMode;
  scale: number;
  /** Centre the image in the canvas; when off, X and Y place it. */
  center: boolean;
  /** Offset of the image centre from the canvas centre, % of canvas width (right is positive). */
  x: number;
  /** Offset of the image centre from the canvas centre, % of canvas height (down is positive). */
  y: number;
  cutout: boolean;
  tolerance: number;
  /** Levels input black point, 0..253. */
  levelsBlack: number;
  /** Levels midtone gamma, 0.1..9.99 (1 = neutral). */
  levelsGamma: number;
  /** Levels input white point, 2..255. */
  levelsWhite: number;
  /** Solid Color fill, blended Color. */
  tint: string;
  /** Solid Color layer opacity, 0..100 %. */
  tintOpacity: number;
  /** Curves: output drop of the quarter-tone point, 0..64 levels. */
  curveShadows: number;
  /** Curves: output lift of the three-quarter-tone point, 0..64 levels. */
  curveHighlights: number;
  /** Metallic: wavy chrome curve, relief reflections and specular glints, 0..100. */
  metallic: number;
  look: LookId;
  /** Color Lookup layer opacity, 0..100 %. */
  lookStrength: number;
  hueRange: HueRange;
  hue: number;
  saturation: number;
  lightness: number;
};

/** The tutorial's recipe, tuned so a plain photo of an object reads as polished gold. */
export const goldDefaults: GoldSettings & { background: string } = {
  fit: "contain",
  scale: 0.8,
  center: true,
  x: 0,
  y: 0,
  cutout: false,
  tolerance: 24,
  levelsBlack: 52,
  levelsGamma: 1.15,
  levelsWhite: 195,
  tint: "#544800",
  tintOpacity: 100,
  curveShadows: 28,
  curveHighlights: 30,
  metallic: 50,
  look: "amber",
  lookStrength: 88,
  hueRange: "yellows",
  hue: 0,
  saturation: -10,
  lightness: 0,
  background: "#1F2021",
};

export const imageTargets = ["source.fit", "source.scale", "source.center", "source.x", "source.y", "source.cutout", "source.tolerance"] as const;
export const levelsTargets = ["levels.black", "levels.gamma", "levels.white"] as const;
export const tintTargets = ["tint.color", "tint.opacity"] as const;
export const curvesTargets = ["curves.shadows", "curves.highlights"] as const;
export const metalTargets = ["metal.metallic"] as const;
export const lookTargets = ["lookup.look", "lookup.strength"] as const;
export const hueTargets = ["hue.range", "hue.hue", "hue.saturation", "hue.lightness"] as const;

const LOOKS: readonly LookId[] = ["amber", "rose", "antique", "champagne"];
const RANGES: readonly HueRange[] = ["master", "reds", "yellows"];

export function readGoldSettings(values: Readonly<Record<string, unknown>>): GoldSettings {
  const d = goldDefaults;
  const n = (target: string, fallback: number) => {
    const v = values[target];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const b = (target: string, fallback: boolean) => (typeof values[target] === "boolean" ? (values[target] as boolean) : fallback);
  const c = (target: string, fallback: string) => (typeof values[target] === "string" ? (values[target] as string) : fallback);
  const look = LOOKS.find((l) => l === values["lookup.look"]) ?? d.look;
  const hueRange = RANGES.find((r) => r === values["hue.range"]) ?? d.hueRange;
  return {
    fit: values["source.fit"] === "cover" ? "cover" : values["source.fit"] === "contain" ? "contain" : d.fit,
    scale: n("source.scale", d.scale),
    center: b("source.center", d.center),
    x: n("source.x", d.x),
    y: n("source.y", d.y),
    cutout: b("source.cutout", d.cutout),
    tolerance: n("source.tolerance", d.tolerance),
    levelsBlack: n("levels.black", d.levelsBlack),
    levelsGamma: n("levels.gamma", d.levelsGamma),
    levelsWhite: n("levels.white", d.levelsWhite),
    tint: c("tint.color", d.tint),
    tintOpacity: n("tint.opacity", d.tintOpacity),
    curveShadows: n("curves.shadows", d.curveShadows),
    curveHighlights: n("curves.highlights", d.curveHighlights),
    metallic: n("metal.metallic", d.metallic),
    look,
    lookStrength: n("lookup.strength", d.lookStrength),
    hueRange,
    hue: n("hue.hue", d.hue),
    saturation: n("hue.saturation", d.saturation),
    lightness: n("hue.lightness", d.lightness),
  };
}

/**
 * Colour Lookup looks as five-stop gradients over luminance (shadow → highlight).
 * "amber" stands in for Photoshop's EdgeAmber.3DL: deep brown shadows, amber mids, pale gold tops.
 */
/** The X/Y offset that applies: none while Center is on. */
export function placementOffset(s: Pick<GoldSettings, "center" | "x" | "y">): { x: number; y: number } {
  return s.center ? { x: 0, y: 0 } : { x: s.x, y: s.y };
}

export const LOOK_STOPS: Record<LookId, readonly string[]> = {
  amber: ["#1C0E00", "#6B4300", "#C8960F", "#F5CF4A", "#FFF6C2"],
  rose: ["#170705", "#4E1E14", "#A65A42", "#E7A486", "#FFF0E4"],
  antique: ["#0D0903", "#382810", "#7A5E2C", "#C2A35A", "#F0E2B2"],
  champagne: ["#11100A", "#3B3527", "#857A5E", "#D3C8A4", "#FBF7E8"],
};

/** Image rectangle inside the canvas, in scene pixels. Offset is the centre shift in % of the canvas. */
export function placeImage(
  canvasW: number, canvasH: number, imageW: number, imageH: number, fit: FitMode, scale: number,
  offset: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number; width: number; height: number } {
  const fitK = fit === "cover" ? Math.max(canvasW / imageW, canvasH / imageH) : Math.min(canvasW / imageW, canvasH / imageH);
  const k = fitK * scale;
  const width = imageW * k;
  const height = imageH * k;
  return {
    x: (canvasW - width) / 2 + (offset.x / 100) * canvasW,
    y: (canvasH - height) / 2 + (offset.y / 100) * canvasH,
    width, height,
  };
}

/**
 * Photoshop-style Curves: a monotone cubic through (0,0), (64, 64 - shadows),
 * (192, 192 + highlights), (255,255). Returns 256 output levels 0..1.
 */
export function curveTable(shadows: number, highlights: number): number[] {
  const xs = [0, 64, 192, 255];
  const ys = [0, Math.max(0, 64 - shadows), Math.min(255, 192 + highlights), 255];
  const count = xs.length;
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  // Fritsch–Carlson tangents keep the curve monotone, like Photoshop never folding back.
  const m: number[] = [slopes[0]];
  for (let i = 1; i < count - 1; i++) m.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
  m.push(slopes[count - 2]);
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / slopes[i];
    const b = m[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * slopes[i]; m[i + 1] = t * b * slopes[i]; }
  }
  const out: number[] = [];
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    while (seg < count - 2 && x > xs[seg + 1]) seg += 1;
    const h = xs[seg + 1] - xs[seg];
    const t = (x - xs[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const y = (2 * t3 - 3 * t2 + 1) * ys[seg] + (t3 - 2 * t2 + t) * h * m[seg]
      + (-2 * t3 + 3 * t2) * ys[seg + 1] + (t3 - t2) * h * m[seg + 1];
    out.push(Math.max(0, Math.min(255, y)) / 255);
  }
  return out;
}

/** Largest backing edge the preview allocates. */
export const MAX_BACKING_EDGE = 4096;

/** Preview pixels per scene pixel: twice the on-screen density, capped at MAX_BACKING_EDGE. */
export function backingScale(width: number, height: number, zoom: number, dpr: number): number {
  const wanted = 2 * Math.max(zoom, 0.01) * Math.max(dpr, 1);
  const cap = MAX_BACKING_EDGE / Math.max(width, height, 1);
  return Math.max(0.05, Math.min(wanted, cap));
}
