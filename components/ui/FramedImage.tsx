import type { ImageFrame } from "@/types/storefront";
import Image from "next/image";

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
 * ### CSS strategy
 * The outer `<div>` is `relative overflow-hidden` at whatever size the caller
 * specifies.  When zoom = 1 and no offset, the inner img is positioned at
 * `top:0, left:0, width:100%, height:100%` — identical to plain `object-cover`.
 * When zoom > 1 the img expands past its container; overflow:hidden clips it.
 * offsetX/Y shift the image relative to the zoom-expanded space.
 *
 * For "contain" fit, we fall back to the standard `max-w-full max-h-full`
 * letterboxing approach (zoom/pan disabled — zoom-pan only makes sense for cover).
 */

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
}

export function FramedImage({
  src,
  alt = "",
  frame,
  className = "",
  imgClassName = "",
  sizes = "100vw",
  priority = false,
}: FramedImageProps) {
  const fit = frame?.fit ?? "cover";
  const zoom = frame?.zoom ?? 1.0;
  const offsetX = frame?.offsetX ?? 0;
  const offsetY = frame?.offsetY ?? 0;

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

  // ── cover mode: absolute-positioned img, zoom + pan applied ──────────────
  //
  // width  = zoom * 100%
  // height = zoom * 100%
  //
  // Centering without offset: left = (1 - zoom) * 50%   (negative when zoom > 1)
  //                           top  = (1 - zoom) * 50%
  //
  // With offset (% of container, not of img):
  //   left = (1 - zoom) * 50% + offsetX%
  //   top  = (1 - zoom) * 50% + offsetY%
  //
  const pct = (n: number) => `${n}%`;
  const size = pct(zoom * 100);
  const left = pct((1 - zoom) * 50 + offsetX);
  const top = pct((1 - zoom) * 50 + offsetY);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          width: size,
          height: size,
          left,
          top,
          objectFit: "cover",
        }}
        className={imgClassName}
      />
    </div>
  );
}

export default FramedImage;
