import { describe, expect, it } from "vitest";

import { cutout } from "./gold-cutout";
import { backingScale, curveTable, goldDefaults, placeImage, readGoldSettings } from "./gold-settings";

describe("gold settings", () => {
  it("defaults to the tutorial's recipe", () => {
    expect(readGoldSettings({})).toMatchObject({
      tint: "#544800", tintOpacity: 100, look: "amber", hueRange: "yellows", saturation: -10,
    });
  });

  it("falls back on invalid values", () => {
    const s = readGoldSettings({ "source.fit": "stretch", "levels.black": Number.NaN, "lookup.look": "neon", "hue.range": "blues" });
    expect(s.fit).toBe(goldDefaults.fit);
    expect(s.levelsBlack).toBe(goldDefaults.levelsBlack);
    expect(s.look).toBe(goldDefaults.look);
    expect(s.hueRange).toBe(goldDefaults.hueRange);
  });
});

describe("curves", () => {
  it("is the identity with no pull", () => {
    const t = curveTable(0, 0);
    expect(t).toHaveLength(256);
    for (const x of [0, 32, 64, 128, 192, 255]) expect(t[x] * 255).toBeCloseTo(x, 4);
  });

  it("makes an S-curve through the moved points and stays monotone", () => {
    const t = curveTable(24, 24);
    expect(t[64] * 255).toBeCloseTo(40, 4);
    expect(t[192] * 255).toBeCloseTo(216, 4);
    expect(t[0]).toBe(0);
    expect(t[255]).toBe(1);
    for (let i = 1; i < 256; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });
});

describe("image placement", () => {
  it("contains a wide image inside a square canvas, centred", () => {
    expect(placeImage(1000, 1000, 2000, 1000, "contain", 1)).toEqual({ x: 0, y: 250, width: 1000, height: 500 });
  });
  it("covers the canvas and crops the overflow", () => {
    expect(placeImage(1000, 1000, 2000, 1000, "cover", 1)).toEqual({ x: -500, y: 0, width: 2000, height: 1000 });
  });
});

describe("background cut-out", () => {
  it("removes white connected to the border but keeps enclosed white", () => {
    const size = 7;
    const rgba = new Uint8Array(size * size * 4).fill(255);
    for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) {
      const o = (y * size + x) * 4;
      if (x !== 3 || y !== 3) { rgba[o] = 30; rgba[o + 1] = 30; rgba[o + 2] = 30; }
    }
    cutout(rgba, size, size, 24);
    expect(rgba[3]).toBe(0);
    expect(rgba[(3 * size + 3) * 4 + 3]).toBe(255);
  });
});

describe("preview supersampling", () => {
  it("renders at twice the on-screen density, capped at 4096 px", () => {
    expect(backingScale(1600, 1600, 1, 1)).toBe(2);
    expect(backingScale(1600, 1600, 2, 2) * 1600).toBeCloseTo(4096);
  });
});
