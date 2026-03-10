'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { CreateFolderInput, CreateSavedResponseInput } from "@/types/archive";

/**
 * Get folders for an organization
 */
export function useArchiveFolders(orgId: string) {
    return useQuery({
        queryKey: ["archive-folders", orgId],
        queryFn: () => apiClient.getArchiveFolders(orgId),
        enabled: !!orgId,
    });
}

/**
 * Get saved responses for a folder
 */
export function useSavedResponses(folderId: string | null) {
    return useQuery({
        queryKey: ["saved-responses", folderId],
        queryFn: () => apiClient.getSavedResponses(folderId!),
        enabled: !!folderId,
    });
}

/**
 * Create folder mutation
 */
export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateFolderInput) => apiClient.createArchiveFolder(input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["archive-folders", variables.org_id],
            });
        },
    });
}

/**
 * Create saved response mutation
 */
export function useCreateSavedResponse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateSavedResponseInput) => apiClient.createSavedResponse(input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["saved-responses", data.folder_id],
            });
        },
    });
}

/**
 * Delete folder mutation
 */
export function useDeleteFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (folderId: string) => apiClient.deleteArchiveFolder(folderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["archive-folders"] });
        },
    });
}

/**
 * Delete saved response mutation
 */
export function useDeleteSavedResponse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (responseId: string) => apiClient.deleteSavedResponse(responseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saved-responses"] });
        },
    });
}