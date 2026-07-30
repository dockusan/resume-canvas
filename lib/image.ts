"use client";

/**
 * Downscale an uploaded portrait before it is stored.
 *
 * A phone photo is several megabytes, and as a base64 data URL it grows by a
 * third again. Stored raw it threatens the ~5 MB localStorage budget the whole
 * editor depends on, and it dominates a share payload — the resume itself
 * compresses to a few kilobytes, while an image does not compress at all.
 *
 * The photo is never rendered larger than about 200 CSS pixels, so 512 px on
 * the long edge is generous even on a high-density screen or in print.
 */

const MAX_EDGE = 512;
const JPEG_QUALITY = 0.85;

export async function downscaleImage(file: File): Promise<string> {
  const original = await readAsDataUrl(file);

  // SVG has no intrinsic raster size and re-encoding would rasterise it at a
  // guessed resolution; leave it exactly as uploaded.
  if (file.type === "image/svg+xml") return original;

  let image: HTMLImageElement;
  try {
    image = await loadImage(original);
  } catch {
    return original;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  // Already small enough, and re-encoding would only lose quality.
  if (scale === 1 && original.length < 400_000) return original;

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return original;

  // Transparent PNGs would go black on a JPEG background, so keep the format
  // when the source has an alpha channel and flatten nothing.
  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  if (!keepAlpha) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const encoded = keepAlpha
    ? canvas.toDataURL("image/webp", JPEG_QUALITY)
    : canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  // Never make things worse: a tiny source can encode larger than it started.
  return encoded.length < original.length ? encoded : original;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
