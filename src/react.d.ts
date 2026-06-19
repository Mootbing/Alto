import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement } from "react";
import type { AltoResolution } from "./index.js";

export type AsciiAltProps<TElement extends ElementType = "span"> =
  Omit<ComponentPropsWithoutRef<TElement>, "children" | "as"> & {
    alt?: string;
    as?: TElement;
    aspectRatio?: number;
    ascii?: string;
    columns?: number;
    emptyAltText?: string;
    maxWords?: number;
    respectEmptyAlt?: boolean;
    resolution?: AltoResolution;
    rows?: number;
    style?: CSSProperties;
  };

export type AltoImageProps = Omit<ComponentPropsWithoutRef<"img">, "children"> & {
  fallbackAscii?: string;
  fallbackAspectRatio?: number;
  fallbackClassName?: string;
  fallbackColumns?: number;
  fallbackResolution?: AltoResolution;
  fallbackRows?: number;
  fallbackStyle?: CSSProperties;
};

export function AsciiAlt<TElement extends ElementType = "span">(
  props: AsciiAltProps<TElement>
): ReactElement;

export function AltoImage(props: AltoImageProps): ReactElement;
