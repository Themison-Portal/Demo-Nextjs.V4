/**
 * PDF Viewer with Highlight Support
 * Renders all PDF pages in a continuous scrollable view with bbox highlighting overlays
 *
 * Installation required:
 * npm install react-pdf pdfjs-dist
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  transformBboxes,
  type TransformedBbox,
} from "@/lib/pdf/transform-bboxes";
import type { RagSource } from "@/services/rag/types";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const PAGE_WIDTH = 600;

interface HighlightBbox extends TransformedBbox {
  isSelected: boolean;
}

interface PdfViewerProps {
  url: string;
  sources?: RagSource[];
  selectedSourceIndex?: number;
  /** When true, all bboxes on the page get equal highlight (inline citation click) */
  highlightAll?: boolean;
  onClose: () => void;
}

function PdfViewerComponent({
  url,
  sources = [],
  selectedSourceIndex,
  highlightAll = false,
  onClose,
}: PdfViewerProps) {
  const selectedSource =
    selectedSourceIndex !== undefined
      ? sources[selectedSourceIndex]
      : undefined;

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [bboxes, setBboxes] = useState<HighlightBbox[]>([]);

  // Viewports cached per page — populated once by onLoadSuccess, read by effect
  const pageViewports = useRef<Map<number, any>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Incremented when the source page's viewport becomes available
  const [viewportReady, setViewportReady] = useState(0);

  // Recalculate bboxes for ALL sources on the selected page + scroll
  useEffect(() => {
    if (!selectedSource?.page) {
      setBboxes([]);
      return;
    }

    const targetPage = selectedSource.page;
    const viewport = pageViewports.current.get(targetPage);
    if (!viewport) return; // Will re-run when viewportReady increments

    // Collect bboxes from ALL sources on this page
    // highlightAll = true (inline click) → all equal; false (source click) → differential
    const allBboxes: HighlightBbox[] = [];
    sources.forEach((src, idx) => {
      if (src.page === targetPage && src.bboxes?.length) {
        const transformed = transformBboxes(viewport, src.bboxes);
        for (const bbox of transformed) {
          allBboxes.push({ ...bbox, isSelected: highlightAll || idx === selectedSourceIndex });
        }
      }
    });

    // Render non-selected first, selected on top
    if (!highlightAll) {
      allBboxes.sort((a, b) => Number(a.isSelected) - Number(b.isSelected));
    }
    setBboxes(allBboxes);

    const pageEl = pageRefs.current.get(targetPage);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sources, selectedSourceIndex, highlightAll, viewportReady]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Cache viewport for every page. Signal when the source page is ready.
  function onPageLoaded(page: any) {
    const scale = PAGE_WIDTH / page.getViewport({ scale: 1 }).width;
    pageViewports.current.set(page.pageNumber, page.getViewport({ scale }));

    if (selectedSource?.page === page.pageNumber) {
      setViewportReady((prev) => prev + 1);
    }
  }

  // Track current visible page via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute("data-page"));
            if (pageNum) setCurrentPage(pageNum);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    pageRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages]);

  const scrollToPage = useCallback((pageNum: number) => {
    const pageEl = pageRefs.current.get(pageNum);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const goToPreviousPage = () => scrollToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => scrollToPage(Math.min(numPages, currentPage + 1));

  const setPageRef = useCallback(
    (pageNum: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
      } else {
        pageRefs.current.delete(pageNum);
      }
    },
    [],
  );

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {selectedSource?.name || "Document"}
          </h3>
          {selectedSource?.section && (
            <p className="text-xs text-gray-500 truncate">
              {selectedSource.section}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
          aria-label="Close PDF viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PDF Content - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-96">
              <div className="text-sm text-gray-500">Loading PDF...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96">
              <div className="text-sm text-red-600">Failed to load PDF</div>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map(
              (pageNum) => {
                const isSourcePage = selectedSource?.page === pageNum;

                return (
                  <div
                    key={pageNum}
                    ref={setPageRef(pageNum)}
                    data-page={pageNum}
                    className="relative shadow-md"
                  >
                    <Page
                      pageNumber={pageNum}
                      width={PAGE_WIDTH}
                      onLoadSuccess={onPageLoaded}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                    />

                    {/* Bbox Highlights Overlay - All sources on this page */}
                    {isSourcePage && bboxes.length > 0 && (
                      <div className="absolute top-0 left-0 pointer-events-none">
                        {bboxes.map((bbox, index) => (
                          <div
                            key={index}
                            className={
                              bbox.isSelected
                                ? "absolute bg-yellow-300/40 border-2 border-yellow-300 shadow-sm"
                                : "absolute bg-yellow-200/20 border border-yellow-300/50"
                            }
                            style={{
                              left: `${bbox.left}px`,
                              top: `${bbox.top - 3}px`,
                              width: `${bbox.width}px`,
                              height: `${bbox.height + 5}px`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </Document>
      </div>

      {/* Navigation Footer */}
      {numPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-gray-600">
            Page {currentPage} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export { PdfViewerComponent as PdfViewer };
