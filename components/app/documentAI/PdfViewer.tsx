/**
 * PDF Viewer with Highlight Support
 * Renders PDF documents with bbox highlighting overlays
 *
 * Installation required:
 * npm install react-pdf pdfjs-dist
 */

"use client";

import { useState, useEffect } from "react";
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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [transformedBboxes, setTransformedBboxes] = useState<
    Array<{ left: number; top: number; width: number; height: number }>
  >([]);

  // Navigate to source page when source changes
  useEffect(() => {
    if (source?.page) {
      setPageNumber(source.page);
    }
  }, [source]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Transform bboxes when page loads or source changes
  function onPageLoadSuccess(page: any) {
    const viewport = page.getViewport({ scale: 1 });
    const scale = pageWidth / viewport.width;
    const finalViewport = page.getViewport({ scale });
    setPageViewport(finalViewport);

    // Transform bboxes using PDF.js coordinate system
    if (source?.bboxes && source.bboxes.length > 0) {
      const transformed = source.bboxes.map((bbox: number[]) => {
        // bbox from backend: [left, top, right, bottom]
        const [l, t, r, b] = bbox;

        // Convert to viewport rectangle (handles rotation automatically)
        const rect = finalViewport.convertToViewportRectangle([l, t, r, b]);

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
  }

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

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

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div className="relative">
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
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Bbox Highlights Overlay - Only show on correct page */}
            {transformedBboxes.length > 0 && source?.page === pageNumber && (
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
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <span className="text-xs text-gray-600">
          Page {pageNumber} of {numPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export { PdfViewerComponent as PdfViewer };
