const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export function logoError(file: File) {
  if (!LOGO_TYPES.includes(file.type)) {
    return "Unsupported image type";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "Logo must be 512KB or smaller";
  }
  return null;
}

/** Converts an uploaded logo into a data URI (resizing happens in the browser) */
export async function logoToDataUri(file: File) {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${base64}`;
}
