/**
 * Message Content - Parses and renders message text with clickable citations
 * Converts references like "(Protocol.pdf, p. 34)" into clickable buttons
 * Renders markdown formatting (bold, headings, lists, etc.)
 *
 * Installation required:
 * npm install react-markdown
 */

"use client";

import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import type { RagSource } from "@/services/rag/types";

interface MessageContentProps {
  content: string;
  sources?: RagSource[];
  onCitationClick: (source: RagSource, index: number) => void;
}

/**
 * Parse text to find citation patterns like:
 * (Protocol_Ulcerative-Colitis.pdf, p. 34)
 * (Protocol_Ulcerative-Colitis.pdf, p. 9; p. 24)
 * (Protocol_Ulcerative-Colitis.pdf, p. 9; Protocol_Ulcerative-Colitis.pdf, p. 29)
 *
 * For each citation, finds the matching source(s) from the sources array
 */
function parseCitations(
  text: string,
  sources: RagSource[]
): Array<{ type: "text" | "citation"; content: string; source?: RagSource; index?: number; pages?: number[] }> {
  // Pattern to match citations (even with trailing punctuation):
  // - (filename.pdf, p. X)
  // - (filename.pdf, p. X; p. Y)
  // - (filename.pdf, p. X; filename.pdf, p. Y)
  // - (filename.pdf, p. X).  <- with period after
  const citationPattern = /\(([^)]+\.pdf[^)]*)\)\.?/gi;

  const parts: Array<{ type: "text" | "citation"; content: string; source?: RagSource; index?: number; pages?: number[] }> = [];
  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const citationContent = match[1]; // Everything inside parentheses

    // Extract file name (first .pdf occurrence)
    const fileNameMatch = citationContent.match(/([^,]+\.pdf)/);
    if (!fileNameMatch) {
      // No valid filename found, treat as text
      parts.push({
        type: "text",
        content: match[0],
      });
      lastIndex = match.index + match[0].length;
      continue;
    }

    const fileName = fileNameMatch[1].trim();

    // Extract all page numbers using a more flexible pattern
    // Matches: "p. 9", "p. 24", etc.
    const pageMatches = citationContent.matchAll(/p\.\s*(\d+)/gi);
    const pageNumbers = Array.from(pageMatches).map(m => parseInt(m[1], 10));

    if (pageNumbers.length === 0) {
      // No page numbers found, treat as text
      parts.push({
        type: "text",
        content: match[0],
      });
      lastIndex = match.index + match[0].length;
      continue;
    }

    // Find the first matching source (we'll use it as primary)
    const firstPage = pageNumbers[0];
    const sourceIndex = sources.findIndex(
      (s) => s.name === fileName && s.page === firstPage
    );

    if (sourceIndex !== -1) {
      parts.push({
        type: "citation",
        content: match[0],
        source: sources[sourceIndex],
        index: sourceIndex,
        pages: pageNumbers, // Store all page numbers for display
      });
    } else {
      // If no matching source, treat as regular text
      parts.push({
        type: "text",
        content: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

/**
 * Extract text from React children recursively
 */
function extractText(children: any): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}

export function MessageContent({ content, sources = [], onCitationClick }: MessageContentProps) {
  // Custom components for markdown rendering
  const components = {
    // Paragraphs with citation parsing
    p: ({ children }: any) => {
      const text = extractText(children);
      const parts = parseCitations(text, sources);

      return (
        <p className="mb-3 last:mb-0">
          {parts.map((part, idx) => (
            <Fragment key={idx}>
              {part.type === "text" ? (
                part.content
              ) : (
                <span className="inline-flex items-center gap-1">
                  {/* Render separate button for each page with spacing */}
                  {part.pages && part.pages.map((pageNum, pageIdx) => {
                    // Find source for this specific page
                    const pageSourceIndex = sources.findIndex(
                      (s) => s.name === part.source?.name && s.page === pageNum
                    );
                    const pageSource = pageSourceIndex !== -1 ? sources[pageSourceIndex] : part.source;

                    return (
                      <button
                        key={pageIdx}
                        onClick={() => {
                          if (pageSource && pageSourceIndex !== -1) {
                            onCitationClick(pageSource, pageSourceIndex);
                          } else if (part.source && part.index !== undefined) {
                            // Fallback to original source
                            onCitationClick(part.source, part.index);
                          }
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors align-baseline"
                        title={`View ${pageSource?.section || ''} on page ${pageNum}`}
                      >
                        p. {pageNum}
                      </button>
                    );
                  })}
                </span>
              )}
            </Fragment>
          ))}
        </p>
      );
    },
    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-semibold mb-2 mt-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-sm font-semibold mb-2 mt-2">{children}</h4>
    ),
    h5: ({ children }: any) => (
      <h5 className="text-sm font-medium mb-1 mt-2">{children}</h5>
    ),
    h6: ({ children }: any) => (
      <h6 className="text-xs font-medium mb-1 mt-1">{children}</h6>
    ),
    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => {
      const text = extractText(children);
      const parts = parseCitations(text, sources);

      return (
        <li className="ml-4">
          {parts.map((part, idx) => (
            <Fragment key={idx}>
              {part.type === "text" ? (
                part.content
              ) : (
                <span className="inline-flex items-center gap-1">
                  {/* Render separate button for each page with spacing */}
                  {part.pages && part.pages.map((pageNum, pageIdx) => {
                    // Find source for this specific page
                    const pageSourceIndex = sources.findIndex(
                      (s) => s.name === part.source?.name && s.page === pageNum
                    );
                    const pageSource = pageSourceIndex !== -1 ? sources[pageSourceIndex] : part.source;

                    return (
                      <button
                        key={pageIdx}
                        onClick={() => {
                          if (pageSource && pageSourceIndex !== -1) {
                            onCitationClick(pageSource, pageSourceIndex);
                          } else if (part.source && part.index !== undefined) {
                            // Fallback to original source
                            onCitationClick(part.source, part.index);
                          }
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors align-baseline"
                        title={`View ${pageSource?.section || ''} on page ${pageNum}`}
                      >
                        p. {pageNum}
                      </button>
                    );
                  })}
                </span>
              )}
            </Fragment>
          ))}
        </li>
      );
    },
    // Strong/Bold
    strong: ({ children }: any) => {
      const text = extractText(children);
      const parts = parseCitations(text, sources);

      // If there are citations in bold text, parse them
      if (parts.some(p => p.type === 'citation')) {
        return (
          <strong className="font-bold">
            {parts.map((part, idx) => (
              <Fragment key={idx}>
                {part.type === "text" ? (
                  part.content
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {part.pages && part.pages.map((pageNum, pageIdx) => {
                      const pageSourceIndex = sources.findIndex(
                        (s) => s.name === part.source?.name && s.page === pageNum
                      );
                      const pageSource = pageSourceIndex !== -1 ? sources[pageSourceIndex] : part.source;

                      return (
                        <button
                          key={pageIdx}
                          onClick={() => {
                            if (pageSource && pageSourceIndex !== -1) {
                              onCitationClick(pageSource, pageSourceIndex);
                            } else if (part.source && part.index !== undefined) {
                              onCitationClick(part.source, part.index);
                            }
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors align-baseline"
                          title={`View ${pageSource?.section || ''} on page ${pageNum}`}
                        >
                          p. {pageNum}
                        </button>
                      );
                    })}
                  </span>
                )}
              </Fragment>
            ))}
          </strong>
        );
      }

      // No citations, just render bold
      return <strong className="font-bold">{children}</strong>;
    },
    // Code
    code: ({ children }: any) => (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ),
  };

  return (
    <div className="text-sm leading-relaxed text-gray-900">
      {/* Main content with markdown */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>

      {/* Sources section */}
      {sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Sources
          </p>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => onCitationClick(source, index)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">
                      {source.name}, p. {source.page}
                      {source.section && (
                        <span className="text-gray-500 ml-1">
                          · {source.section}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                      {source.exactText}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
