/**
 * Limits shared by the API route and the share dialog, so the UI can never
 * offer something the server will reject.
 */

/**
 * Ceiling on a stored blob. A resume compresses to a few kilobytes; a
 * downscaled portrait adds tens more. 512 KB is far above any honest
 * document and far below anything worth using this endpoint to host.
 */
export const MAX_BLOB_BYTES = 512 * 1024;

/** Expiry choices, in days. Nothing outlives the longest of these. */
export const EXPIRY_CHOICES = [7, 30, 90, 365] as const;

export const MAX_EXPIRY_DAYS = 365;
export const DEFAULT_EXPIRY_DAYS = 30;

/** New links per address per hour. */
export const CREATE_LIMIT = 10;
export const CREATE_WINDOW_SECONDS = 60 * 60;

export function clampExpiryDays(value: unknown): number {
  const days = Number(value);
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_EXPIRY_DAYS;
  return Math.min(Math.ceil(days), MAX_EXPIRY_DAYS);
}

export function expiryLabel(days: number): string {
  if (days >= 365) return "1 year";
  if (days === 1) return "1 day";
  return `${days} days`;
}
