"use client";
import Image, { type ImageLoader, type ImageProps } from "next/image";

const CLOUDINARY_IMAGE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

// Cloudinary resizes and converts the image on its CDN, so these requests never
// reach this server's /_next/image optimizer (CPU-heavy on shared hosting).
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const [, base, rest] = src.match(CLOUDINARY_IMAGE)!;
  return `${base}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${rest}`;
};

/**
 * Drop-in replacement for next/image. Cloudinary images use Cloudinary's
 * resizing; everything else (e.g. /images/... served by the backend) keeps the
 * built-in optimizer, whose results are cached (images.minimumCacheTTL).
 */
export default function AppImage(props: ImageProps) {
  const { src, loader, unoptimized } = props;
  if (!loader && !unoptimized && typeof src === "string" && CLOUDINARY_IMAGE.test(src)) {
    return <Image {...props} loader={cloudinaryLoader} />;
  }
  return <Image {...props} />;
}
