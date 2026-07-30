"use client";

/**
 * The links this browser has created, so the share dialog can show what is
 * currently out there and when each one lapses.
 *
 * Deliberately local: the server knows nothing about who created a share, and
 * keeping the list here is what preserves that. A list lost with the browser
 * profile is the acceptable cost.
 */

const KEY = "resume-share-links";

export interface ShareLink {
  id: string;
  /** Full link including the fragment — the key exists nowhere else. */
  url: string;
  createdAt: number;
  expiresAt: number;
}

export function readShareLinks(): ShareLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const links = raw ? (JSON.parse(raw) as ShareLink[]) : [];
    // An expired link is gone from the server, so it has no business here.
    return links
      .filter((l) => l && l.expiresAt > Date.now())
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function rememberShareLink(link: ShareLink): ShareLink[] {
  const links = [link, ...readShareLinks().filter((l) => l.id !== link.id)];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(links));
  } catch {
    // A full quota must not lose the link the user is looking at.
  }
  return links;
}

export function forgetShareLink(id: string): ShareLink[] {
  const links = readShareLinks().filter((l) => l.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(links));
  } catch {
    // Ignored for the same reason as above.
  }
  return links;
}

/** "in 29 days", "in 4 hours" — a link's remaining life at a glance. */
export function remaining(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.round(ms / 86_400_000);
  if (days >= 1) return `in ${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.round(ms / 3_600_000));
  return `in ${hours} hour${hours === 1 ? "" : "s"}`;
}
