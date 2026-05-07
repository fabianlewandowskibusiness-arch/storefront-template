"use client";

import { useState } from "react";
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
 * The outer `<div>` is `relative overflow-hidden` at whatever size the caller
 * specifies.  Once the image's natural dimensions are known (via onLoad), the
 * inner img is sized to match the image's own aspect ratio scaled to cover the
 * container (aspect-ratio-aware cover).  This makes offsetX/Y panning correct
 * on each axis independently.
 *
 * While dimensions are loading (or when `frameAR` is not supplied), falls back
 * to a uniform square element + `objectFit:cover` — visually correct for the
 * default (zoom=1, offset=0) frame.
 *
 * For "contain" fit, we fall back to the standard `max-w-full max-h-full`
 * letterboxing approach.
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
  // Defensive clamping — guard old/migrated configs with zoom < 1 or
  // offsets that were valid at a different zoom level.
  const z      = Math.max(1, zoom);
  const [bw, bh] = coverBaseSize(imageAR, frameAR);
  const w      = z * bw;
  const h      = z * bh;
  const maxX   = Math.max(0, (w / 100 - 1) * 50);
  const maxY   = Math.max(0, (h / 100 - 1) * 50);
  const ox     = maxX === 0 ? 0 : Math.max(-maxX, Math.min(maxX, offsetX));
  const oy     = maxY === 0 ? 0 : Math.max(-maxY, Math.min(maxY, offsetY));
  return {
    position: "absolute",
    width:    `${w}%`,
    height:   `${h}%`,
    left:     `${(100 - w) / 2 + ox}%`,
    top:      `${(100 - h) / 2 + oy}%`,
    objectFit: "cover",
  };
}

/** Legacy fallback when image dims are not yet known. */
function coverCssStyleLegacy(
  zoom: number,
  offsetX: number,
  offsetY: number,
): React.CSSProperties {
  const z      = Math.max(1, zoom);
  const maxOff = (z - 1) * 50;
  const ox     = maxOff === 0 ? 0 : Math.max(-maxOff, Math.min(maxOff, offsetX));
  const oy     = maxOff === 0 ? 0 : Math.max(-maxOff, Math.min(maxOff, offsetY));
  return {
    position: "absolute",
    width:    `${z * 100}%`,
    height:   `${z * 100}%`,
    left:     `${(1 - z) * 50 + ox}%`,
    top:      `${(1 - z) * 50 + oy}%`,
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
  /** img sizes attribute for Next.js Image — defaults to "100vw". */
  sizes?: string;
  priority?: boolean;
  /**
   * Aspect ratio of the container (containerWidth / containerHeight, e.g. 4/5 = 0.8).
   * When provided, enables aspect-ratio-aware cover math so the pan range is
   * correct per-axis.  When omitted, falls back to legacy uniform-scale formula.
   */
  frameAR?: number;
}

export function FramedImage({
  src,
  alt = "",
  frame,
  className = "",
  imgClassName = "",
  // sizes and priority are kept in the interface for call-site compatibility
  // but are not used — we use a plain <img> for full CSS control.
  frameAR,
}: FramedImageProps) {
  const fit     = frame?.fit     ?? "cover";
  const zoom    = frame?.zoom    ?? 1.0;
  const offsetX = frame?.offsetX ?? 0;
  const offsetY = frame?.offsetY ?? 0;

  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);

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
  // When the image's natural dimensions and the frame's aspect ratio are both
  // known, use the AR-aware formula.  Otherwise fall back to the legacy
  // square-element formula (correct for default offset=0 frames).
  const useAR = imageDims && frameAR != null && imageDims.w > 0 && imageDims.h > 0;
  const imageAR = useAR ? imageDims!.w / imageDims!.h : 1;

  const imgStyle: React.CSSProperties = useAR
    ? coverCssStyleAR(zoom, offsetX, offsetY, imageAR, frameAR!)
    : coverCssStyleLegacy(zoom, offsetX, offsetY);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
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
