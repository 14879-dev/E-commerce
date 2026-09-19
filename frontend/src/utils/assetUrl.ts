/**
 * Normalizes asset URLs (logos, favicons, hero media, product images).
 * If a URL was saved with hardcoded http://localhost:5000 or http://127.0.0.1:5000,
 * strips the origin so it becomes a relative /uploads/... path.
 * This guarantees images load reliably across localhost, LAN/Wi-Fi mobile testing,
 * and production domains without CORS, Mixed Content, or network unreachable errors.
 */
export function normalizeAssetUrl(url?: string | null): string {
  if (!url) return '';
  // Convert any hardcoded localhost/127.0.0.1 on port 5000 to relative path
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/i, '');
}
