# Toolcraft App Agent Worklog

## Status

Mode: product

Active change: goldium-3

## Decision Trail

### Change ID: goldium-3

- Entry type: focused
- Change ID: goldium-3
- Request: "I want you to add to the application to add position X and Y. Values and a switch to center the elements in the Canva."
- Changed owner: src/gold/gold-settings.ts (center/x/y, placeImage offset, placementOffset), gold-controls.ts (Placement: source.center, source.x, source.y), gold-gl.ts, gold-pipeline.ts, gold-inventory.ts, gold.test.ts.
- User-visible result: Placement gets a Center switch (on by default). Turning it off shows X and Y sliders that shift the image centre from the canvas centre in % of canvas width/height (-50 to 50, typed up to ±200; right and down are positive). Turning Center back on recentres the image and keeps the X/Y values.
- Verification: typecheck passes; src tests pass except the known Windows-only kit failure; in the app Center off reveals X/Y, X 25.9 % / Y -25.5 % moves the gold ball right and up, Center on recentres it.
- Risks: Risk: an offset image is clipped at the finite canvas edge, like Cover.

### Change ID: goldium-2

- Entry type: focused
- Change ID: goldium-2
- Request: "i want to add a value to control , its the metalic effect that make the whole thing more realistic"
- Changed owner: src/gold/gold-settings.ts, gold-controls.ts (Metal: metal.metallic), gold-shader.ts, gold-gl.ts, gold-pipeline.ts, gold-inventory.ts, gold-acceptance.ts; src/app/app-schema.ts and app-schema.test.ts.
- User-visible result: a Metal section with one Metallic slider (0-100 %, default 50) between Curves and Color Lookup. It applies a wavy chrome curve to the tones, shades them by what a soft studio would reflect off the image's relief (normal from luminance), and adds sharp glints in the look's brightest colour. 0 gives the previous output.
- Verification: typecheck, ai:check and src tests pass except the three known Windows-only kit failures; Metallic 0/50/75/100 compared on the tuning sheet; slider drag in the app changes the canvas and persists.
- Risks: Risk: relief comes from image brightness, so flat-lit images get little relief and printed patterns can read as bumps.

### Change ID: goldium-1

- Entry type: first-delivery
- Request: "I just saw. Photoshop tutorial effect. That make everything a gold object. [...] I want to create a tool that make this effect. [...] the tool gonna have a control panel that make me control and adjust the effect. [...] Use tool craft to build it."
- Task type: new generated app — custom WebGL renderer, schema/controls, image upload with optional white cut-out, image export.
- User-visible result: Goldium turns an uploaded object image (best a transparent PNG) into polished gold over a background colour, with every adjustment layer of the recipe as live controls.
- Source/reference checked: the user's written seven-step Photoshop recipe (Levels, Solid Color #544800 in Color mode, group, Curves S-curve, Color Lookup EdgeAmber.3DL, Hue/Saturation Yellows about -20) and two screenshots: an orange basketball before and the gold basketball after.
- Reference inputs: None (still screenshots only; no video, GIF, Figma or recording).
- Docs/contracts read: AGENTS.md; schema-reference.md (select, segmented); the Printium Toolcraft app as a working pattern for the same runtime version.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, infinity-canvas-scene-bounds, interaction-surface-ownership, timeline-mode-choice, output-export-required, controls-section-inventory-required, renderer-technique-inventory, renderer-gpu-provider, persistence-policy-explicit.
- View interaction intent: non-spatial — a flat processed image.
- Interaction ownership: every value is a global panel property-edit; the image is a panel collection-edit. Canvas shows output only.
- Decision: one WebGL2 fragment pass evaluates the stack per pixel: Levels per channel → SetLum(fill, Lum) Color blend at opacity → Curves from a 256-entry monotone cubic table texture → five-stop gold lookup over luminance at Strength → Hue/Saturation in HSL with Photoshop's ±15°/30° range falloff. The same program renders exports on an OffscreenCanvas.
- Alternatives rejected: Canvas 2D (too slow per pixel); WebGPU (browser coverage for one stateless pass); shipping the real EdgeAmber.3DL (Adobe asset, replaced by own gradient looks).
- State/output mapping: source.* → texture and image rect; levels.* → input levels; tint.* → Color-mode fill; curves.* → curve table; lookup.* → gold look; hue.* → Hue/Saturation; appearance.background/export.includeBackground → runtime background.
- Verification: typecheck, ai:check and src unit tests pass except the known Windows-only kit failures; rendered in the built-in browser with a basketball PNG.
- Risks: Risk: the Color Lookup is an own gradient look standing in for EdgeAmber.3DL, matched by eye.

## Decisions

### Renderer

- Decision: WebGL2 native provider with a browser-compatibility exception, preview and export.
- Reason: One stateless fragment pass; WebGL2 runs in every current desktop browser.
- Evidence: src/gold/gold-gl.ts, src/gold/gold-shader.ts, rendererTechnique in src/gold/gold-performance-model.ts.

### View Interaction

- Decision: non-spatial.
- Reason: Flat image output with no camera.
- Evidence: appProductReadiness.viewInteraction in src/gold/gold-inventory.ts.

### Interaction Ownership

- Decision: Panel owns all values and the image upload.
- Reason: The tutorial sets every value in panels; the canvas must stay clear to judge the gold.
- Evidence: appProductReadiness.interactionOwnership in src/gold/gold-inventory.ts.

### Timeline

- Decision: No timeline.
- Reason: A still effect on a still image.
- Evidence: modules list in src/app/app-schema.ts.

### Layers

- Decision: No Layers module.
- Reason: No layer workflow was requested.
- Evidence: modules list in src/app/app-schema.ts.

### Controls

- Decision: Sections Image, Placement, Levels, Color Fill, Curves, Color Lookup, Hue/Saturation after runtime Settings, in the order of the tutorial's steps; units follow Photoshop's panels so tutorial numbers can be typed in.
- Reason: Groups by recipe step; the uploader is runtime-standalone, so placement lives in its own section.
- Evidence: src/gold/gold-controls.ts and appControlSectionInventory in src/gold/gold-inventory.ts.

### Export

- Decision: Image export only (toolcraft-default PNG/JPG); SVG and video not requested.
- Reason: The request asks for the effect on an image.
- Evidence: exportIntent in src/gold/gold-inventory.ts.

### Performance

- Decision: Workload dimensions are source pixels (≤ 2048²), backing pixels and export resolution; decoding is memoised per image and orientation, the optional flood fill per tolerance.
- Reason: Frame cost is linear in pixels.
- Evidence: src/gold/gold-performance-model.ts; paths derived in src/app/app-performance.ts. No measured performance has been run.

Canonical control values and selected-entity isolation follow runtime representations; this product has no render scale.

## Evidence

- Source reviewed: the tutorial screenshots, Toolcraft local docs, and the Printium Toolcraft app for current API shapes.

## Verification

Functional checks only; measured performance and the protected delivery gate were not run.

## Risks

- Risk: Visual parity with Photoshop's EdgeAmber lookup is approximate.
