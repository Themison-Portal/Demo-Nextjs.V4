/**
 * Archive Hook
 * TanStack Query wrapper for response archive
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getArchiveFolders,
  createArchiveFolder,
  getSavedResponses,
  createSavedResponse,
  deleteArchiveFolder,
  deleteSavedResponse,
} from "@/lib/services/client/archive.service";
import type {
  CreateFolderInput,
  CreateSavedResponseInput,
} from "@/types/archive";

/**
 * Get folders for organization
 */
export function useArchiveFolders(orgId: string) {
  return useQuery({
    queryKey: ["archive-folders", orgId],
    queryFn: () => getArchiveFolders(orgId),
  });
}

/**
 * Get saved responses for folder
 */
export function useSavedResponses(folderId: string | null) {
  return useQuery({
    queryKey: ["saved-responses", folderId],
    queryFn: () => getSavedResponses(folderId!),
    enabled: !!folderId,
  });
}

/**
 * Create folder mutation
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderInput) => createArchiveFolder(input),
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
    mutationFn: (input: CreateSavedResponseInput) => createSavedResponse(input),
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
    mutationFn: (folderId: string) => deleteArchiveFolder(folderId),
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
    mutationFn: (responseId: string) => deleteSavedResponse(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-responses"] });
    },
  });
}
