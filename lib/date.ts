/**
 * Date utilities for handling timezone-safe date operations
 * Avoids UTC conversion issues with ISO date strings
 */

/**
 * Parse ISO date string as local date (avoiding timezone issues)
 * "2026-01-13" -> Date in local timezone at midnight
 */
export function parseLocalDate(
  dateStr: string | null | undefined
): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format Date for API (YYYY-MM-DD in local timezone)
 * Avoids timezone shift that would occur with toISOString()
 */
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
