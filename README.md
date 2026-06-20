# Alto ASCII

Alto ASCII is a small, dependency-free browser package for turning broken images into styled ASCII fallbacks. It can also convert a loaded image into ASCII in the browser with Canvas, which is useful for demos, previews, or generated `data-alto-ascii` fallbacks.

The main idea is simple:

- If an image loads, Alto leaves it alone.
- If an image fails, Alto replaces it with a styled fallback element.
- The fallback keeps the original `alt` text available to assistive tech.
- If you provide exact ASCII, Alto uses it.
- If you do not, Alto creates deterministic low-res text art from the `alt` text.

Important: if an image never loads, Alto cannot know the real pixels. Pixel-accurate ASCII requires a loaded image, a same-origin URL, a CORS-readable image, or precomputed ASCII.

## Install

The npm package is not published yet. Until the first npm release, install Alto directly from GitHub:

```sh
npm install github:Mootbing/Alto
```

Import the JavaScript and CSS:

```js
import { installAlto } from "alto-ascii";
import "alto-ascii/style.css";

const stopAlto = installAlto();
```

## Demo

Hosted demo:

```text
https://mootbing.github.io/Alto/
```

Usage docs:

```text
https://mootbing.github.io/Alto/docs/how-to-use.html
```

Run the local demo:

```sh
npm run demo
```

Then open:

```text
http://127.0.0.1:4173/examples/demo.html
```

The demo includes:

- A normal loaded image.
- Broken image fallbacks.
- A real image uploader that converts selected image pixels to ASCII.
- Source-relative scale toggles from `0.25x` up to `4x`.
- Exact columns and rows number inputs that preserve the source image aspect ratio.

The sample photo is a NASA Apollo 11 image of Buzz Aldrin sourced from Wikimedia Commons/NASA.

## Quick Start

```html
<img
  src="/images/missing-kayak.jpg"
  alt="A yellow kayak crossing a blue alpine lake at sunrise"
  data-alto-resolution="high"
/>
```

When the image fails, Alto replaces it with:

```html
<span class="alto-fallback" role="img" aria-label="A yellow kayak crossing a blue alpine lake at sunrise">
  <pre class="alto-fallback__art">...</pre>
</span>
```

## Exact ASCII

Use `data-alto-ascii` when you have handcrafted or precomputed ASCII.

```html
<img
  src="/images/poster.jpg"
  alt="Concert poster with bold diagonal lettering"
  data-alto-ascii="::::://////%%%%&#10;:: POSTER %%&&&#10;//////%%%%&&&&"
/>
```

HTML attributes cannot contain raw line breaks reliably in every authoring context, so use `&#10;` for newlines.

## Data Attributes

Use these attributes on image tags:

```html
<img
  src="/missing.jpg"
  alt="Glass building at night"
  data-alto-resolution="0.5x"
  data-alto-columns="80"
  data-alto-rows="45"
/>
```

Supported attributes:

- `data-alto-resolution`: density preset or source-relative scale.
- `data-alto-columns`: exact ASCII columns.
- `data-alto-cols`: alias for `data-alto-columns`.
- `data-alto-rows`: exact ASCII rows.
- `data-alto-ascii`: exact ASCII text to render.
- `data-alto-ignore`: opt an image out of Alto.

Exact `columns` and `rows` override `resolution`.

## Resolution And Scaling

There are two resolution modes.

For generated alt-text mosaics, use named density presets:

```js
installAlto({ resolution: "low" });
createAsciiAlt("Glass building at night", { resolution: "ultra" });
```

Named presets:

- `tiny`
- `low`
- `medium`
- `high`
- `ultra`

For real image conversion, use source-relative scale values:

```js
const ascii = await imageToAscii(imageElement, {
  resolution: "0.5x"
});
```

Source-relative scales sample the original image dimensions:

- `4x`: four times the source width and height.
- `3x`: three times the source width and height.
- `2x`: twice the source width and height.
- `1x`: full source width and height.
- `0.75x`: 75 percent of source width and height.
- `0.5x`: half source width and height.
- `0.25x`: quarter source width and height.

Rows are derived from the actual source image aspect ratio. For example, a `720x480` image at `0.5x` becomes a `360x240` ASCII grid. Source-relative scales are capped at `4x` before `maxColumns` and `maxRows` are applied.

You can also use exact columns and rows:

```js
const ascii = await imageToAscii(imageElement, {
  columns: 120,
  rows: 80
});
```

## Pixel Image Conversion

`imageToAscii()` converts a loaded image, canvas, video, or image URL into ASCII by drawing it to a Canvas and sampling luminance.

```js
import { createAltoFallback, fitAltoFallback, imageToAscii } from "alto-ascii";
import "alto-ascii/style.css";

const image = document.querySelector("img");
const ascii = await imageToAscii(image, { resolution: "0.5x" });

const fallback = createAltoFallback(image.alt, {
  ascii,
  aspectRatio: image.naturalWidth / image.naturalHeight
});

document.body.append(fallback);
fitAltoFallback(fallback);
```

Canvas security rules apply. Cross-origin images need CORS headers, or the browser will block pixel reads.

## React

React is optional and listed as a peer dependency.

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

The React export is marked with `"use client"` so it can be used inside Next.js App Router projects when rendered as a Client Component.

You can also render ASCII directly:

```jsx
import { AsciiAlt } from "alto-ascii/react";
import "alto-ascii/style.css";

export function Preview({ ascii }) {
  return (
    <AsciiAlt
      alt="Uploaded image preview"
      ascii={ascii}
      aspectRatio={3 / 2}
    />
  );
}
```

## Next.js

Use `alto-ascii/next` when you want Alto fallback behavior on top of `next/image`. Import the stylesheet once from `app/layout.tsx` or `app/globals.css`.

```tsx
// app/layout.tsx
import "alto-ascii/style.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/components/hero-image.tsx
import { AltoNextImage } from "alto-ascii/next";

export function HeroImage() {
  return (
    <AltoNextImage
      src="/apollo-aldrin.jpg"
      alt="Buzz Aldrin standing on the lunar surface during Apollo 11"
      width={1200}
      height={900}
      fallbackResolution="high"
    />
  );
}
```

`AltoNextImage` imports `next/image` and is a Client Component internally because it listens for image load errors. It can still be rendered from Server Components the same way other Client Components can.

For `fill` images, keep the usual Next.js positioned parent:

```tsx
<div className="relative h-80 w-full">
  <AltoNextImage
    fill
    src="/missing-photo.jpg"
    alt="Mountain lake at sunrise"
    className="object-cover"
    fallbackClassName="h-full w-full"
  />
</div>
```

## Tailwind CSS

If your app uses Tailwind, import Alto's Tailwind layer stylesheet instead of the plain stylesheet:

```css
@import "tailwindcss";
@import "alto-ascii/tailwind.css";
```

You can also import it from a Next.js root layout:

```tsx
import "alto-ascii/tailwind.css";
```

Use Tailwind classes for layout and arbitrary CSS variables for Alto's visual tokens:

```tsx
<AltoImage
  src="/missing-photo.jpg"
  alt="Concert poster with bold diagonal lettering"
  className="h-64 w-full rounded-none [--alto-padding:0] [--alto-bg:#ffffff] [--alto-fg:#111827] [--alto-muted:#d1d5db]"
  fallbackResolution="high"
/>
```

## API Reference

### `installAlto(options?)`

Scans for matching images, listens for errors, and replaces broken images with Alto fallbacks. Returns a cleanup function.

```js
const stopAlto = installAlto({
  selector: "img[alt]:not([data-alto-ignore])",
  resolution: "medium",
  onReplace({ image, fallback, alt, ascii }) {
    console.log("Replaced", image, alt, ascii.length);
  }
});
```

Options:

- `selector`: CSS selector for images to enhance. Default: `"img[alt]:not([data-alto-ignore])"`.
- `root`: document or element to scan. Default: `document`.
- `columns`: exact ASCII columns.
- `rows`: exact ASCII rows.
- `resolution`: density preset, number, percentage, or source-relative `x` scale.
- `className`: extra class added to generated fallbacks.
- `preserveClassName`: copy original image classes to fallback. Default: `true`.
- `preserveSize`: copy rendered or attribute size to fallback. Default: `true`.
- `emptyAltText`: visual text used when `alt=""`. Default: `"image unavailable"`.
- `respectEmptyAlt`: keep empty alt decorative for accessibility. Default: `true`.
- `onReplace`: callback called with `{ image, fallback, alt, ascii }`.

### `replaceBrokenImage(image, options?)`

Replaces one `HTMLImageElement` with an Alto fallback and returns the fallback element.

```js
const fallback = replaceBrokenImage(document.querySelector("img"), {
  resolution: "0.5x"
});
```

### `createAltoFallback(alt, options?)`

Creates a fallback element without inserting it into the DOM.

```js
const fallback = createAltoFallback("Portrait of Jules", {
  columns: 48,
  rows: 32
});
```

Options include:

- `ascii`: exact ASCII to render.
- `aspectRatio`: target visual aspect ratio, such as `16 / 9`.
- `className`: extra CSS class.
- `document`: custom DOM document.
- `palette`: custom color palette.
- `respectEmptyAlt`: accessibility behavior for `alt=""`.
- `tagName`: fallback wrapper tag. Default: `span`.

### `createAsciiAlt(alt, options?)`

Creates deterministic ASCII-like text from ordinary alt text.

```js
const art = createAsciiAlt("A red bicycle leaning against a brick wall", {
  resolution: "high"
});
```

Options:

- `columns`
- `rows`
- `charset`
- `emptyAltText`
- `maxWords`
- `resolution`

### `imageToAscii(source, options?)`

Converts a readable image source into ASCII.

```js
const ascii = await imageToAscii("/images/local-photo.jpg", {
  resolution: "0.25x",
  crossOrigin: "anonymous"
});
```

Supported sources:

- URL string.
- `HTMLImageElement`.
- `HTMLCanvasElement`.
- `HTMLVideoElement`.

Options:

- `columns`: exact output columns.
- `rows`: exact output rows.
- `resolution`: source-relative scale such as `4x`, `2x`, `1x`, `0.75x`, `0.5x`, or `0.25x`.
- `charset`: characters ordered from light to dark.
- `crossOrigin`: value applied to URL-created images.
- `document`: custom DOM document.
- `maxColumns`: safety cap for source-relative scaling. Default: `1200`.
- `maxRows`: safety cap for source-relative scaling. Default: `900`.

### `fitAltoFallback(fallback)`

Measures the rendered fallback and scales the ASCII text to fill the fallback content box.

```js
const fallback = createAltoFallback("Image preview", { ascii });
container.append(fallback);
fitAltoFallback(fallback);
```

This is called automatically by `replaceBrokenImage()`. Call it yourself when you create and insert a fallback manually, especially after layout changes.

### `paletteFromAlt(alt)`

Returns deterministic CSS color strings for an alt string.

```js
const palette = paletteFromAlt("Glass building at night");
```

Returns:

```ts
{
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  shadow: string;
}
```

## Styling

Import the default stylesheet:

```js
import "alto-ascii/style.css";
```

The fallback uses CSS custom properties:

```css
.alto-fallback {
  --alto-bg: hsl(220 22% 12%);
  --alto-fg: hsl(48 88% 92%);
  --alto-accent: hsl(180 80% 58%);
  --alto-muted: hsl(220 16% 24%);
  --alto-shadow: hsl(220 28% 6%);
  --alto-radius: 0.5rem;
  --alto-padding: 0.75rem;
}
```

For pixel previews where the ASCII should fill the full image area, remove padding:

```css
.pixel-preview.alto-fallback {
  --alto-padding: 0;
}
```

## Accessibility

Alto preserves meaningful alternative text:

- Non-empty `alt` becomes `role="img"` plus `aria-label`.
- Empty `alt=""` remains decorative by default with `aria-hidden="true"`.
- `data-alto-ascii` is visual only. Keep `alt` descriptive, not raw ASCII.

Do this:

```html
<img alt="Buzz Aldrin standing on the lunar surface during Apollo 11" data-alto-ascii="..." />
```

Avoid this:

```html
<img alt="@@@@%%%%####...." />
```

## Browser Notes

Alto is designed for modern browsers with DOM APIs. Pixel conversion requires Canvas. Automatic fitting uses layout measurement, so call `fitAltoFallback()` after inserting manual fallbacks or after major container size changes.

## Development

```sh
npm test
npm run demo
npm run pack:check
```

This package is ESM-only and requires Node 18 or newer for local tests.

## License

MIT
