import type { ToolcraftControlSchema } from "@/toolcraft/runtime";

import { BACKGROUND_TARGET, IMAGE_TARGET, goldDefaults as d } from "./gold-settings";

const always = { applicability: { mode: "always" } } as const;
const live = {
  ...always, performanceRole: "responsiveness",
  performanceReason: "Changes one shader uniform; the next frame redraws a single full-screen pass.",
} as const;
const slider = { sliderValueKind: "continuous" } as const;

export const backgroundControls = {
  include: { ...live, type: "switch", target: "export.includeBackground", label: "Background", defaultValue: true },
  color: { ...live, type: "color", target: BACKGROUND_TARGET, label: "Background color", defaultValue: d.background },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const imageControls = {
  image: {
    ...always, type: "fileDrop", target: IMAGE_TARGET, label: false, assetKind: "image", multiple: false, defaultValue: [],
    description: "A transparent PNG of an object works best. A plain white surround can be cut away in Placement.",
    performanceRole: "workload",
    performanceReason: "A new image is decoded once (long edge up to 2048 px) and uploaded as one texture.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const placementControls = {
  fit: {
    ...live, type: "segmented", target: "source.fit", label: "Fit", defaultValue: d.fit,
    description: "Contain shows the whole image inside the canvas; Cover fills the canvas and crops the overflow.",
    options: [{ label: "Contain", value: "contain" }, { label: "Cover", value: "cover" }],
  },
  scale: {
    ...live, ...slider, type: "slider", target: "source.scale", label: "Scale", defaultValue: d.scale,
    min: 0.1, max: 2, step: 0.01, editableRange: { hardMin: 0.01 },
    description: "Size of the image relative to the Fit size.",
  },
  center: {
    ...live, type: "switch", target: "source.center", label: "Center", defaultValue: d.center,
    description: "Keeps the image centred in the canvas. Turn off to place it with X and Y.",
  },
  x: {
    applicability: { mode: "conditional", all: [{ target: "source.center", equals: false }] },
    performanceRole: live.performanceRole, performanceReason: live.performanceReason,
    ...slider, type: "slider", target: "source.x", label: "X", defaultValue: d.x,
    min: -50, max: 50, step: 0.1, unit: "%", editableRange: { hardMin: -200, hardMax: 200 },
    description: "Horizontal shift of the image from the canvas centre, in % of the canvas width. Positive moves right.",
  },
  y: {
    applicability: { mode: "conditional", all: [{ target: "source.center", equals: false }] },
    performanceRole: live.performanceRole, performanceReason: live.performanceReason,
    ...slider, type: "slider", target: "source.y", label: "Y", defaultValue: d.y,
    min: -50, max: 50, step: 0.1, unit: "%", editableRange: { hardMin: -200, hardMax: 200 },
    description: "Vertical shift of the image from the canvas centre, in % of the canvas height. Positive moves down.",
  },
  cutout: {
    ...always, type: "switch", target: "source.cutout", label: "Cut out white", defaultValue: d.cutout,
    description: "For photos without transparency: cuts away the white surround of the object (flood fill from the image border).",
    performanceRole: "responsiveness", performanceReason: "Reruns one flood fill over the decoded image (at most 2048 px on the long edge), then one shader pass.",
  },
  tolerance: {
    applicability: { mode: "conditional", all: [{ target: "source.cutout", equals: true }] },
    ...slider, type: "slider", target: "source.tolerance", label: "Tolerance", defaultValue: d.tolerance,
    min: 0, max: 128, step: 1, editableRange: { hardMin: 0, hardMax: 255 },
    description: "How far from pure white a surrounding pixel may be and still be cut away.",
    performanceRole: "responsiveness", performanceReason: "Reruns one flood fill over the decoded image (at most 2048 px on the long edge), then one shader pass.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const levelsControls = {
  black: {
    ...live, ...slider, type: "slider", target: "levels.black", label: "Black point", defaultValue: d.levelsBlack,
    min: 0, max: 253, step: 1, editableRange: { hardMin: 0, hardMax: 253 },
    description: "Levels input shadows: every tone at or below this level turns black. Higher deepens the dark grooves.",
  },
  gamma: {
    ...live, ...slider, type: "slider", target: "levels.gamma", label: "Midtones", defaultValue: d.levelsGamma,
    min: 0.1, max: 3, step: 0.01, editableRange: { hardMin: 0.1, hardMax: 9.99 },
    description: "Levels gamma: above 1 lightens the midtones, below 1 darkens them.",
  },
  white: {
    ...live, ...slider, type: "slider", target: "levels.white", label: "White point", defaultValue: d.levelsWhite,
    min: 2, max: 255, step: 1, editableRange: { hardMin: 2, hardMax: 255 },
    description: "Levels input highlights: every tone at or above this level turns white. Lower makes more highlights.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const tintControls = {
  color: {
    ...live, type: "color", target: "tint.color", label: "Fill color", defaultValue: d.tint,
    description: "Solid Color layer blended in Color mode: the object keeps its light and shade and takes this hue and saturation.",
  },
  opacity: {
    ...live, ...slider, type: "slider", target: "tint.opacity", label: "Opacity", defaultValue: d.tintOpacity,
    min: 0, max: 100, step: 1, unit: "%", editableRange: { hardMin: 0, hardMax: 100 },
    description: "Opacity of the Solid Color layer. Lower lets the object's own colours through.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const curvesControls = {
  shadows: {
    ...live, ...slider, type: "slider", target: "curves.shadows", label: "Shadows", defaultValue: d.curveShadows,
    min: 0, max: 64, step: 1, editableRange: { hardMin: 0, hardMax: 64 },
    description: "How far the quarter-tone point of the S-curve is pulled down, in levels.",
  },
  highlights: {
    ...live, ...slider, type: "slider", target: "curves.highlights", label: "Highlights", defaultValue: d.curveHighlights,
    min: 0, max: 63, step: 1, editableRange: { hardMin: 0, hardMax: 63 },
    description: "How far the three-quarter-tone point of the S-curve is pushed up, in levels. Higher gives brighter shine.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const metalControls = {
  metallic: {
    ...live, ...slider, type: "slider", target: "metal.metallic", label: "Metallic", defaultValue: d.metallic,
    min: 0, max: 100, step: 1, unit: "%", editableRange: { hardMin: 0, hardMax: 100 },
    description: "How much the surface behaves like polished metal: banded chrome reflections, relief that catches the light and bright glints. 0 leaves the plain recipe.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const lookupControls = {
  look: {
    ...live, type: "select", target: "lookup.look", label: "Look", defaultValue: d.look,
    description: "The colour lookup applied over the group. Amber stands in for Photoshop's EdgeAmber.3DL.",
    options: [
      { label: "Amber gold", value: "amber" },
      { label: "Rose gold", value: "rose" },
      { label: "Antique gold", value: "antique" },
      { label: "Champagne", value: "champagne" },
    ],
  },
  strength: {
    ...live, ...slider, type: "slider", target: "lookup.strength", label: "Strength", defaultValue: d.lookStrength,
    min: 0, max: 100, step: 1, unit: "%", editableRange: { hardMin: 0, hardMax: 100 },
    description: "Opacity of the Color Lookup layer.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const hueControls = {
  range: {
    ...live, type: "segmented", target: "hue.range", label: "Range", defaultValue: d.hueRange,
    description: "Which colours the Hue/Saturation layer edits: everything, or only the reds or yellows.",
    options: [{ label: "Master", value: "master" }, { label: "Reds", value: "reds" }, { label: "Yellows", value: "yellows" }],
  },
  hue: {
    ...live, ...slider, type: "slider", target: "hue.hue", label: "Hue", defaultValue: d.hue,
    min: -180, max: 180, step: 1, unit: "°", editableRange: { hardMin: -180, hardMax: 180 },
    description: "Rotates the hue of the selected range. Negative leans orange, positive leans green.",
  },
  saturation: {
    ...live, ...slider, type: "slider", target: "hue.saturation", label: "Saturation", defaultValue: d.saturation,
    min: -100, max: 100, step: 1, editableRange: { hardMin: -100, hardMax: 100 },
    description: "Saturation of the selected range. The tutorial lowers yellows slightly (about -20) to settle the gold.",
  },
  lightness: {
    ...live, ...slider, type: "slider", target: "hue.lightness", label: "Lightness", defaultValue: d.lightness,
    min: -100, max: 100, step: 1, editableRange: { hardMin: -100, hardMax: 100 },
    description: "Lightens or darkens the selected range.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;
