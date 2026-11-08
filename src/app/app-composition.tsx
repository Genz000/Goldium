import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";
import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { GoldCanvas } from "../gold/GoldCanvas";
import { goldExport } from "../gold/gold-export";
import { goldPipeline } from "../gold/gold-pipeline";
import { appSchema } from "./app-schema";

export const appComposition = composeToolcraftApp(appSchema, {
  scene: {
    canvasContent: <GoldCanvas />,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
    rasterFrameRenderer: goldExport,
  },
  renderer: { pipelineRegistration: goldPipeline },
});
