"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createAsciiAlt, fitAltoFallback, paletteFromAlt } from "./index.js";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function cssVariablesForPalette(palette) {
  return {
    "--alto-bg": palette.background,
    "--alto-fg": palette.foreground,
    "--alto-accent": palette.accent,
    "--alto-muted": palette.muted,
    "--alto-shadow": palette.shadow
  };
}

function dimensionsFromArt(art) {
  const lines = String(art).split("\n");

  return {
    columns: lines.reduce((longest, line) => Math.max(longest, line.length), 0) || 40,
    rows: lines.length || 16
  };
}

function xScaleForDimensions(columns, rows, aspectRatio) {
  const targetAspectRatio = Number.isFinite(Number.parseFloat(aspectRatio))
    ? Number.parseFloat(aspectRatio)
    : columns / Math.max(1, rows);
  const textAspectRatio = (columns * 0.62) / Math.max(1, rows * 0.86);
  const xScale = Math.min(3, Math.max(0.5, targetAspectRatio / Math.max(0.1, textAspectRatio)));

  return Number(xScale.toFixed(3));
}

export function AsciiAlt({
  alt = "",
  as: Component = "span",
  aspectRatio,
  ascii,
  className,
  columns,
  rows,
  emptyAltText,
  maxWords,
  resolution,
  respectEmptyAlt = true,
  style,
  ...props
}) {
  const art = useMemo(
    () => ascii || createAsciiAlt(alt, { columns, rows, emptyAltText, maxWords, resolution }),
    [alt, ascii, columns, emptyAltText, maxWords, resolution, rows]
  );
  const palette = useMemo(() => paletteFromAlt(alt || emptyAltText), [alt, emptyAltText]);
  const dimensions = useMemo(() => dimensionsFromArt(art), [art]);
  const fallbackRef = useRef(null);
  const decorative = respectEmptyAlt && String(alt).trim().length === 0;

  useEffect(() => {
    if (fallbackRef.current) {
      fitAltoFallback(fallbackRef.current);
    }
  }, [art, aspectRatio]);

  return (
    React.createElement(
      Component,
      {
        ...props,
        "aria-hidden": decorative ? "true" : props["aria-hidden"],
        "aria-label": decorative ? undefined : props["aria-label"] || alt || emptyAltText || "image unavailable",
        className: classNames("alto-fallback", className),
        ref: fallbackRef,
        role: decorative ? props.role : props.role || "img",
        style: {
          ...cssVariablesForPalette(palette),
          "--alto-columns": String(dimensions.columns),
          "--alto-rows": String(dimensions.rows),
          "--alto-x-scale": String(xScaleForDimensions(dimensions.columns, dimensions.rows, aspectRatio)),
          ...style
        }
      },
      React.createElement("pre", { className: "alto-fallback__art" }, art)
    )
  );
}

export function AltoImage({
  alt = "",
  fallbackAscii,
  fallbackAspectRatio,
  fallbackClassName,
  fallbackColumns,
  fallbackResolution,
  fallbackRows,
  fallbackStyle,
  onError,
  ...imgProps
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return React.createElement(AsciiAlt, {
      alt,
      aspectRatio: fallbackAspectRatio,
      ascii: fallbackAscii,
      className: fallbackClassName || imgProps.className,
      columns: fallbackColumns,
      resolution: fallbackResolution,
      rows: fallbackRows,
      style: {
        width: imgProps.width,
        height: imgProps.height,
        ...fallbackStyle
      }
    });
  }

  return React.createElement("img", {
    ...imgProps,
    alt,
    onError(event) {
      setFailed(true);
      onError?.(event);
    }
  });
}
