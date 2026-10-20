// Browser-side photo shrinking before upload, so a 5 MB phone photo goes up
// as a small JPEG (and fits the 1 MB server-action and bucket limits).

const MAX_BYTES = 950_000;

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality),
  );
}

// Centre-cropped square, `size`×`size` (profile photos).
export async function squareJpeg(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return toJpeg(canvas, 0.85);
}

// Whole photo, longest side at most `maxSide` (group photos). Lowers the
// quality step by step if a very detailed photo is still too big.
export async function fittedJpeg(file: File, maxSide = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.72, 0.6, 0.5]) {
    const blob = await toJpeg(canvas, quality);
    if (blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("Photo too large");
}
