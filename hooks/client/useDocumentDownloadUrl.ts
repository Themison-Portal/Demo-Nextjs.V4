import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/**
 * Fetch a fresh signed download URL for a trial document.
 *
 * The URL expires after `expires_in_seconds` (currently 1 hour). React Query
 * caches it for slightly less than that to give the FE a small safety margin
 * before the URL goes stale; if a viewer stays open longer, the next remount
 * (or window-focus refetch) gets a fresh URL.
 *
 * Pass `enabled=false` (e.g., until the user actually opens the viewer) to
 * avoid signing URLs that nobody is going to use.
 */
export function useDocumentDownloadUrl(documentId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ["client", "document-download-url", documentId],
        queryFn: () => apiClient.getDocumentDownloadUrl(documentId!),
        enabled: !!documentId && enabled,
        // Re-sign well before the 1h server-side expiry to avoid 401/403 mid-view.
        staleTime: 50 * 60 * 1000, // 50 minutes
        gcTime: 55 * 60 * 1000, // 55 minutes
        refetchOnWindowFocus: true,
    });
}
