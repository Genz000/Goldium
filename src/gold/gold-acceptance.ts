import type { ToolcraftComponentAcceptance } from "../app/acceptance/types";
import { appSchema } from "../app/app-schema";

import { curvesControls, hueControls, levelsControls, lookupControls, metalControls, placementControls, tintControls } from "./gold-controls";
import { IMAGE_TARGET } from "./gold-settings";

type Budget = "standard" | "extended-io";
type Row = ToolcraftComponentAcceptance;

const browser = (file: string, testName: string, budget: Budget = "standard") =>
  ({ file: `e2e/${file}.spec.ts` as `e2e/${string}.spec.ts`, testName, budget });

const optionsOf = (control: { options?: readonly { value: string }[] }) => control.options?.map((o) => o.value);

const productControls = { ...placementControls, ...levelsControls, ...tintControls, ...curvesControls, ...metalControls, ...lookupControls, ...hueControls };

const controlRows: Row[] = Object.values(productControls).map((control) => {
  const options = "options" in control ? optionsOf(control) : undefined;
  const target = control.target;
  return {
    id: target, target, kind: "control", componentType: control.type, interactionId: `${target}-property`,
    automated: true, automatedTestName: `gold parameter ${target}`,
    browser: browser("product-gold-controls", `browser: gold parameter ${target}`),
    evidence: "product-output",
    fixture: "Default settings with a transparent PNG of an object.",
    userAction: `Change ${control.label} through the real control.`,
    expectedObservable: "The gold canvas pixels change according to the setting.",
    ...(options ? { optionCoverage: options } : {}),
  } satisfies Row;
});

const exportSettingRow = (target: string, options: readonly string[]): Row => ({
  id: target, target, kind: "control", componentType: "select",
  automated: true, automatedTestName: `gold contract ${target}`,
  browser: browser("product-gold-export", "browser: gold image export delivers all formats and sizes", "extended-io"),
  evidence: "exported-bytes", optionCoverage: options,
  fixture: "Default settings with an uploaded photo.", userAction: `Select each ${target} option and export.`,
  expectedObservable: "The downloaded file has the selected format and dimensions.",
});

const runtimeRow = (id: string, target: string, evidence: Row["evidence"], file: string, testName: string, extra: Partial<Row>, budget: Budget = "standard"): Row => ({
  id, target, kind: "runtime", componentType: id, automated: true, automatedTestName: `gold contract ${id}`,
  browser: browser(file, testName, budget), evidence,
  fixture: "Default settings with an uploaded photo and real Toolcraft controls.",
  userAction: `Exercise ${id} through the visible UI.`,
  expectedObservable: `The gold output and runtime workspace implement ${id}.`,
  ...extra,
});

export const goldAcceptance: readonly Row[] = [
  {
    id: IMAGE_TARGET, target: IMAGE_TARGET, kind: "control", componentType: "fileDrop", interactionId: "source.image-collection",
    automated: true, automatedTestName: "gold contract source.image",
    browser: browser("product-gold-image", "browser: gold image upload, clear and reset", "extended-io"),
    evidence: "media-lifecycle", mediaLifecycleCoverage: ["upload", "remove", "reset", "rotate", "flip", "transform-output"],
    fixture: "A transparent PNG of an object.",
    userAction: "Upload the photo, rotate and flip it, then remove it and use section Reset.",
    expectedObservable: "The object renders in gold after upload, turns with 90° and mirrors with Flip H/V, and the canvas is empty after removal.",
  },
  ...controlRows,
  {
    ...controlRows[0], id: "appearance.background", target: "appearance.background", componentType: "color", interactionId: undefined,
    automatedTestName: "gold contract appearance.background",
    browser: browser("product-gold-background", "browser: gold background color changes output"),
    userAction: "Change Background color.", optionCoverage: undefined,
  },
  runtimeRow("background.output", "export.includeBackground", "product-output", "product-gold-background",
    "browser: gold background output follows runtime semantics",
    { kind: "control", componentType: "switch", backgroundOutputCoverage: "all-required-background-output" }),
  exportSettingRow("export.image.format", ["png", "jpg"]),
  exportSettingRow("export.image.resolution", ["2k", "4k", "8k"]),
  runtimeRow("export.image", "actions.output", "exported-bytes", "product-gold-export",
    "browser: gold image export delivers all formats and sizes",
    { componentType: "panelActions", actionCoverage: ["export.png"], exportArtifactCoverage: "all-required-image-export-behavior", infinityCanvasCoverage: "scene-bounds-image-export" }, "extended-io"),
  runtimeRow("export.actions", "actions.output", "exported-bytes", "product-gold-export",
    "browser: gold footer exports PNG",
    { kind: "control", componentType: "panelActions", actionCoverage: ["export.png"], exportArtifactCoverage: ["all-required-image-export-behavior"] }, "extended-io"),
  runtimeRow("canvas.size", "canvas.size.width", "product-output", "product-gold-workspace",
    "browser: gold canvas sizing changes output", {}),
  runtimeRow("canvas.infinity", "canvas.infinity", "viewport-side-effect", "product-gold-workspace",
    "browser: gold infinity preserves scene and viewport", { infinityCanvasCoverage: "mode-continuity-and-restoration" }),
  runtimeRow("persistence.reload", "canvas.size.width", "persistence-state", "product-gold-persistence",
    "browser: gold restores values and workspace after reload",
    { persistenceCoverage: "reload", persistenceSlices: appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [] }, "extended-io"),
];
