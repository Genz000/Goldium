# Goldium

Turns an object into gold. Upload a transparent PNG of an object and it is rebuilt as polished gold, following a Photoshop recipe with every adjustment layer as a live control.

**Try it:** https://genz000.github.io/goldium/ (desktop browser, window at least 1024 px wide)

## What it does

- Levels sets the metallic contrast: Black point, Midtones and White point
- Color Fill is the Solid Color layer in Color blend mode (default #544800): the object keeps its light and shade and takes the fill's hue
- Curves pulls the shadows down and pushes the highlights up in an S-curve
- Metal adds the polished-metal look: chrome banding, reflections off the surface relief and bright glints (Metallic 0 to 100 %)
- Color Lookup applies a gold look over the result: Amber gold, Rose gold, Antique gold or Champagne, with Strength
- Hue/Saturation adjusts Hue, Saturation and Lightness of the Master, Reds or Yellows range
- Cut out white removes a plain white surround for photos without transparency
- Exports PNG (with or without background) or JPG at 2K, 4K or 8K

## Use

1. Drop an image into **Image**. A transparent PNG works best.
2. Start with **Levels**: raise Black point for deeper grooves, lower White point for more shine.
3. Change the gold with **Color Lookup** and **Hue/Saturation**.
4. Export with **Export PNG**.

## Run locally

```bash
npm install
npm run dev
```

Desktop browser, window at least 1024 px wide.

Made by Nader Boulaich.
