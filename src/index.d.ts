export type AltoPalette = {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  shadow: string;
};

export type AltoResolution =
  | "tiny"
  | "low"
  | "medium"
  | "high"
  | "ultra"
  | number
  | `${number}%`
  | `${number}x`;

export declare const ALTO_RESOLUTION_PRESETS: {
  tiny: 0.55;
  low: 0.75;
  medium: 1;
  high: 1.35;
  ultra: 1.75;
};

export type CreateAsciiAltOptions = {
  columns?: number;
  rows?: number;
  charset?: string;
  emptyAltText?: string;
  maxWords?: number;
  resolution?: AltoResolution;
};

export type CreateAltoFallbackOptions = CreateAsciiAltOptions & {
  ascii?: string;
  className?: string;
  document?: Document;
  palette?: AltoPalette;
  aspectRatio?: number;
  respectEmptyAlt?: boolean;
  tagName?: keyof HTMLElementTagNameMap;
};

export type ReplaceBrokenImageOptions = CreateAltoFallbackOptions & {
  onReplace?: (event: {
    image: HTMLImageElement;
    fallback: HTMLElement;
    alt: string;
    ascii: string;
  }) => void;
  preserveClassName?: boolean;
  preserveSize?: boolean;
};

export type InstallAltoOptions = ReplaceBrokenImageOptions & {
  root?: Document | Element;
  selector?: string;
};

export type ImageToAsciiOptions = CreateAsciiAltOptions & {
  crossOrigin?: "" | "anonymous" | "use-credentials";
  document?: Document;
  maxColumns?: number;
  maxRows?: number;
};

export function createAsciiAlt(alt: string, options?: CreateAsciiAltOptions): string;

export function createAltoFallback(alt: string, options?: CreateAltoFallbackOptions): HTMLElement;

export function replaceBrokenImage(
  image: HTMLImageElement,
  options?: ReplaceBrokenImageOptions
): HTMLElement | null;

export function fitAltoFallback(fallback: HTMLElement): HTMLElement;

export function installAlto(options?: InstallAltoOptions): () => void;

export function imageToAscii(
  source: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  options?: ImageToAsciiOptions
): Promise<string>;

export function paletteFromAlt(alt: string): AltoPalette;

export const Alto: {
  ALTO_RESOLUTION_PRESETS: typeof ALTO_RESOLUTION_PRESETS;
  createAltoFallback: typeof createAltoFallback;
  createAsciiAlt: typeof createAsciiAlt;
  fitAltoFallback: typeof fitAltoFallback;
  imageToAscii: typeof imageToAscii;
  installAlto: typeof installAlto;
  paletteFromAlt: typeof paletteFromAlt;
  replaceBrokenImage: typeof replaceBrokenImage;
};
