const DEFAULT_SELECTOR = "img[alt]:not([data-alto-ignore])";
const DEFAULT_CHARSET = " .,:;irsXA253hMHGS#9B&@";
const WORD_JOINER = " ";
const MAX_RESOLUTION_SCALE = 4;

export const ALTO_RESOLUTION_PRESETS = {
  tiny: 0.55,
  low: 0.75,
  medium: 1,
  high: 1.35,
  ultra: 1.75
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? clamp(number, min, max) : fallback;
}

function normalizeAlt(alt) {
  return String(alt ?? "").replace(/\s+/g, " ").trim();
}

function resolutionScale(resolution) {
  if (resolution === undefined || resolution === null || resolution === "") {
    return 1;
  }

  if (typeof resolution === "number") {
    return Number.isFinite(resolution) ? clamp(resolution, 0.25, MAX_RESOLUTION_SCALE) : 1;
  }

  const value = String(resolution).trim().toLowerCase();

  if (value in ALTO_RESOLUTION_PRESETS) {
    return clamp(ALTO_RESOLUTION_PRESETS[value], 0.05, MAX_RESOLUTION_SCALE);
  }

  if (value.endsWith("%")) {
    const percent = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(percent) ? clamp(percent / 100, 0.25, MAX_RESOLUTION_SCALE) : 1;
  }

  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? clamp(numeric, 0.25, MAX_RESOLUTION_SCALE) : 1;
}

function sourceScale(resolution) {
  if (resolution === undefined || resolution === null || resolution === "") {
    return null;
  }

  if (typeof resolution === "number") {
    return Number.isFinite(resolution) ? clamp(resolution, 0.05, MAX_RESOLUTION_SCALE) : null;
  }

  const value = String(resolution).trim().toLowerCase();

  if (value in ALTO_RESOLUTION_PRESETS) {
    return ALTO_RESOLUTION_PRESETS[value];
  }

  if (value.endsWith("x")) {
    const multiplier = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(multiplier) ? clamp(multiplier, 0.05, MAX_RESOLUTION_SCALE) : null;
  }

  if (value.endsWith("%")) {
    const percent = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(percent) ? clamp(percent / 100, 0.05, MAX_RESOLUTION_SCALE) : null;
  }

  return null;
}

function resolveAsciiDimensions(options = {}, defaults = {}) {
  const columnLimit = defaults.columnLimit || 120;
  const rowLimit = defaults.rowLimit || 80;
  const heightOverWidth = Number.isFinite(defaults.heightOverWidth)
    ? defaults.heightOverWidth
    : null;

  const scale = resolutionScale(options.resolution);
  const defaultColumns = clamp(Math.round((defaults.columns || 40) * scale), 8, columnLimit);
  const columns = clampInteger(options.columns, 8, columnLimit, defaultColumns);
  const defaultRows = defaults.rows === undefined
    ? Math.max(8, Math.round(columns * (heightOverWidth ?? 0.38)))
    : clamp(Math.round(defaults.rows * scale), 4, rowLimit);
  const rows = clampInteger(options.rows, 4, rowLimit, defaultRows);

  return { columns, rows, scale };
}

function gridAspectRatio(columns, rows, options = {}) {
  const optionAspect = Number.parseFloat(options.aspectRatio);

  if (Number.isFinite(optionAspect) && optionAspect > 0) {
    return optionAspect;
  }

  return columns / Math.max(1, rows);
}

function setGridStyleProperties(element, columns, rows, options = {}) {
  const targetAspectRatio = gridAspectRatio(columns, rows, options);
  const textAspectRatio = (columns * 0.62) / Math.max(1, rows * 0.86);
  const xScale = clamp(targetAspectRatio / Math.max(0.1, textAspectRatio), 0.5, 3);

  element.style.setProperty("--alto-columns", String(columns));
  element.style.setProperty("--alto-rows", String(rows));
  element.style.setProperty("--alto-x-scale", String(Number(xScale.toFixed(3))));
}

function animationFrame(callback, element) {
  const view = element?.ownerDocument?.defaultView || globalThis;

  if (typeof view.requestAnimationFrame === "function") {
    view.requestAnimationFrame(callback);
    return;
  }

  callback();
}

export function fitAltoFallback(fallback) {
  const art = fallback?.querySelector?.(".alto-fallback__art");

  if (!fallback || !art || typeof fallback.getBoundingClientRect !== "function") {
    return fallback;
  }

  animationFrame(() => {
    const style = fallback.ownerDocument?.defaultView?.getComputedStyle?.(fallback);
    const paddingInline = Number.parseFloat(style?.paddingLeft || "0") + Number.parseFloat(style?.paddingRight || "0");
    const paddingBlock = Number.parseFloat(style?.paddingTop || "0") + Number.parseFloat(style?.paddingBottom || "0");
    const targetWidth = Math.max(1, fallback.clientWidth - paddingInline);
    const targetHeight = Math.max(1, fallback.clientHeight - paddingBlock);
    const artWidth = Math.max(1, art.scrollWidth);
    const artHeight = Math.max(1, art.scrollHeight);

    fallback.style.setProperty("--alto-fit-x", String(Number((targetWidth / artWidth).toFixed(5))));
    fallback.style.setProperty("--alto-fit-y", String(Number((targetHeight / artHeight).toFixed(5))));
  }, fallback);

  return fallback;
}

function dimensionsFromAscii(ascii, fallbackDimensions) {
  const lines = String(ascii).split("\n");
  const rows = lines.length || fallbackDimensions.rows;
  const columns = lines.reduce((longest, line) => Math.max(longest, line.length), 0) || fallbackDimensions.columns;

  return { columns, rows };
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededNoise(seed, x, y) {
  let value = seed + Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function pickWords(text, maxWords) {
  const words = normalizeAlt(text)
    .split(WORD_JOINER)
    .map((word) => word.replace(/[^\w'-]/g, ""))
    .filter((word) => word.length > 1);

  if (words.length <= maxWords) {
    return words;
  }

  const first = words.slice(0, Math.max(1, Math.floor(maxWords / 2)));
  const last = words.slice(words.length - Math.max(1, maxWords - first.length));
  return [...first, ...last];
}

function wrapLabel(words, maxWidth, maxRows) {
  const rows = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      rows.push(current);
    }

    current = word.length > maxWidth ? word.slice(0, maxWidth) : word;

    if (rows.length >= maxRows) {
      break;
    }
  }

  if (current && rows.length < maxRows) {
    rows.push(current);
  }

  return rows;
}

function setTextIntoGrid(grid, labelRows) {
  if (!labelRows.length) {
    return;
  }

  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;
  const startY = Math.max(0, Math.floor(rows / 2 - labelRows.length / 2));

  for (let rowIndex = 0; rowIndex < labelRows.length; rowIndex += 1) {
    const label = labelRows[rowIndex].toUpperCase();
    const y = startY + rowIndex;
    const x = Math.max(0, Math.floor((columns - label.length) / 2));
    const line = grid[y].split("");

    for (let index = 0; index < label.length && x + index < columns; index += 1) {
      const character = label[index];
      line[x + index] = character === " " ? line[x + index] : character;
    }

    grid[y] = line.join("");
  }
}

function dimensionsFromImage(image, options) {
  const rect = typeof image.getBoundingClientRect === "function"
    ? image.getBoundingClientRect()
    : { width: 0, height: 0 };
  const widthAttribute = image.getAttribute?.("width");
  const heightAttribute = image.getAttribute?.("height");
  const width = rect.width || image.width || clampInteger(widthAttribute, 1, 4096, 0) || 320;
  const height = rect.height || image.height || clampInteger(heightAttribute, 1, 4096, 0) || 180;
  const defaultColumns = clamp(Math.round(width / 8), 18, 64);
  const { columns, rows } = resolveAsciiDimensions(options, {
    heightOverWidth: height / Math.max(1, width),
    columnLimit: 240,
    columns: defaultColumns,
    rowLimit: 160,
    rows: clamp(Math.round(defaultColumns * (height / Math.max(1, width))), 8, 160)
  });

  return { width, height, columns, rows };
}

function optionsFromImage(image, options) {
  const dataset = image.dataset || {};

  return {
    ...options,
    columns: dataset.altoColumns || dataset.altoCols || options.columns,
    resolution: dataset.altoResolution || options.resolution,
    rows: dataset.altoRows || options.rows
  };
}

function cssLength(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  return String(value);
}

function styleFallbackSize(fallback, image, options) {
  if (options.preserveSize === false) {
    return;
  }

  const rect = typeof image.getBoundingClientRect === "function"
    ? image.getBoundingClientRect()
    : { width: 0, height: 0 };
  const width = rect.width || image.width || image.getAttribute?.("width");
  const height = rect.height || image.height || image.getAttribute?.("height");

  if (width) {
    fallback.style.inlineSize = cssLength(width);
  }

  if (height) {
    fallback.style.blockSize = cssLength(height);
  }
}

function setPaletteProperties(element, palette) {
  element.style.setProperty("--alto-bg", palette.background);
  element.style.setProperty("--alto-fg", palette.foreground);
  element.style.setProperty("--alto-accent", palette.accent);
  element.style.setProperty("--alto-muted", palette.muted);
  element.style.setProperty("--alto-shadow", palette.shadow);
}

export function paletteFromAlt(alt) {
  const seed = hashString(normalizeAlt(alt) || "alto");
  const hue = seed % 360;
  const accentHue = (hue + 128 + (seed % 64)) % 360;

  return {
    background: `hsl(${hue} 28% 12%)`,
    foreground: `hsl(${(hue + 42) % 360} 88% 92%)`,
    accent: `hsl(${accentHue} 80% 58%)`,
    muted: `hsl(${hue} 18% 28%)`,
    shadow: `hsl(${hue} 34% 6%)`
  };
}

export function createAsciiAlt(alt, options = {}) {
  const visualAlt = normalizeAlt(alt) || normalizeAlt(options.emptyAltText) || "image unavailable";
  const { columns, rows } = resolveAsciiDimensions(options);
  const charset = String(options.charset || DEFAULT_CHARSET);
  const maxWords = clampInteger(options.maxWords, 1, 12, 6);
  const seed = hashString(`${visualAlt}:${columns}:${rows}:${charset}`);
  const centerX = (columns - 1) / 2;
  const centerY = (rows - 1) / 2;
  const grid = [];

  for (let y = 0; y < rows; y += 1) {
    let line = "";

    for (let x = 0; x < columns; x += 1) {
      const dx = (x - centerX) / Math.max(1, centerX);
      const dy = (y - centerY) / Math.max(1, centerY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin((x + seed % 17) * 0.38) + Math.cos((y + seed % 23) * 0.7);
      const texture = seededNoise(seed, x, y);
      const vignette = clamp(1 - distance, 0, 1);
      const value = clamp(0.2 + vignette * 0.44 + wave * 0.08 + texture * 0.28, 0, 1);
      const charIndex = Math.round(value * (charset.length - 1));
      line += charset[charIndex];
    }

    grid.push(line);
  }

  const labelWords = pickWords(visualAlt, maxWords);
  const labelRows = wrapLabel(labelWords, Math.max(4, columns - 6), Math.min(3, rows));
  setTextIntoGrid(grid, labelRows);

  return grid.join("\n");
}

export function createAltoFallback(alt, options = {}) {
  const doc = options.document || globalThis.document;

  if (!doc?.createElement) {
    throw new Error("createAltoFallback requires a DOM document.");
  }

  const text = normalizeAlt(alt);
  const resolvedDimensions = resolveAsciiDimensions(options);
  const ascii = String(options.ascii || createAsciiAlt(text, options));
  const { columns, rows } = options.ascii
    ? dimensionsFromAscii(ascii, resolvedDimensions)
    : resolvedDimensions;
  const fallback = doc.createElement(options.tagName || "span");
  const pre = doc.createElement("pre");
  const classes = ["alto-fallback", options.className].filter(Boolean);
  const decorative = options.respectEmptyAlt !== false && text.length === 0;

  fallback.className = classes.join(" ");
  fallback.dataset.altoFallback = "";
  setGridStyleProperties(fallback, columns, rows, options);
  setPaletteProperties(fallback, options.palette || paletteFromAlt(text || options.emptyAltText));

  if (decorative) {
    fallback.setAttribute("aria-hidden", "true");
  } else {
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", text || normalizeAlt(options.emptyAltText) || "image unavailable");
  }

  pre.className = "alto-fallback__art";
  pre.textContent = ascii;
  fallback.append(pre);

  return fallback;
}

export function replaceBrokenImage(image, options = {}) {
  if (!image || image.dataset?.altoIgnore !== undefined) {
    return null;
  }

  const imageOptions = optionsFromImage(image, options);
  const alt = image.getAttribute?.("alt") ?? "";
  const dimensions = dimensionsFromImage(image, imageOptions);
  const ascii = image.dataset?.altoAscii || imageOptions.ascii;
  const fallback = createAltoFallback(alt, {
    ...imageOptions,
    aspectRatio: dimensions.width / Math.max(1, dimensions.height),
    ascii,
    columns: imageOptions.columns ?? dimensions.columns,
    rows: imageOptions.rows ?? dimensions.rows
  });

  if (imageOptions.preserveClassName !== false && image.className) {
    fallback.className = `${image.className} ${fallback.className}`.trim();
  }

  styleFallbackSize(fallback, image, imageOptions);
  image.replaceWith(fallback);
  fitAltoFallback(fallback);
  imageOptions.onReplace?.({ image, fallback, alt, ascii: fallback.querySelector(".alto-fallback__art")?.textContent ?? "" });

  return fallback;
}

export function installAlto(options = {}) {
  const doc = options.document || globalThis.document;

  if (!doc?.querySelectorAll) {
    return () => {};
  }

  const root = options.root || doc;
  const selector = options.selector || DEFAULT_SELECTOR;
  const observed = new WeakSet();
  const listeners = new Map();

  const enhance = (image) => {
    if (!image || observed.has(image) || image.dataset?.altoIgnore !== undefined) {
      return;
    }

    observed.add(image);

    if (image.complete && image.naturalWidth === 0) {
      replaceBrokenImage(image, options);
      return;
    }

    const onError = () => {
      listeners.delete(image);
      replaceBrokenImage(image, options);
    };

    listeners.set(image, onError);
    image.addEventListener("error", onError, { once: true });
  };

  const scan = (scope) => {
    if (scope.matches?.(selector)) {
      enhance(scope);
    }

    scope.querySelectorAll?.(selector).forEach(enhance);
  };

  scan(root);

  const observer = typeof MutationObserver === "undefined"
    ? null
    : new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            scan(node);
          }
        });
      }
    });

  observer?.observe(root === doc ? doc.documentElement : root, {
    childList: true,
    subtree: true
  });

  return () => {
    observer?.disconnect();
    listeners.forEach((listener, image) => {
      image.removeEventListener("error", listener);
    });
    listeners.clear();
  };
}

function loadImageFromUrl(url, options) {
  const doc = options.document || globalThis.document;

  if (!doc?.createElement) {
    return Promise.reject(new Error("imageToAscii requires a DOM document for URL sources."));
  }

  const image = doc.createElement("img");

  if (options.crossOrigin !== undefined) {
    image.crossOrigin = options.crossOrigin;
  }

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${url}`));
    image.src = url;
  });
}

async function resolveDrawable(source, options) {
  if (typeof source === "string") {
    return loadImageFromUrl(source, options);
  }

  if (source?.complete === false) {
    await new Promise((resolve, reject) => {
      source.addEventListener("load", resolve, { once: true });
      source.addEventListener("error", () => reject(new Error("Unable to load image source.")), { once: true });
    });
  }

  return source;
}

export async function imageToAscii(source, options = {}) {
  const doc = options.document || globalThis.document;

  if (!doc?.createElement) {
    throw new Error("imageToAscii requires a DOM document.");
  }

  const drawable = await resolveDrawable(source, options);
  const sourceWidth = drawable.videoWidth || drawable.naturalWidth || drawable.width || 1;
  const sourceHeight = drawable.videoHeight || drawable.naturalHeight || drawable.height || 1;
  const scale = sourceScale(options.resolution);
  const defaultColumns = scale === null ? 64 : Math.round(sourceWidth * scale);
  const defaultRows = scale === null
    ? Math.max(4, Math.round(64 * (sourceHeight / Math.max(1, sourceWidth))))
    : Math.round(sourceHeight * scale);
  const dimensionOptions = scale === null
    ? options
    : { ...options, resolution: undefined };
  const { columns, rows } = resolveAsciiDimensions(dimensionOptions, {
    heightOverWidth: sourceHeight / Math.max(1, sourceWidth),
    columnLimit: options.maxColumns || 1200,
    columns: defaultColumns,
    rowLimit: options.maxRows || 900,
    rows: defaultRows
  });
  const charset = String(options.charset || DEFAULT_CHARSET);
  const canvas = doc.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("imageToAscii could not create a 2D canvas context.");
  }

  canvas.width = columns;
  canvas.height = rows;
  context.drawImage(drawable, 0, 0, columns, rows);

  const pixels = context.getImageData(0, 0, columns, rows).data;
  const lines = [];

  for (let y = 0; y < rows; y += 1) {
    let line = "";

    for (let x = 0; x < columns; x += 1) {
      const offset = (y * columns + x) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const alpha = pixels[offset + 3] / 255;
      const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      const value = clamp(luminance * alpha, 0, 1);
      const charIndex = Math.round(value * (charset.length - 1));
      line += charset[charIndex];
    }

    lines.push(line);
  }

  return lines.join("\n");
}

export const Alto = {
  ALTO_RESOLUTION_PRESETS,
  createAltoFallback,
  createAsciiAlt,
  fitAltoFallback,
  imageToAscii,
  installAlto,
  paletteFromAlt,
  replaceBrokenImage
};
