/**
 * Pure function to transform PDF bounding boxes from PDF coordinate space
 * to viewport pixel positions using a PDF.js viewport.
 *
 * The viewport's convertToViewportRectangle handles:
 * - Coordinate system conversion (PDF bottom-left → viewport top-left)
 * - Page rotation (0°, 90°, 270°)
 * - Scale factor application
 *
 * Math.min/Math.abs normalize the output regardless of coordinate order.
 */

export interface TransformedBbox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PdfViewport {
  convertToViewportRectangle(rect: number[]): number[];
}

export function transformBboxes(
  viewport: PdfViewport,
  bboxes: number[][]
): TransformedBbox[] {
  return bboxes.map((bbox) => {
    const [l, t, r, b] = bbox;
    const rect = viewport.convertToViewportRectangle([l, t, r, b]);

    return {
      left: Math.min(rect[0], rect[2]),
      top: Math.min(rect[1], rect[3]),
      width: Math.abs(rect[2] - rect[0]),
      height: Math.abs(rect[3] - rect[1]),
    };
  });
}
