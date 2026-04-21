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

    const { data, isLoading, error, refetch } = useQuery<TrialDocument[]>({
        queryKey,
        queryFn: async (): Promise<TrialDocument[]> => {
            const docs = await apiClient.getTrialDocuments(trialId);

            return (docs as any[]).map((doc) => ({
                ...doc,
                file_name: doc.document_name,
                file_type: doc.mime_type,
                storage_path: doc.document_url,
                storage_url: doc.document_url,
                category: doc.document_type,
                job_id: doc.id,
                status:
                    doc.status === "queued"
                        ? "pending"
                        : doc.status === "completed"
                            ? "ready"
                            : doc.status === "active"
                                ? "ready"
                                : doc.status === "failed"
                                    ? "error"
                                    : (doc.status as DocumentStatus),
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
        mutationFn: ({ file, category }: { file: File; category: string }) =>
            apiClient.uploadTrialDocument(file, trialId, file.name, category),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    // Update category
    const updateCategoryMutation = useMutation({
        mutationFn: ({ documentId, category }: { documentId: string; category: string }) =>
            apiClient.updateTrialDocument(documentId, { document_type: category }),
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
        updateCategory: updateCategoryMutation.mutateAsync,
        isUpdatingCategory: updateCategoryMutation.isPending,
    };
}