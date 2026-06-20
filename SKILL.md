---
name: alto-ascii
description: Alto ASCII image fallback guidance for accessible alt-text-to-ASCII rendering. Use when integrating, debugging, documenting, or building with the alto-ascii package, including broken-image replacement, local image conversion, React or Next usage, CSS imports, resolution controls, and accessible fallback behavior.
metadata:
  priority: 4
  docs:
    - "https://mootbing.github.io/Alto/"
    - "https://github.com/Mootbing/Alto"
  pathPatterns:
    - "package.json"
    - "src/**"
    - "examples/**"
  bashPatterns:
    - "\\bnpm\\s+(?:install|add)\\s+alto-ascii\\b"
    - "\\bpnpm\\s+add\\s+alto-ascii\\b"
    - "\\byarn\\s+add\\s+alto-ascii\\b"
---

# Alto ASCII

Use Alto to turn broken images, planned image fallbacks, or local image previews into accessible ASCII renderings driven by meaningful alt text.

## Install

```bash
npm install alto-ascii
```

Import the stylesheet once in the application entrypoint.

```js
import "alto-ascii/style.css";
```

## Automatic broken-image fallbacks

Use `installAlto()` when ordinary image elements should be observed and replaced only after they fail to load.

```js
import "alto-ascii/style.css";
import { installAlto } from "alto-ascii";

const stopAlto = installAlto({
  resolution: "1x"
});
```

- Keep the original `alt` text specific and human-readable.
- Prefer explicit `data-alto-columns` and `data-alto-rows` when a fallback must match a fixed slot.
- Call the returned cleanup function before tearing down a routed page or temporary preview.

## Planned local conversion

Use `imageToAscii()` when an image loads successfully and the UI intentionally wants an ASCII version.

```js
import { createAltoFallback, fitAltoFallback, imageToAscii } from "alto-ascii";

const image = document.querySelector("img");
const ascii = await imageToAscii(image, {
  columns: 120,
  rows: 64,
  maxColumns: 520,
  maxRows: 340
});

const fallback = createAltoFallback(image.alt, {
  ascii,
  aspectRatio: image.naturalWidth / Math.max(1, image.naturalHeight)
});

image.replaceWith(fallback);
fitAltoFallback(fallback);
```

## Resolution guidance

- Use `resolution` for source-relative scales such as `"4x"`, `"2x"`, `"1x"`, `"0.5x"`, and `"0.25x"`.
- Use explicit `columns` and `rows` for container-aware demos or responsive slots.
- Clamp high-resolution conversions with `maxColumns` and `maxRows`.
- Recompute ASCII after layout changes when the fallback must adapt to the rendered element size.

## Accessibility and browser constraints

- Preserve useful alt text; Alto uses it as the accessible label for the fallback.
- Treat decorative images as decorative and avoid inventing meaningful labels for them.
- Import the CSS so `.alto-fallback` receives the package styling.
- Convert local assets or CORS-safe remote images; browser canvas pixel reads fail for tainted cross-origin images.
