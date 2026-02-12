/**
 * Unit Tests — transformBboxes
 *
 * Tests the pure bbox coordinate transformation logic used by PdfViewer.
 * This function converts PDF coordinate-space bboxes into pixel positions
 * using PDF.js viewport.convertToViewportRectangle().
 */

import { describe, it, expect } from 'vitest';
import { transformBboxes } from '@/lib/pdf/transform-bboxes';

/**
 * Creates a mock viewport that simulates PDF.js coordinate transformation.
 * For a non-rotated page, convertToViewportRectangle converts from
 * PDF user space (bottom-left origin) to viewport space (top-left origin):
 *   x' = x * scale
 *   y' = viewportHeight - y * scale
 */
function createMockViewport(scale: number, pageHeightPts: number) {
  const viewportHeight = pageHeightPts * scale;
  return {
    convertToViewportRectangle: (rect: number[]) => {
      const [x1, y1, x2, y2] = rect;
      return [
        x1 * scale,
        viewportHeight - y1 * scale,
        x2 * scale,
        viewportHeight - y2 * scale,
      ];
    },
  };
}

describe('transformBboxes', () => {
  // US Letter: 612 x 792 points
  const PAGE_HEIGHT = 792;

  it('transforms a single bbox correctly', () => {
    const scale = 1;
    const viewport = createMockViewport(scale, PAGE_HEIGHT);
    const bboxes = [[100, 700, 500, 650]]; // [left, top, right, bottom] in PDF coords

    const result = transformBboxes(viewport, bboxes);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      left: 100,
      top: 92, // viewportHeight - 700 = 92
      width: 400, // 500 - 100
      height: 50, // abs(92 - 142) = 50
    });
  });

  it('transforms multiple bboxes', () => {
    const viewport = createMockViewport(1, PAGE_HEIGHT);
    const bboxes = [
      [50, 750, 550, 720],
      [50, 710, 550, 680],
    ];

    const result = transformBboxes(viewport, bboxes);

    expect(result).toHaveLength(2);
    // Each bbox should have valid positive dimensions
    result.forEach((bbox) => {
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
      expect(bbox.left).toBeGreaterThanOrEqual(0);
      expect(bbox.top).toBeGreaterThanOrEqual(0);
    });
  });

  it('scales proportionally with different pageWidths', () => {
    const viewport1 = createMockViewport(1, PAGE_HEIGHT); // scale=1 (e.g. 612px width)
    const viewport2 = createMockViewport(2, PAGE_HEIGHT); // scale=2 (e.g. 1224px width)
    const bboxes = [[100, 700, 500, 650]];

    const result1 = transformBboxes(viewport1, bboxes);
    const result2 = transformBboxes(viewport2, bboxes);

    // At 2x scale, all dimensions should double
    expect(result2[0].left).toBe(result1[0].left * 2);
    expect(result2[0].top).toBe(result1[0].top * 2);
    expect(result2[0].width).toBe(result1[0].width * 2);
    expect(result2[0].height).toBe(result1[0].height * 2);
  });

  it('returns empty array for empty bboxes', () => {
    const viewport = createMockViewport(1, PAGE_HEIGHT);

    expect(transformBboxes(viewport, [])).toEqual([]);
  });

  it('handles inverted coordinates via Math.min/abs', () => {
    // Simulate a viewport that returns coords in unexpected order
    const viewport = {
      convertToViewportRectangle: () => [500, 200, 100, 50],
    };
    const bboxes = [[0, 0, 0, 0]]; // input doesn't matter, mock returns fixed values

    const result = transformBboxes(viewport, bboxes);

    expect(result[0]).toEqual({
      left: 100, // Math.min(500, 100)
      top: 50, // Math.min(200, 50)
      width: 400, // Math.abs(100 - 500)
      height: 150, // Math.abs(50 - 200)
    });
  });
});
