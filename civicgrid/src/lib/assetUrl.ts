/**
 * Resolves a public asset path with the correct base URL.
 * In development: base is "/"
 * On GitHub Pages: base is "/CivicGrid/"
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
