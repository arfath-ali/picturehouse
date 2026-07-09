export function createSlug(contentTitle: string) {
  if (!contentTitle) return "";
  return contentTitle
    .toLowerCase()
    .trim()
    .replace(/['’]*/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
