/**
 * Archive Service (FastAPI BE)
 * Client-side service for managing response archive (folders & saved responses)
 */

import type {
    ArchiveFolder,
    SavedResponse,
    CreateFolderInput,
    CreateSavedResponseInput,
} from "@/types/archive";

/**
 * Helper for API requests
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Request failed");
    }

    return res.json();
}

/**
 * Get all folders for current org
 */
export async function getArchiveFolders(orgId: string): Promise<ArchiveFolder[]> {
    return request<ArchiveFolder[]>(`/api/archive/folders/?org_id=${orgId}`);
}

/**
 * Create new folder
 */
export async function createArchiveFolder(input: CreateFolderInput): Promise<ArchiveFolder> {
    return request<ArchiveFolder>(`/api/archive/folders/`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Delete folder (soft delete)
 */
export async function deleteArchiveFolder(folderId: string): Promise<void> {
    await request<void>(`/api/archive/folders/${folderId}`, {
        method: "DELETE",
    });
}

/**
 * Get saved responses for a folder
 */
export async function getSavedResponses(folderId: string): Promise<SavedResponse[]> {
    return request<SavedResponse[]>(`/api/archive/responses/?folder_id=${folderId}`);
}

/**
 * Create saved response
 */
export async function createSavedResponse(input: CreateSavedResponseInput): Promise<SavedResponse> {
    return request<SavedResponse>(`/api/archive/responses/`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Update saved response
 */
export async function updateSavedResponse(responseId: string, data: Partial<SavedResponse>): Promise<SavedResponse> {
    return request<SavedResponse>(`/api/archive/responses/${responseId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/**
 * Delete saved response
 */
export async function deleteSavedResponse(responseId: string): Promise<void> {
    await request<void>(`/api/archive/responses/${responseId}`, {
        method: "DELETE",
    });
}