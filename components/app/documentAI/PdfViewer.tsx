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
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { RagSource } from "@/services/rag/types";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  url: string;
  source?: RagSource;
  onClose: () => void;
}

function PdfViewerComponent({ url, source, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageWidth] = useState<number>(600);
  const [transformedBboxes, setTransformedBboxes] = useState<
    Array<{ left: number; top: number; width: number; height: number }>
  >([]);

  // Store viewports per page so we can recalculate bboxes on source change
  const pageViewports = useRef<Map<number, any>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToSource = useRef(false);

  // Recalculate bboxes and scroll when source changes
  useEffect(() => {
    hasScrolledToSource.current = false;

    if (!source?.page) {
      setTransformedBboxes([]);
      return;
    }

    // Recalculate bboxes using stored viewport
    const viewport = pageViewports.current.get(source.page);
    if (viewport && source.bboxes && source.bboxes.length > 0) {
      const transformed = source.bboxes.map((bbox: number[]) => {
        const [l, t, r, b] = bbox;
        const rect = viewport.convertToViewportRectangle([l, t, r, b]);

        return {
          left: Math.min(rect[0], rect[2]),
          top: Math.min(rect[1], rect[3]),
          width: Math.abs(rect[2] - rect[0]),
          height: Math.abs(rect[3] - rect[1]),
        };
      });
      setTransformedBboxes(transformed);
    } else {
      setTransformedBboxes([]);
    }

    // Scroll to source page
    const pageEl = pageRefs.current.get(source.page);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      hasScrolledToSource.current = true;
    }
  }, [source]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Store viewport for every page as it loads
  function onPageLoaded(page: any) {
    const viewport = page.getViewport({ scale: 1 });
    const scale = pageWidth / viewport.width;
    const finalViewport = page.getViewport({ scale });
    pageViewports.current.set(page.pageNumber, finalViewport);

    // If this is the source page and bboxes haven't been calculated yet,
    // calculate them now (handles initial load)
    if (
      source?.page === page.pageNumber &&
      source.bboxes &&
      source.bboxes.length > 0 &&
      transformedBboxes.length === 0
    ) {
      const transformed = source.bboxes.map((bbox: number[]) => {
        const [l, t, r, b] = bbox;
        const rect = finalViewport.convertToViewportRectangle([l, t, r, b]);

        return {
          left: Math.min(rect[0], rect[2]),
          top: Math.min(rect[1], rect[3]),
          width: Math.abs(rect[2] - rect[0]),
          height: Math.abs(rect[3] - rect[1]),
        };
      });
      setTransformedBboxes(transformed);

      // Scroll after first render
      requestAnimationFrame(() => {
        if (!hasScrolledToSource.current && source?.page) {
          const pageEl = pageRefs.current.get(source.page);
          if (pageEl) {
            pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
            hasScrolledToSource.current = true;
          }
        }
      });
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
      { root: container, threshold: 0.5 }
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

  const goToPreviousPage = () => {
    const prev = Math.max(1, currentPage - 1);
    scrollToPage(prev);
  };

  const goToNextPage = () => {
    const next = Math.min(numPages, currentPage + 1);
    scrollToPage(next);
  };

  const setPageRef = useCallback(
    (pageNum: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
      } else {
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {source?.name || "Document"}
          </h3>
          {source?.section && (
            <p className="text-xs text-gray-500 truncate">{source.section}</p>
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
                const isSourcePage = source?.page === pageNum;

                return (
                  <div
                    key={pageNum}
                    ref={setPageRef(pageNum)}
                    data-page={pageNum}
                    className="relative shadow-md"
                  >
                    <Page
                      pageNumber={pageNum}
                      width={pageWidth}
                      onLoadSuccess={onPageLoaded}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />

                    {/* Bbox Highlights Overlay - Only on source page */}
                    {isSourcePage && transformedBboxes.length > 0 && (
                      <div className="absolute top-0 left-0 pointer-events-none">
                        {transformedBboxes.map((bbox, index) => (
                          <div
                            key={index}
                            className="absolute bg-yellow-300/40 border border-yellow-400"
                            style={{
                              left: `${bbox.left}px`,
                              top: `${bbox.top}px`,
                              width: `${bbox.width}px`,
                              height: `${bbox.height}px`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
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
