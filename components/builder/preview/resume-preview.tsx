"use client";

import { endPrintLayout, settleLayout } from "@/lib/pagination/use-measure";
import { normalizeFontFamily } from "@/lib/schema/style-presets";
import { PAGE_DIMENSIONS } from "@/lib/schema/document";
import {
  EditingProvider,
  useEditing,
} from "@/components/builder/inline/editing-context";
import { SelectionToolbar } from "@/components/builder/inline/selection-toolbar";
import { SelectionRail } from "@/components/builder/inline/selection-rail";
import { toAtsText } from "@/lib/export/ats";
import { useDocument } from "@/lib/schema/use-document";
import { Inspector } from "@/components/builder/inspector/inspector";
import { ColumnFooter } from "@/components/builder/dnd/column-footer";
import { SectionDndProvider } from "@/components/builder/dnd/section-dnd";
import { BuilderToolbar } from "@/components/builder/toolbar/builder-toolbar";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";

import { useEffect, useRef, useState } from "react";

import { ContentEditor } from "@/components/builder/content/content-editor";
import { ImportDialog } from "@/components/builder/ai/import-dialog";
import { QuickAddDialog } from "@/components/builder/ai/quick-add-dialog";
import { ArrangeBoard } from "@/components/builder/arrange/arrange-board";
import { AtsPrintSheet } from "./ats-print-sheet";
import { PaginatedResume } from "./canvas/paginated-resume";

export type BuilderMode = "design" | "content" | "arrange";

/**
 * The editable paper sheet. Lives inside EditingProvider so it can own the
 * selection lifecycle: clicking away from the paper or pressing Escape clears
 * the selection, which is what hides the section/item controllers.
 */
function EditableSheet({
  sheetRef,
  fitScale,
  paperHeight,
  outerWidth,
  sheetStyle,
  children,
}: {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  fitScale: number;
  paperHeight: number;
  outerWidth: number;
  sheetStyle: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { setActivePath } = useEditing();

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const sheet = sheetRef.current;
      const target = e.target as Node | null;
      if (!sheet || !target) return;
      // Radix popovers portal outside the sheet, and the inspector edits the
      // current selection — clicking either must not clear it.
      if (
        sheet.contains(target) ||
        (target instanceof Element &&
          (target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[data-keeps-selection]")))
      )
        return;
      setActivePath(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePath(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setActivePath, sheetRef]);

  return (
    <div
      data-print-passthrough
      data-main-sheet
      style={{
        width: outerWidth,
        height: paperHeight ? paperHeight * fitScale : undefined,
      }}
    >
      <div
        ref={sheetRef}
        data-print-passthrough
        className="relative origin-top-left"
        style={sheetStyle}
      >
        {children}
      </div>
    </div>
  );
}

export function ResumePreview() {
  const { resumeData, settings } = useResumeStore();
  const doc = useDocument();
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDownloading = false;
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  /** Drawer state below lg; the panel is always docked above it. */
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<BuilderMode>("design");
  const [pageCount, setPageCount] = useState(1);
  const [paperHeight, setPaperHeight] = useState(0);
  /** Fit-to-width unless the user has picked a fixed zoom. */
  const scale = zoom === "fit" ? fitScale : zoom;

  // Fit-to-width: scale the paper down when the viewport is narrower than it.
  const paperPxWidth = PAGE_DIMENSIONS[doc.page.size].width;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const styles = getComputedStyle(el);
      const available =
        el.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight);
      setFitScale(Math.min(1, available / paperPxWidth));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paperPxWidth]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setPaperHeight(el.offsetHeight));
    observer.observe(el);
    setPaperHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

  /**
   * Export is the preview. The pages on screen are real page boxes, so
   * printing them through the browser's own engine produces a PDF that
   * matches the editor exactly — there is no second renderer to disagree.
   * Fonts must be resolved first or the sheet prints in a fallback face.
   */
  const handlePrint = async () => {
    await settleLayout();
    window.print();
    endPrintLayout();
  };

  /**
   * A single-column plain-text copy. ATS parsers read a PDF's text stream
   * linearly, so a two-column layout can interleave into nonsense; this is
   * the version to paste into an application form.
   */
  const handleDownloadAts = () => {
    const text = toAtsText(doc, resumeData, settings);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume_ATS.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * "Save as PDF" is the same print pipeline; the browser's print dialog is
   * where the file is written. The document title becomes the default
   * filename, so set it for the duration of the dialog.
   */
  const handleDownloadPdf = async () => {
    const previous = document.title;
    document.title = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume`;
    await settleLayout();
    window.print();
    endPrintLayout();
    document.title = previous;
  };

  /**
   * The same content through the Clean template, for upload to job portals:
   * one column, so the text stream reads top to bottom for any parser.
   * Mounted only for the duration of the print.
   */
  const [atsPrint, setAtsPrint] = useState(false);
  const handleDownloadAtsPdf = async () => {
    const previous = document.title;
    document.title = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume_ATS`;
    setAtsPrint(true);
    document.documentElement.classList.add("rc-print-ats");
    // Let the off-screen sheet mount and paginate before settling.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await settleLayout();
    window.print();
    endPrintLayout();
    document.documentElement.classList.remove("rc-print-ats");
    setAtsPrint(false);
    document.title = previous;
  };

  /** A Word file built from the same single-column structure. */
  const handleDownloadDocx = async () => {
    const { toDocxBlob } = await import("@/lib/export/docx");
    const blob = await toDocxBlob(doc, resumeData, settings);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-print-passthrough
      className="h-full flex flex-col bg-muted relative"
    >
      {atsPrint && <AtsPrintSheet />}
      <BuilderToolbar
        onPrint={handlePrint}
        onDownload={handleDownloadPdf}
        onDownloadAts={handleDownloadAts}
        onDownloadAtsPdf={handleDownloadAtsPdf}
        onDownloadDocx={handleDownloadDocx}
        zoom={zoom}
        fitScale={fitScale}
        onZoom={setZoom}
        onOpenPanel={() => setPanelOpen(true)}
        mode={mode}
        onMode={setMode}
        pageCount={pageCount}
        isDownloading={isDownloading}
      />

      <EditingProvider editable>
        <SectionDndProvider>
          <div data-print-passthrough className="flex-1 flex min-h-0">
            <div
              ref={containerRef}
              data-print-passthrough
              className={cn(
                "flex-1 overflow-auto bg-muted/30",
                mode === "design"
                  ? "p-2 sm:p-6 lg:p-8 flex justify-center"
                  : "p-0",
              )}
            >
              {mode === "content" && <ContentEditor />}
              {mode === "arrange" && <ArrangeBoard />}
              <div className={mode === "design" ? undefined : "hidden"}>
                <EditableSheet
                  sheetRef={contentRef}
                  fitScale={scale}
                  paperHeight={paperHeight}
                  outerWidth={paperPxWidth * scale}
                  sheetStyle={{
                    fontFamily: normalizeFontFamily(settings.fontFamily),
                    width: paperPxWidth,
                    transform: `scale(${scale})`,
                  }}
                >
                  <PaginatedResume
                    onPageCount={setPageCount}
                    columnFooter={(column, pageIndex, freeSpace, count) => (
                      <ColumnFooter
                        column={column}
                        page={pageIndex}
                        freeSpace={freeSpace}
                        index={count}
                      />
                    )}
                    pageWrapper={(page) => (
                      <div
                        className="relative shadow-xl ring-1 ring-black/10"
                        data-print-passthrough
                      >
                        {page}
                      </div>
                    )}
                  />
                </EditableSheet>
              </div>
            </div>
            {mode === "design" && (
              <Inspector
                open={panelOpen}
                onOpenChange={setPanelOpen}
                pageCount={pageCount}
              />
            )}
            {/* Outside the sheet: its fit-to-width transform would otherwise
                become the containing block for these fixed overlays and pull
                them onto the page. */}
            <SelectionToolbar />
            <SelectionRail />
          </div>
        </SectionDndProvider>
        {/* Inside the editing context so quick add can select what it adds. */}
        <ImportDialog />
        <QuickAddDialog />
      </EditingProvider>
    </div>
  );
}
