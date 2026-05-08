"use client";

import { useEffect, useRef, useState } from "react";
import type { ImageFrame } from "@/types/storefront";

// ── FramedImage ────────────────────────────────────────────────────────────────

/**
 * Renders an image inside a fixed-size container with optional zoom, pan, and
 * fit-mode controlled by an {@link ImageFrame} sidecar.
 *
 * ### Default behaviour (no frame / all nulls)
 * - `fit` defaults to "cover"  — image fills the container, may crop at edges
 * - `zoom` defaults to 1.0     — no magnification
 * - `offsetX/Y` default to 0   — centred
 *
 * ### CSS strategy (cover mode)
 * The outer `<div>` is `relative overflow-hidden`.  Once the image's natural
 * dimensions are known, the inner img is sized to match the image's own aspect
 * ratio scaled to cover the container (aspect-ratio-aware cover), enabling
 * correct per-axis pan without extra user zoom.
 *
 * IMPORTANT — cached-image handling:
 * `onLoad` does NOT fire for images already in the browser cache.  We also
 * read naturalWidth/naturalHeight in a `useEffect` via a ref so cached images
 * are handled correctly.  Until dims are known the img falls back to a safe
 * centred `objectFit:cover` that never exposes the background.
 */

// ── Pure math helpers (inlined — no cross-repo import) ────────────────────────

function coverBaseSize(imageAR: number, frameAR: number): [number, number] {
  if (imageAR >= frameAR) return [(imageAR / frameAR) * 100, 100];
  return [100, (frameAR / imageAR) * 100];
}

function coverCssStyleAR(
  zoom: number,
  offsetX: number,
  offsetY: number,
  imageAR: number,
  frameAR: number,
): React.CSSProperties {
  const z        = Math.max(1, zoom);
  const [bw, bh] = coverBaseSize(imageAR, frameAR);
  const w        = z * bw;
  const h        = z * bh;
  const maxX     = Math.max(0, (w / 100 - 1) * 50);
  const maxY     = Math.max(0, (h / 100 - 1) * 50);
  const ox       = maxX === 0 ? 0 : Math.max(-maxX, Math.min(maxX, offsetX));
  const oy       = maxY === 0 ? 0 : Math.max(-maxY, Math.min(maxY, offsetY));
  return {
    position:  "absolute",
    width:     `${w}%`,
    height:    `${h}%`,
    left:      `${(100 - w) / 2 + ox}%`,
    top:       `${(100 - h) / 2 + oy}%`,
    objectFit: "cover",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FramedImageProps {
  src: string;
  alt?: string;
  frame?: ImageFrame | null;
  /** Tailwind or inline className applied to the outer container div. */
  className?: string;
  /** Tailwind or inline className applied to the <img> element (contain mode only). */
  imgClassName?: string;
  /** img sizes attribute — kept for call-site compat, not used internally. */
  sizes?: string;
  priority?: boolean;
  /**
   * Aspect ratio of the container (containerWidth / containerHeight, e.g. 4/5 = 0.8).
   * Required for AR-aware cover.  When omitted, falls back to centred objectFit:cover.
   */
  frameAR?: number;
}

export function FramedImage({
  src,
  alt = "",
  frame,
  className = "",
  imgClassName = "",
  frameAR,
}: FramedImageProps) {
  const fit     = frame?.fit     ?? "cover";
  const zoom    = frame?.zoom    ?? 1.0;
  const offsetX = frame?.offsetX ?? 0;
  const offsetY = frame?.offsetY ?? 0;

  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Read natural dimensions — handles both cached (complete=true on mount) and
  // lazy-loaded images.  onLoad on the img element handles the lazy case;
  // this effect handles images already in the browser cache.
  useEffect(() => {
    setImageDims(null); // reset when src changes
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
      setImageDims({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [src]);

  // ── contain mode: standard letterboxing — zoom/pan disabled ──────────────
  if (fit === "contain") {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-full object-contain ${imgClassName}`}
        />
      </div>
    );
  }

  // ── cover mode ────────────────────────────────────────────────────────────
  //
  // Safe fallback when dims are unknown: centred objectFit:cover with no
  // offsets — never exposes the container background regardless of stored
  // offsetX/Y values.
  const canUseAR = imageDims != null && frameAR != null;

  const imgStyle: React.CSSProperties = canUseAR
    ? coverCssStyleAR(zoom, offsetX, offsetY, imageDims!.w / imageDims!.h, frameAR!)
    : { position: "absolute", width: "100%", height: "100%", objectFit: "cover" };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={imgStyle}
        className={imgClassName}
        onLoad={e => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w > 0 && h > 0) setImageDims({ w, h });
        }}
      />
    </div>
  );
}

export default FramedImage;
