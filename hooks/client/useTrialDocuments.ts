import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { TrialDocument } from "@/services/documents/types";
import type { DocumentStatus, DocumentProcessingStatus } from "@/services/documents/types";


const POLLING_INTERVAL = 5000;

export function useTrialDocuments(orgId: string, trialId: string) {
    const queryClient = useQueryClient();
    const queryKey = ["client", "trial-documents", trialId];
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelledRef = useRef(false);

    const [processingStatuses, setProcessingStatuses] = useState<
        Map<string, DocumentProcessingStatus>
    >(new Map());

    const statusChangeCallbackRef = useRef<
        ((docId: string, status: DocumentProcessingStatus) => void) | null
    >(null);

    const onProcessingStatusChange = useCallback(
        (callback: (docId: string, status: DocumentProcessingStatus) => void) => {
            statusChangeCallbackRef.current = callback;
        },
        []
    );

    // // Helper to normalize backend status to frontend type
    // function normalizeStatus(status: string): TrialDocument["status"] {
    //     switch (status) {
    //         case "queued":
    //             return "pending";
    //         case "processing":
    //         case "completed":
    //         case "failed":
    //             return status;
    //         default:
    //             return "pending"; // fallback for unknown statuses
    //     }
    // }


    // Explicitly type the query result as TrialDocument[]
    const { data, isLoading, error, refetch } = useQuery<TrialDocument[]>({
        queryKey,
        queryFn: async (): Promise<TrialDocument[]> => {
            const docs = await apiClient.getTrialDocuments(trialId);

            return (docs as any[]).map((doc) => ({
                ...doc,
                // normalize backend status to frontend DocumentStatus
                status:
                    doc.status === "queued"
                        ? "pending"
                        : doc.status === "completed"
                            ? "ready"
                            : doc.status === "failed"
                                ? "error"
                                : (doc.status as DocumentStatus), // "uploading" | "processing"
            })) as TrialDocument[];
        },
        enabled: !!orgId && !!trialId,
    });

    const documents: TrialDocument[] = data || [];

    // Poll processing statuses
    useEffect(() => {
        const processingDocs = documents.filter((d) => d.status === "processing");
        if (!processingDocs.length) {
            setProcessingStatuses(new Map());
            return;
        }

        cancelledRef.current = false;

        const poll = async () => {
            if (cancelledRef.current) return;

            const results = await Promise.allSettled(
                processingDocs.map((doc) => apiClient.getUploadStatus(doc.job_id))
            );

            if (cancelledRef.current) return;

            const statusMap = new Map<string, DocumentProcessingStatus>();

            results.forEach((result: PromiseSettledResult<any>, idx: number) => {
                if (result.status === "fulfilled") {
                    const value = result.value;
                    const status: DocumentProcessingStatus = {
                        document_id: processingDocs[idx].id,
                        status:
                            value.status === "queued"
                                ? "pending"
                                : (value.status as DocumentProcessingStatus["status"]),
                        progress_percent: value.progress_percent ?? 0,
                        current_stage: value.current_stage ?? "unknown",
                        message: value.message ?? "",
                        error: value.error ?? "",
                    };
                    statusMap.set(processingDocs[idx].id, status);
                    statusChangeCallbackRef.current?.(processingDocs[idx].id, status);
                }
            });

            setProcessingStatuses(statusMap);

            // Re-run poll if any documents still processing
            if ([...statusMap.values()].some((s) => s.status === "processing")) {
                timeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
            } else {
                queryClient.invalidateQueries({ queryKey });
            }
        };

        poll();

        return () => {
            cancelledRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [documents.map((d) => d.id).join(",")]);

    // Upload document
    const uploadMutation = useMutation({
        mutationFn: ({ file, documentId }: { file: File; documentId: string }) =>
            apiClient.uploadTrialDocument(file, trialId, documentId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    return {
        documents,
        isLoading,
        error,
        refetch,
        processingStatuses,
        onProcessingStatusChange,
        uploadDocument: uploadMutation.mutateAsync,
        isUploading: uploadMutation.isPending,
    };
}