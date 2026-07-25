/** Supported zoom magnification levels. */
export type ZoomLevel = 1.5 | 2 | 2.5 | 3;

/** Configuration options for ImageZoom. All fields optional. */
export interface ImageZoomConfig {
  /** Zoom magnification level (default: 3). Clamped to nearest supported value. */
  zoomLevel?: number;
  /** Transition duration in milliseconds (default: 300). */
  transitionDuration?: number;
}

/** Props for the ImageZoom component. */
export interface ImageZoomProps {
  /** Image source URL. */
  src: string;
  /** Alt text for the image. Required for accessibility. */
  alt: string;
  /** Optional configuration overrides. */
  config?: ImageZoomConfig;
  /** Additional CSS class name for the root container. */
  className?: string;
  /** Additional CSS class name for the <img> element. */
  imageClassName?: string;
}
