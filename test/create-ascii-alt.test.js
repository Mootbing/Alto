import assert from "node:assert/strict";
import test from "node:test";
import { ALTO_RESOLUTION_PRESETS, createAsciiAlt, imageToAscii, paletteFromAlt } from "../src/index.js";

function documentWithPixels(pixelForPoint) {
  return {
    createElement() {
      return {
        getContext() {
          return {
            drawImage() {},
            getImageData(_x, _y, width, height) {
              const data = new Uint8ClampedArray(width * height * 4);

              for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                  const offset = (y * width + x) * 4;
                  const [red, green, blue, alpha = 255] = pixelForPoint(x, y);

                  data[offset] = red;
                  data[offset + 1] = green;
                  data[offset + 2] = blue;
                  data[offset + 3] = alpha;
                }
              }

              return { data };
            }
          };
        }
      };
    }
  };
}

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

test("imageToAscii can return sampled color frame data", async () => {
  const frame = await imageToAscii(
    {
      naturalHeight: 4,
      naturalWidth: 8
    },
    {
      colorMode: "color",
      columns: 8,
      document: documentWithPixels((x) => (x % 2 === 0 ? [255, 0, 0] : [0, 255, 0])),
      output: "frame",
      rows: 4
    }
  );

  assert.equal(frame.columns, 8);
  assert.equal(frame.rows, 4);
  assert.equal(frame.cells.length, 32);
  assert.equal(frame.colorMode, "color");
  assert.equal(frame.ascii.split("\n").length, 4);
  assert.equal(frame.cells[0].color, "rgb(255, 0, 0)");
  assert.equal(frame.cells[1].color, "rgb(0, 255, 0)");
});

test("imageToAscii frame data supports black-and-white colors", async () => {
  const frame = await imageToAscii(
    {
      naturalHeight: 4,
      naturalWidth: 8
    },
    {
      colorMode: "black-and-white",
      columns: 8,
      document: documentWithPixels(() => [255, 0, 0]),
      output: "frame",
      rows: 4
    }
  );
  const channelValues = frame.cells[0].color
    .match(/\d+/g)
    .map((value) => Number.parseInt(value, 10));

  assert.equal(frame.colorMode, "black-and-white");
  assert.equal(channelValues[0], channelValues[1]);
  assert.equal(channelValues[1], channelValues[2]);
});

test("paletteFromAlt returns CSS color strings", () => {
  const palette = paletteFromAlt("Glass building at night");

  assert.match(palette.background, /^hsl\(/);
  assert.match(palette.foreground, /^hsl\(/);
  assert.match(palette.accent, /^hsl\(/);
  assert.match(palette.muted, /^hsl\(/);
  assert.match(palette.shadow, /^hsl\(/);
});
