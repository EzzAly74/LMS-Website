/**
 * A raster image offered at several widths, for `<img srcset>`.
 *
 * `width`/`height` are the rendered size used for the aspect ratio (they
 * reserve layout space, so the page does not shift when the image loads).
 * They are not the file's pixel size: `srcset` carries that per candidate.
 */
export interface ResponsiveImage {
  readonly src: string;
  readonly srcset: string;
  readonly width: number;
  readonly height: number;
}
