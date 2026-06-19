import assert from "node:assert/strict";
import test from "node:test";
import { ALTO_RESOLUTION_PRESETS, createAsciiAlt, imageToAscii, paletteFromAlt } from "../src/index.js";

test("createAsciiAlt returns the requested grid size", () => {
  const ascii = createAsciiAlt("A red bicycle leaning against a brick wall", {
    columns: 24,
    rows: 8
  });
  const lines = ascii.split("\n");

  assert.equal(lines.length, 8);
  assert.ok(lines.every((line) => line.length === 24));
});

test("createAsciiAlt is deterministic", () => {
  const first = createAsciiAlt("Mountain cabin in snow", { columns: 30, rows: 10 });
  const second = createAsciiAlt("Mountain cabin in snow", { columns: 30, rows: 10 });

  assert.equal(first, second);
});

test("createAsciiAlt embeds useful words from the alt text", () => {
  const ascii = createAsciiAlt("Yellow kayak on alpine lake", {
    columns: 36,
    rows: 10
  });

  assert.match(ascii, /YELLOW|KAYAK|ALPINE|LAKE/);
});

test("resolution presets adjust the generated grid size", () => {
  const low = createAsciiAlt("Resolution preset sample", { resolution: "low" });
  const high = createAsciiAlt("Resolution preset sample", { resolution: "high" });

  assert.ok(low.split("\n")[0].length < high.split("\n")[0].length);
  assert.ok(low.split("\n").length < high.split("\n").length);
});

test("explicit columns and rows override resolution presets", () => {
  const ascii = createAsciiAlt("Exact resolution sample", {
    columns: 22,
    resolution: "ultra",
    rows: 9
  });
  const lines = ascii.split("\n");

  assert.equal(lines.length, 9);
  assert.ok(lines.every((line) => line.length === 22));
});

test("resolution preset values are exported", () => {
  assert.equal(ALTO_RESOLUTION_PRESETS.medium, 1);
  assert.ok(ALTO_RESOLUTION_PRESETS.high > ALTO_RESOLUTION_PRESETS.low);
});

test("imageToAscii supports source-relative scales up to 4x", async () => {
  const ascii = await imageToAscii(
    {
      naturalHeight: 3,
      naturalWidth: 5
    },
    {
      document: {
        createElement() {
          return {
            getContext() {
              return {
                drawImage() {},
                getImageData(_x, _y, width, height) {
                  return {
                    data: new Uint8ClampedArray(width * height * 4).fill(255)
                  };
                }
              };
            }
          };
        }
      },
      maxColumns: 100,
      maxRows: 100,
      resolution: "4x"
    }
  );
  const lines = ascii.split("\n");

  assert.equal(lines.length, 12);
  assert.ok(lines.every((line) => line.length === 20));
});

test("paletteFromAlt returns CSS color strings", () => {
  const palette = paletteFromAlt("Glass building at night");

  assert.match(palette.background, /^hsl\(/);
  assert.match(palette.foreground, /^hsl\(/);
  assert.match(palette.accent, /^hsl\(/);
  assert.match(palette.muted, /^hsl\(/);
  assert.match(palette.shadow, /^hsl\(/);
});
