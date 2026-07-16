/**
 * Security utilities — URL sanitization, input validation, file checks.
 */

const ALLOWED_URL_PROTOCOLS = ["https:", "http:"];
const ALLOWED_IMAGE_ORIGINS = [
  "pixabay.com",
  "cdn.pixabay.com",
  "supabase.co",
];

/**
 * Sanitize a URL for use in an anchor href.
 * Blocks javascript:, data:, vbscript: and any other non-http(s) protocol.
 * Returns "#" (safe no-op) if the URL is invalid or disallowed.
 */
export function sanitizeHref(url) {
  if (!url || typeof url !== "string") return "#";
  try {
    const parsed = new URL(url);
    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) return "#";
    return url;
  } catch {
    return "#";
  }
}

/**
 * Sanitize a URL for use as an image src.
 * Allows https/http URLs from known domains, blob: URLs (local), and data: URLs
 * that are confirmed image/* base64 (produced by our own code).
 */
export function sanitizeImageSrc(url) {
  if (!url || typeof url !== "string") return "";

  // blob: URLs are created locally by our own code — safe
  if (url.startsWith("blob:")) return url;

  // data: only allow image/* MIME types (produced by our FileReader/canvas)
  if (url.startsWith("data:")) {
    if (/^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,/.test(url)) return url;
    return "";
  }

  try {
    const parsed = new URL(url);
    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) return "";
    return url;
  } catch {
    return "";
  }
}

// ── File upload validation ────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

// Magic-byte signatures for image formats
const MAGIC_SIGNATURES = [
  { bytes: [0xff, 0xd8, 0xff],               mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47],         mime: "image/png"  },
  { bytes: [0x47, 0x49, 0x46, 0x38],         mime: "image/gif"  },
  { bytes: [0x52, 0x49, 0x46, 0x46],         mime: "image/webp", offset: 0, check: (b) => b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50 },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate a File before processing it.
 * Returns { ok: true } or { ok: false, reason: string }
 */
export async function validateImageFile(file) {
  if (!(file instanceof File)) return { ok: false, reason: "Not a file." };

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: `File "${file.name}" exceeds the 10 MB limit.` };
  }

  // Check declared MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: `File type "${file.type}" is not allowed. Use JPEG, PNG, GIF, WebP, or AVIF.` };
  }

  // Read first 12 bytes and verify magic bytes match a known image format
  const header = await readFileHeader(file, 12);
  const bytes  = new Uint8Array(header);
  const matched = MAGIC_SIGNATURES.some((sig) => {
    const prefix = sig.bytes.every((b, i) => bytes[i] === b);
    if (!prefix) return false;
    return sig.check ? sig.check(bytes) : true;
  });

  if (!matched) {
    return { ok: false, reason: `File "${file.name}" does not appear to be a valid image.` };
  }

  return { ok: true };
}

function readFileHeader(file, bytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}
