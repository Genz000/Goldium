import { defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceScenario } from "@/toolcraft/runtime";

import { goldPerformanceModel } from "../gold/gold-performance-model";
import { appSchema } from "./app-schema";

export const goldPerformancePaths = deriveToolcraftPerformancePaths(appSchema, goldPerformanceModel);

export const appPerformance = defineToolcraftPerformance({
  ...goldPerformanceModel,
  scenarios: goldPerformancePaths.map((path, index): ToolcraftPerformanceScenario => ({
    id: `gold-path-${index}`, pathId: path.id, coversTargets: path.targets, interaction: path.interaction,
    automated: true, automatedTestName: "gold render plan has valid derived paths and fixtures",
    browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
    expectedObservable: "The gold preview, viewport or decoded artifact reflects the exact applied operation.",
    fixture: "Compiled reachable gold workload", uiSelector: '[data-testid="gold-output"]',
    ...(path.interaction === "export" ? { actionValue: "export.png", controlLabel: "Export PNG", completionEvidence: "download" as const } : {}),
  } as ToolcraftPerformanceScenario)),
});
