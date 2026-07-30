"use client";

import { Button } from "@/components/ui/button";
import { encryptPayload } from "@/lib/share/crypto";
import {
  DEFAULT_EXPIRY_DAYS,
  EXPIRY_CHOICES,
  expiryLabel,
} from "@/lib/share/limits";
import {
  ShareLink,
  readShareLinks,
  rememberShareLink,
  remaining,
} from "@/lib/share/links";
import { buildPayload } from "@/lib/share/payload";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Check, Copy, Link2, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Creates a link that renders this resume read-only.
 *
 * The document is encrypted here, in the browser; the key goes into the URL
 * fragment, which is never sent to a server. What the server receives, and
 * all it can ever hold, is ciphertext.
 */
export function ShareDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const resumeData = useResumeStore((s) => s.resumeData);
  const settings = useResumeStore((s) => s.settings);
  const doc = useResumeStore((s) => s.document);

  const [days, setDays] = useState<number>(DEFAULT_EXPIRY_DAYS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ShareLink | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLinks(readShareLinks());
    setCreated(null);
    setError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const { ciphertext, iv, key } = await encryptPayload(
        buildPayload({ resumeData, settings, document: doc }),
      );
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The key is conspicuously absent from this body.
        body: JSON.stringify({ ciphertext, iv, expiresInDays: days }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error ?? "Could not create the link.");
        return;
      }
      const link: ShareLink = {
        id: body.id,
        url: `${window.location.origin}/r/${body.id}#k=${key}`,
        createdAt: Date.now(),
        expiresAt: body.expiresAt,
      };
      setLinks(rememberShareLink(link));
      setCreated(link);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setCreating(false);
    }
  };

  const copy = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(link.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy. Select the link and copy it manually.");
    }
  };

  return (
    <div
      data-editor-only
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share resume"
        className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border bg-card p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold">Share your resume</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Anyone with the link can view and download this resume — including
          your name, email address and phone number. Treat it like the document
          itself.
        </p>

        {!created && (
          <>
            <div className="mt-5">
              <span className="text-xs font-medium">Link expires after</span>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {EXPIRY_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setDays(choice)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      days === choice
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {expiryLabel(choice)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                After that the copy on the server is deleted and the link stops
                working.
              </p>
            </div>

            <Button
              className="mt-4 w-full"
              onClick={create}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {creating ? "Encrypting…" : "Create link"}
            </Button>
          </>
        )}

        {created && (
          <div className="mt-5">
            <span className="text-xs font-medium">Your link</span>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={created.url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-md border bg-muted/50 px-2.5 py-1.5 font-mono text-[11px]"
              />
              <Button size="sm" onClick={() => copy(created)}>
                {copied === created.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 w-full text-xs"
              onClick={() => setCreated(null)}
            >
              Create another link
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {/* What actually happened, in plain terms. Sharing is the one place
            the product sends anything anywhere, so it says so. */}
        <div className="mt-5 flex gap-2 rounded-md bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Your resume is encrypted on this device before it is uploaded. The
            key stays in the link, after the <code>#</code>, which browsers
            never send to a server — so we hold a file we cannot read. Anyone
            you give the link to can read it.
          </p>
        </div>

        {links.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <span className="text-xs font-medium">Links from this browser</span>
            <ul className="mt-2 space-y-1.5">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
                    /r/{link.id}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    expires {remaining(link.expiresAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(link)}
                    className="shrink-0 rounded p-1 hover:bg-muted"
                    aria-label="Copy link"
                  >
                    {copied === link.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
