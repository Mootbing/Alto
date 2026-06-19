# Alto ASCII

Alto ASCII turns broken images into styled, low-resolution text art based on the image's `alt` text. It is meant for the moment where the real image cannot load: users still get a visual placeholder, and assistive tech still gets the original alternative text.

It cannot reconstruct pixels from an image that never arrived. By default it makes a deterministic ASCII-style mosaic from the `alt` text. If you already have a real ASCII render, place it in `data-alto-ascii` and Alto will use that exact text instead.

## Install

```sh
npm install alto-ascii
```

## Browser Usage

```js
import { installAlto } from "alto-ascii";
import "alto-ascii/style.css";

const stopAlto = installAlto();

// Later, if needed:
stopAlto();
```

## Demo

Run the small demo locally:

```sh
npm run demo
```

Then open `http://127.0.0.1:4173/examples/demo.html`.

The demo includes an image uploader that converts the selected image's pixels into ASCII in the browser. The output keeps the same displayed aspect ratio and size as the source preview. The default sample is a NASA Apollo 11 photo of Buzz Aldrin, sourced from Wikimedia Commons/NASA.

```html
<img
  src="/images/missing-kayak.jpg"
  alt="A yellow kayak crossing a blue alpine lake at sunrise"
  data-alto-resolution="high"
/>
```

When the image errors, Alto replaces it with:

```html
<span class="alto-fallback" role="img" aria-label="A yellow kayak crossing a blue alpine lake at sunrise">
  <pre class="alto-fallback__art">...</pre>
</span>
```

## Provide Exact ASCII

Use `data-alto-ascii` when you have a handcrafted or precomputed fallback.

```html
<img
  src="/images/poster.jpg"
  alt="Concert poster with bold diagonal lettering"
  data-alto-ascii="::::://////%%%%&#10;:: POSTER %%&&&#10;//////%%%%&&&&"
/>
```

## Generate Text Directly

```js
import { createAsciiAlt, paletteFromAlt } from "alto-ascii";

const art = createAsciiAlt("A red bicycle leaning against a brick wall", {
  resolution: "high"
});

const palette = paletteFromAlt("A red bicycle leaning against a brick wall");
```

## Resolution

Use a named preset when you just want the fallback to be coarser or more detailed:

```js
installAlto({ resolution: "low" });
createAsciiAlt("Glass building at night", { resolution: "ultra" });
```

For real image conversion, use source-relative scale values:

```js
const ascii = await imageToAscii(imageElement, { resolution: "0.5x" });
```

`1x` samples every source pixel, `0.75x` samples three quarters of the source dimensions, `0.5x` samples half, and `0.25x` samples a quarter. Rows are derived from the source image aspect ratio.

You can also set density per broken image fallback:

```html
<img src="/missing.jpg" alt="Glass building at night" data-alto-resolution="0.5x" />
```

Available density presets are `tiny`, `low`, `medium`, `high`, and `ultra`. You can also pass a scale like `0.75x`, `0.8`, or `"50%"`.

For exact control, use `columns` and `rows`, or `data-alto-columns` and `data-alto-rows`. Exact dimensions override the preset.

## Optional React Usage

```jsx
import { AltoImage } from "alto-ascii/react";
import "alto-ascii/style.css";

export function Avatar() {
  return (
    <AltoImage
      src="/avatars/jules.png"
      alt="Portrait of Jules in a green jacket"
      fallbackResolution="high"
    />
  );
}
```

## API

### `installAlto(options?)`

Watches matching images and replaces broken ones with Alto fallbacks. Returns a cleanup function.

Options:

- `selector`: CSS selector for images to enhance. Default: `"img[alt]:not([data-alto-ignore])"`.
- `root`: Document or element to scan. Default: `document`.
- `columns`: ASCII columns. Default is estimated from the image size.
- `rows`: ASCII rows. Default is estimated from the image size.
- `resolution`: Named preset or scale for easier density control. Supports `tiny`, `low`, `medium`, `high`, `ultra`, numbers, and percentages.
- `className`: Extra class added to generated fallbacks.
- `preserveClassName`: Copy the original image classes to the fallback. Default: `true`.
- `preserveSize`: Copy rendered or attribute dimensions to the fallback. Default: `true`.
- `emptyAltText`: Visual text used when `alt=""`. Default: `"image unavailable"`.
- `respectEmptyAlt`: Keep `alt=""` decorative for accessibility. Default: `true`.
- `onReplace`: Callback called with `{ image, fallback, alt, ascii }`.

### `replaceBrokenImage(image, options?)`

Replaces one `HTMLImageElement` and returns the fallback element.

### `createAltoFallback(alt, options?)`

Creates the fallback element without inserting it.

### `createAsciiAlt(alt, options?)`

Returns the deterministic ASCII text.

### `imageToAscii(source, options?)`

Converts an already-loaded browser image, canvas, or image URL to ASCII using Canvas. This requires the image to be readable by Canvas, so cross-origin images need proper CORS headers.

### `paletteFromAlt(alt)`

Returns the deterministic CSS color values Alto uses for that `alt` text.

## Accessibility Notes

Alto preserves non-empty alt text by setting `role="img"` and `aria-label`. Empty `alt=""` is treated as decorative by default, so the fallback is marked `aria-hidden="true"` even though it still shows a visual unavailable-image pattern.
