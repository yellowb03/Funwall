import { NextResponse } from "next/server";
import { getDefaultMediaStore } from "@/features/media/media-store";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/media/upload (multipart)
 * Accepts JPEG/PNG/WebP, stores as data URL in memory for local mode.
 * Does not expose any provider secrets. Real Sharp processing lands with 01/storage.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Images must be 10 MB or smaller." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Lightweight magic-byte check (not full Sharp processing in this workstream).
  if (!looksLikeImage(buffer, file.type)) {
    return NextResponse.json(
      { error: "That file could not be uploaded." },
      { status: 400 },
    );
  }

  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  const store = getDefaultMediaStore();
  const asset = store.createFromUpload({
    fileName: file.name || "upload",
    mimeType: file.type,
    url: dataUrl,
    width: 0,
    height: 0,
    alt: typeof form.get("alt") === "string" ? String(form.get("alt")) : undefined,
  });

  return NextResponse.json({ asset });
}

function looksLikeImage(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) return false;
  if (mime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (mime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}
