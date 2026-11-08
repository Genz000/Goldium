import { defineToolcraft, imageExportModule, mediaSourceModule } from "@/toolcraft/runtime";

import {
  backgroundControls, curvesControls, hueControls, imageControls, levelsControls, lookupControls, metalControls, placementControls, tintControls,
} from "../gold/gold-controls";
import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      upload: true,
      size: { width: 1600, height: 1600, unit: "px" },
      sizing: { mode: "editable-output" },
    },
    identity: appIdentity,
    panels: {
      controls: {
        sections: [
          { id: "runtime.setup", title: "Settings", controls: backgroundControls },
          { id: "image", title: "Image", controls: imageControls },
          { id: "placement", title: "Placement", controls: placementControls },
          { id: "levels", title: "Levels", controls: levelsControls },
          { id: "tint", title: "Color Fill", controls: tintControls },
          { id: "curves", title: "Curves", controls: curvesControls },
          { id: "metal", title: "Metal", controls: metalControls },
          { id: "lookup", title: "Color Lookup", controls: lookupControls },
          { id: "hue", title: "Hue/Saturation", controls: hueControls },
        ],
        title: "Controls",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
  },
  modules: [mediaSourceModule(), imageExportModule()],
});
