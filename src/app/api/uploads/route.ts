import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  POST_IMAGES_BUCKET,
  getSupabaseAdmin,
  isStorageConfigured,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Verifies the bytes are actually the image type the client claims. */
function sniffImageType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Image uploads are not configured." },
      { status: 503 },
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const file = form.get("file");

  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function"
  ) {
    return NextResponse.json(
      { error: "An image file is required." },
      { status: 400 },
    );
  }

  const extension = MIME_EXTENSIONS[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are supported." },
      { status: 415 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "The uploaded image is empty." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "The uploaded image must be at most 4 MB." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (sniffImageType(buffer) !== file.type) {
    return NextResponse.json(
      { error: "That file does not look like a valid image." },
      { status: 415 },
    );
  }

  const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(POST_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading featured image:", error);
    return NextResponse.json(
      { error: "Unable to upload the image. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ path }, { status: 201 });
}
