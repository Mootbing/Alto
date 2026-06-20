import type { CSSProperties, ReactElement } from "react";
import type { ImageProps } from "next/image";
import type { AltoResolution } from "./index.js";

export type AltoNextImageProps = ImageProps & {
  fallbackAscii?: string;
  fallbackAspectRatio?: number;
  fallbackClassName?: string;
  fallbackColumns?: number;
  fallbackResolution?: AltoResolution;
  fallbackRows?: number;
  fallbackStyle?: CSSProperties;
};

export function AltoNextImage(props: AltoNextImageProps): ReactElement;

export const NextAltoImage: typeof AltoNextImage;
