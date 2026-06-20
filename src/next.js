"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import { AsciiAlt } from "./react.js";

function numberFromDimension(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function aspectRatioFromDimensions(width, height) {
  const parsedWidth = numberFromDimension(width);
  const parsedHeight = numberFromDimension(height);

  return parsedWidth && parsedHeight ? parsedWidth / parsedHeight : undefined;
}

function fallbackSizing({ fill, height, width }) {
  if (fill) {
    return {
      height: "100%",
      inset: 0,
      position: "absolute",
      width: "100%"
    };
  }

  return {
    height,
    width
  };
}

export function AltoNextImage({
  alt = "",
  fallbackAscii,
  fallbackAspectRatio,
  fallbackClassName,
  fallbackColumns,
  fallbackResolution,
  fallbackRows,
  fallbackStyle,
  onError,
  ...imageProps
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return React.createElement(AsciiAlt, {
      alt,
      aspectRatio: fallbackAspectRatio ?? aspectRatioFromDimensions(imageProps.width, imageProps.height),
      ascii: fallbackAscii,
      className: fallbackClassName || imageProps.className,
      columns: fallbackColumns,
      resolution: fallbackResolution,
      rows: fallbackRows,
      style: {
        ...fallbackSizing(imageProps),
        ...fallbackStyle
      }
    });
  }

  return React.createElement(NextImage, {
    ...imageProps,
    alt,
    onError(event) {
      setFailed(true);
      onError?.(event);
    }
  });
}

export const NextAltoImage = AltoNextImage;
