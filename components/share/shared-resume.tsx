"use client";

import { EditingProvider } from "@/components/builder/inline/editing-context";
import { PaginatedResume } from "@/components/builder/preview/canvas/paginated-resume";
import { Button } from "@/components/ui/button";
import { toAtsText } from "@/lib/export/ats";
import { ShareDecryptError, decryptPayload } from "@/lib/share/crypto";
import { ShareVersionError, parsePayload } from "@/lib/share/payload";
import { reconcileSections } from "@/lib/schema/migrate";
import {
  ResumeState,
  ResumeStoreProvider,
  createDetachedStore,
} from "@/lib/store/useResumeStore";
import { StoreApi } from "zustand";
import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Why a link failed. Each cause has a different fix, so each gets its own
 * message — "something went wrong" would leave the reader with nothing to do.
 */
type Failure = "no-key" | "not-found" | "cannot-decrypt" | "unsupported";

const FAILURES: Record<Failure, { title: string; body: string }> = {
  "no-key": {
    title: "This link is incomplete",
    body: "The part of the link after the # is missing — chat apps and email clients sometimes cut it off. Ask for the link again, and copy it in full.",
  },
  "not-found": {
    title: "This link has expired",
    body: "Shared resumes are deleted automatically after the period their owner chose. Ask them for a fresh link.",
  },
  "cannot-decrypt": {
    title: "This link could not be opened",
    body: "The key in the link does not match this resume. That usually means the link was altered or only partly copied.",
  },
  unsupported: {
    title: "This link is too old",
    body: "It was created with an earlier version of Resume Canvas and can no longer be read. Ask its owner to share a new link.",
  },
};

interface Loaded {
  store: StoreApi<ResumeState>;
  state: Pick<ResumeState, "resumeData" | "settings" | "document">;
}

export function SharedResume({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // The fragment never reaches a server; reading it here is the only way
      // the key is ever seen, and only by the person holding the link.
      const key = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      ).get("k");
      if (!key) return setFailure("no-key");

      let record: { ciphertext: string; iv: string };
      try {
        const response = await fetch(`/api/share/${id}`, { cache: "no-store" });
        if (!response.ok) return setFailure("not-found");
        record = await response.json();
      } catch {
        return setFailure("not-found");
      }
      if (cancelled) return;

      try {
        const payload = parsePayload(
          await decryptPayload(record.ciphertext, record.iv, key),
        );
        if (cancelled) return;
        const state = {
          resumeData: payload.resumeData,
          settings: payload.settings,
          document: payload.document,
        };
        // A detached store: no localStorage, no undo history, no connection
        // to whatever resume this visitor may have of their own.
        setLoaded({ store: createDetachedStore(state), state });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ShareVersionError)
          return setFailure("unsupported");
        if (error instanceof ShareDecryptError)
          return setFailure("cannot-decrypt");
        setFailure("cannot-decrypt");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (failure) return <Failed failure={failure} />;
  if (!loaded) return <LoadingState />;

  return (
    <ResumeStoreProvider store={loaded.store}>
      <SharedResumeSheet state={loaded.state} />
    </ResumeStoreProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Decrypting resume…</p>
      </div>
    </Shell>
  );
}

function Failed({ failure }: { failure: Failure }) {
  const { title, body } = FAILURES[failure];
  return (
    <Shell>
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Build your own resume</Link>
        </Button>
      </div>
    </Shell>
  );
}

/**
 * The shared document on paper.
 *
 * Deliberately the same `PaginatedResume` the builder uses, so a shared
 * resume is the resume — same pagination, same fonts, same page count — with
 * editing simply switched off.
 */
function SharedResumeSheet({ state }: { state: Loaded["state"] }) {
  const { resumeData, settings, document: doc } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const paperWidth = settings.documentSize === "Letter" ? 816 : 794;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const styles = getComputedStyle(el);
      const available =
        el.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight);
      setScale(Math.min(1, available / paperWidth));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paperWidth]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    setHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const filename = resumeData.personalInfo.fullName.replace(/\s+/g, "_");

  const handlePdf = async () => {
    const previous = window.document.title;
    window.document.title = `${filename}_Resume`;
    await window.document.fonts?.ready;
    window.print();
    window.document.title = previous;
  };

  const handleText = () => {
    const blob = new Blob(
      [toAtsText(reconcileSections(doc, settings), resumeData, settings)],
      {
        type: "text/plain;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${filename}_Resume.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-print-passthrough className="flex min-h-screen flex-col bg-muted">
      <header
        data-editor-only
        className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold hover:opacity-80"
        >
          <FileText className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Resume Canvas</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleText}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Plain text</span>
            <span className="sm:hidden">Text</span>
          </Button>
          <Button size="sm" onClick={handlePdf}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </header>

      <div
        ref={containerRef}
        data-print-passthrough
        className="flex flex-1 justify-center overflow-auto bg-muted/30 p-2 sm:p-6 lg:p-8"
      >
        <EditingProvider editable={false}>
          <div
            data-print-passthrough
            style={{
              width: paperWidth * scale,
              height: height ? height * scale : undefined,
            }}
          >
            <div
              ref={sheetRef}
              data-print-passthrough
              className="relative origin-top-left"
              style={{
                fontFamily: settings.fontFamily,
                width: paperWidth,
                transform: `scale(${scale})`,
              }}
            >
              <PaginatedResume
                pageWrapper={(page) => (
                  <div
                    data-print-passthrough
                    className="relative shadow-xl ring-1 ring-black/10"
                  >
                    {page}
                  </div>
                )}
              />
            </div>
          </div>
        </EditingProvider>
      </div>

      <footer
        data-editor-only
        className="border-t border-border bg-background px-4 py-3 text-center text-xs text-muted-foreground"
      >
        Shared with{" "}
        <Link href="/" className="font-medium text-foreground hover:underline">
          Resume Canvas
        </Link>{" "}
        — a free resume builder that never sees your resume.
      </footer>
    </div>
  );
}
