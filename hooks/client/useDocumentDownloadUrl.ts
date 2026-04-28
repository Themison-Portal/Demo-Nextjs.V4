import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/**
 * Fetch a fresh signed download URL for a trial document.
 *
 * The server signs URLs valid for 1 hour. We cache for half of that (30 min)
 * so the URL handed to a downstream consumer (PDF viewer, download anchor)
 * always has at least ~30 min of validity left — comfortably more than any
 * single PDF download.
 *
 * Pass `enabled=false` until the user actually opens a viewer to avoid
 * signing URLs nobody is going to use. Window-focus refetch keeps URLs fresh
 * when the user tabs back after a long absence.
 *
 * 404 errors (deleted/missing doc) are not retried.
 */

// Half the server's 1h TTL gives a safe re-sign margin before expiry.
// If the server TTL ever changes, update this constant accordingly.
const STALE_TIME_MS = 30 * 60 * 1000; // 30 minutes

export function useDocumentDownloadUrl(
    documentId: string | null | undefined,
    enabled = true,
) {
    return useQuery({
        queryKey: ["client", "document-download-url", documentId],
        queryFn: () => {
            if (!documentId) {
                // Defensive: react-query won't call queryFn when enabled=false,
                // but keep this here so a future edit to `enabled` can't crash.
                throw new Error("documentId is required");
            }
            return apiClient.getDocumentDownloadUrl(documentId);
        },
        enabled: !!documentId && enabled,
        staleTime: STALE_TIME_MS,
        gcTime: STALE_TIME_MS + 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error: any) => {
            const status = error?.status ?? error?.response?.status;
            if (status === 404) return false;
            return failureCount < 2;
        },
    });
}
