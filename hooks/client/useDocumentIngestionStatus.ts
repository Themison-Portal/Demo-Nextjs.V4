"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
    clearIngestionJob,
    getIngestionJob,
} from "@/lib/ingestionJobStorage";
import type { DocumentIngestionStatus } from "@/services/documents/types";

const POLL_INTERVAL_MS = 5000;

/**
 * Live RAG ingestion progress for a single document.
 *
 * Looks up the in-flight job_id stashed in localStorage at upload time
 * (see `lib/ingestionJobStorage.ts`) and polls
 * `GET /upload/status/{job_id}` every 5s while the job is still queued or
 * processing. Polling stops automatically once the job reports `complete`
 * or `error`, and the corresponding localStorage entry is cleared so we
 * don't poll a long-finished job after a future page load.
 *
 * Skip cases (no network calls fire):
 *   - `ingestionStatus` is already `ready` / `failed` (terminal on backend)
 *   - No localStorage entry for the document (legacy row, or entry already
 *     cleared after a previous successful poll)
 *
 * Returns the standard React Query result; `data` is `undefined` until the
 * first poll resolves, or for the entire lifetime when polling is skipped.
 */
export function useDocumentIngestionStatus(
    documentId: string,
    ingestionStatus: DocumentIngestionStatus | undefined
) {
    const queryClient = useQueryClient();
    const job = getIngestionJob(documentId);
    const isTerminal = ingestionStatus === "ready" || ingestionStatus === "failed";
    const enabled = !!job && !isTerminal;

    const query = useQuery({
        queryKey: ["ingestion-status", documentId, job?.jobId],
        queryFn: () => apiClient.getUploadJobStatus(job!.jobId),
        enabled,
        refetchInterval: (q) => {
            const data = q.state.data;
            if (!data) return POLL_INTERVAL_MS;
            return data.status === "complete" || data.status === "error"
                ? false
                : POLL_INTERVAL_MS;
        },
        staleTime: 0,
    });

    // When the job hits a terminal state, clear the localStorage entry so
    // future renders skip polling, and invalidate the parent documents
    // query so the persisted `ingestion_status` field is refetched.
    useEffect(() => {
        if (!job) return;
        const status = query.data?.status;
        if (status === "complete" || status === "error") {
            clearIngestionJob(documentId);
            queryClient.invalidateQueries({
                queryKey: ["client", "trial-documents"],
            });
        }
    }, [job, query.data?.status, documentId, queryClient]);

    return query;
}
