export const MAX_SCREENSHOTS = 5;

const IMAGE_EXT = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

export function contentTypeForFilename(name) {
  const ext = String(name ?? "")
    .slice(String(name ?? "").lastIndexOf("."))
    .toLowerCase();
  return IMAGE_EXT.get(ext) ?? null;
}
