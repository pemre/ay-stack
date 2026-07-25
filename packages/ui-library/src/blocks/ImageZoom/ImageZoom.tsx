import { useRef, useState } from "react";
import "./ImageZoom.css";
import { DEFAULT_CONFIG } from "./defaults.ts";
import type { ImageZoomProps, ZoomLevel } from "./types.ts";

const SUPPORTED_LEVELS: ZoomLevel[] = [1.5, 2, 2.5, 3];

/**
 * Clamps any numeric value to the nearest supported ZoomLevel.
 * Supported values: 1.5, 2, 2.5, 3.
 * Ties break toward the higher value.
 */
export function clampZoomLevel(level: number): ZoomLevel {
  let best: ZoomLevel = SUPPORTED_LEVELS[0];
  let bestDist = Math.abs(level - best);

  for (let i = 1; i < SUPPORTED_LEVELS.length; i++) {
    const dist = Math.abs(level - SUPPORTED_LEVELS[i]);
    if (dist < bestDist || (dist === bestDist && SUPPORTED_LEVELS[i] > best)) {
      best = SUPPORTED_LEVELS[i];
      bestDist = dist;
    }
  }

  return best;
}

/**
 * Maps a ZoomLevel to the corresponding Tailwind hover scale class.
 */
export function zoomLevelClass(level: ZoomLevel): string {
  switch (level) {
    case 1.5:
      return "hover:scale-[1.5]";
    case 2:
      return "hover:scale-[2]";
    case 2.5:
      return "hover:scale-[2.5]";
    case 3:
      return "hover:scale-[3]";
  }
}

/**
 * Computes transform-origin percentage coordinates from a cursor position
 * and the image's bounding rectangle. Results are clamped to [0, 100].
 */
export function computeTransformOrigin(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
  return { x, y };
}

/**
 * ImageZoom — A Block component that renders a zoomable image with
 * mouse-tracking transform-origin. Hover to zoom into the cursor position.
 */
export function ImageZoom({
  src,
  alt,
  config,
  className,
  imageClassName,
}: ImageZoomProps): JSX.Element {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const clamped = clampZoomLevel(merged.zoomLevel);
  const scaleClass = zoomLevelClass(clamped);

  const imgRef = useRef<HTMLImageElement>(null);
  const [hasError, setHasError] = useState(false);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const { x, y } = computeTransformOrigin(event.clientX, event.clientY, rect);
      imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
  };

  const handleError = () => {
    setHasError(true);
  };

  const isPlaceholder = !src;
  const isDecorative = alt === "";

  const containerClasses = ["image-zoom", "overflow-hidden", "cursor-zoom-in", className]
    .filter(Boolean)
    .join(" ");

  const containerProps: React.HTMLAttributes<HTMLDivElement> = {};
  if (isDecorative) {
    containerProps.role = "img";
  }

  // Placeholder: no src provided
  if (isPlaceholder) {
    return (
      <div className={containerClasses} {...containerProps} data-testid="image-zoom-container">
        <div className="image-zoom__placeholder" data-testid="image-zoom-placeholder">
          No image available
        </div>
      </div>
    );
  }

  // Error fallback: image failed to load
  if (hasError) {
    return (
      <div className={containerClasses} {...containerProps} data-testid="image-zoom-container">
        <div className="image-zoom__fallback" data-testid="image-zoom-fallback">
          {alt}
        </div>
      </div>
    );
  }

  const imgClasses = [
    "w-full",
    "h-full",
    "transition-transform",
    `duration-[${merged.transitionDuration}ms]`,
    scaleClass,
    imageClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses} {...containerProps} data-testid="image-zoom-container">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={imgClasses}
        onMouseMove={handleMouseMove}
        onError={handleError}
        data-testid="image-zoom-img"
      />
    </div>
  );
}
