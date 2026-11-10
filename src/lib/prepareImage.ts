/**
 * Client-side image preparation for featured image uploads.
 *
 * Downscales and re-encodes the selected file before it is sent to the upload
 * route. This keeps requests under Vercel's ~4.5 MB body limit, produces
 * consistently small files, and strips EXIF metadata (including GPS data)
 * because the image is redrawn to a canvas.
 */

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_EDGE_PX = 1600;
const QUALITY = 0.85;

export class PrepareImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrepareImageError";
  }
}

type ImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

function supportsWebp(): boolean {
  try {
    return document
      .createElement("canvas")
      .toDataURL("image/webp")
      .startsWith("data:image/webp");
  } catch {
    return false;
  }
}

async function loadImageSource(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> decoder.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    image.src = objectUrl;
    await image.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new PrepareImageError("That image could not be read. Try another file.");
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new PrepareImageError("That image could not be processed."));
        }
      },
      type,
      quality,
    );
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new PrepareImageError("Only image files can be used as a featured image.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new PrepareImageError("The image must be 10 MB or smaller.");
  }

  const loaded = await loadImageSource(file);

  try {
    if (!loaded.width || !loaded.height) {
      throw new PrepareImageError("That image could not be read. Try another file.");
    }

    const scale = Math.min(1, MAX_EDGE_PX / Math.max(loaded.width, loaded.height));
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new PrepareImageError("Your browser could not process that image.");
    }

    context.drawImage(loaded.source, 0, 0, width, height);

    const type = supportsWebp() ? "image/webp" : "image/jpeg";
    const blob = await canvasToBlob(canvas, type, QUALITY);
    const extension = type === "image/webp" ? "webp" : "jpg";

    return new File([blob], `featured.${extension}`, { type });
  } finally {
    loaded.cleanup();
  }
}
