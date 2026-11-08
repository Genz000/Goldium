import type {
  ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness, ToolcraftTransferMode,
} from "../app/acceptance/types";

import { curvesTargets, hueTargets, IMAGE_TARGET, imageTargets, levelsTargets, lookTargets, metalTargets, tintTargets } from "./gold-settings";

/** The user's request in this session, verbatim. */
export const ORIGINAL_REQUEST_TEXT =
  "I just saw. Photoshop tutorial effect. That make everything a gold object. For example, a golden ball from a transparent PNG of ball. And so on. The thing here that I want to create a tool that make this effect. [...] the tool gonna have a control panel that make me control and adjust the effect. I will attach a screenshot of before and after the effect. Use tool craft to build it.";

export const goldTransferMode: ToolcraftTransferMode = {
  mode: "new-toolcraft-app",
  animationIntent: { mode: "none" },
  referenceInputs: [],
};

export const goldSectionInventory = [
  {
    id: "runtime.setup", title: "Settings", entityId: "background", entity: "Output background",
    targets: ["export.includeBackground", "appearance.background"],
    groupingReason: "One output background; runtime relocates this source pair into Settings.",
    finiteSelectors: [{ target: "export.includeBackground", role: "parameter", reason: "Controls background visibility and PNG alpha; the colour stays editable in both states." }],
  },
  {
    id: "image", title: "Image", entityId: "image", entity: "Source image", targets: [IMAGE_TARGET],
    groupingReason: "The object image turned to gold.",
    finiteSelectors: [],
  },
  {
    id: "placement", title: "Placement", entityId: "placement", entity: "Image placement and cut-out", targets: [...imageTargets],
    groupingReason: "How the photo sits in the canvas and whether its white background is removed.",
    finiteSelectors: [
      { target: "source.fit", role: "parameter", reason: "Contain or Cover changes only the image size; no other control depends on it." },
      { target: "source.center", role: "branch", affectedTargets: [], reason: "Center keeps the image in the middle; turning it off reveals X and Y, which move it." },
      { target: "source.cutout", role: "branch", affectedTargets: ["source.scale"], reason: "Cut out white reveals Tolerance and changes which part of the scaled image turns to gold." },
    ],
  },
  {
    id: "levels", title: "Levels", entityId: "levels", entity: "Levels adjustment", targets: [...levelsTargets],
    groupingReason: "Step 2 of the recipe: input black, midtones and white set the metallic contrast.",
    finiteSelectors: [],
  },
  {
    id: "tint", title: "Color Fill", entityId: "tint", entity: "Solid Color layer in Color mode", targets: [...tintTargets],
    groupingReason: "Step 3: the dark olive-gold fill blended Color, and its opacity.",
    finiteSelectors: [],
  },
  {
    id: "curves", title: "Curves", entityId: "curves", entity: "Curves S-curve", targets: [...curvesTargets],
    groupingReason: "Step 5: the S-curve that pulls shadows down and pushes highlights up.",
    finiteSelectors: [],
  },
  {
    id: "metal", title: "Metal", entityId: "metal", entity: "Metallic surface", targets: [...metalTargets],
    groupingReason: "Added on request: one amount for chrome banding, relief reflections and glints that make the gold read as real metal.",
    finiteSelectors: [],
  },
  {
    id: "lookup", title: "Color Lookup", entityId: "lookup", entity: "Color Lookup layer", targets: [...lookTargets],
    groupingReason: "Step 6: the warm gold look (EdgeAmber stand-in) and its opacity.",
    finiteSelectors: [{ target: "lookup.look", role: "parameter", reason: "Each look is a different five-stop gradient; no other control depends on it." }],
  },
  {
    id: "hue", title: "Hue/Saturation", entityId: "hue", entity: "Hue/Saturation layer", targets: [...hueTargets],
    groupingReason: "Step 7: hue, saturation and lightness of one colour range.",
    finiteSelectors: [{ target: "hue.range", role: "parameter", reason: "Range picks which hues the three sliders edit; every slider stays relevant in each range." }],
  },
  {
    id: "runtime.image-export", title: "Image Export", entityId: "image-export", entity: "Raster image output",
    targets: ["export.image.format", "export.image.resolution"], groupingReason: "Runtime-owned image format and resolution govern one exported artifact.",
    finiteSelectors: [
      { target: "export.image.format", role: "parameter", reason: "Selects PNG alpha support or opaque JPEG encoding." },
      { target: "export.image.resolution", role: "parameter", reason: "Selects the output long-edge pixel size." },
    ],
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

const panelProperty = (target: string) => ({
  id: `${target}-property`, target, capability: "property-edit" as const, surface: "panel" as const,
  selectionScope: { mode: "global" as const },
  evidence: { source: "reference" as const, detail: "The Photoshop tutorial sets every value in adjustment-layer and filter panels." },
  reason: "A global setting of the whole gold with no selected entity.",
  alternative: { surface: "canvas" as const, reason: "Canvas handles would cover the gold being judged and have no spatial meaning for these values." },
});

export const goldReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Goldium",
  productSummary: "Gold effect: an uploaded object image is rebuilt as polished gold through Levels, a Color-mode fill, Curves, a gold colour lookup and Hue/Saturation.",
  requestedBehavior: ORIGINAL_REQUEST_TEXT,
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  viewInteraction: { mode: "non-spatial", reason: "The output is a flat processed image with no camera or 3D scene." },
  interactionOwnership: [
    {
      id: "source.image-collection", target: IMAGE_TARGET, capability: "collection-edit", surface: "panel",
      evidence: { source: "usability-analysis", detail: "Toolcraft source uploads live in a panel fileDrop." },
      reason: "Uploading and removing the source image is file management, not spatial editing.",
      alternative: { surface: "canvas", reason: "Upload chrome on the canvas would cover the gold." },
    },
    ...[...imageTargets, ...levelsTargets, ...tintTargets, ...curvesTargets, ...metalTargets, ...lookTargets, ...hueTargets].map(panelProperty),
  ],
};
