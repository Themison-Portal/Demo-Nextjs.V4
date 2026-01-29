/**
 * Archive Service
 * Client-side service for managing response archive (folders & saved responses)
 */

import { createClient } from "@/lib/supabase/client";
import type {
  ArchiveFolder,
  SavedResponse,
  CreateFolderInput,
  CreateSavedResponseInput,
} from "@/types/archive";

/**
 * Get all folders for current user in organization
 */
export async function getArchiveFolders(
  orgId: string,
): Promise<ArchiveFolder[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("response_folders")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create new folder
 */
export async function createArchiveFolder(
  input: CreateFolderInput,
): Promise<ArchiveFolder> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("response_folders")
    .insert({
      user_id: user.id,
      org_id: input.org_id,
      trial_id: input.trial_id,
      name: input.name,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get saved responses for a folder
 */
export async function getSavedResponses(
  folderId: string,
): Promise<SavedResponse[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("responses_archived")
    .select("*")
    .eq("folder_id", folderId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create saved response
 */
export async function createSavedResponse(
  input: CreateSavedResponseInput,
): Promise<SavedResponse> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("responses_archived")
    .insert({
      folder_id: input.folder_id,
      user_id: user.id,
      trial_id: input.trial_id,
      org_id: input.org_id,
      title: input.title,
      question: input.question,
      answer: input.answer,
      raw_data: input.raw_data || null,
      document_id: input.document_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating saved response:", error);
    throw error;
  }
  return data;
}

/**
 * Delete folder (soft delete)
 */
export async function deleteArchiveFolder(folderId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("response_folders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", folderId);

  if (error) throw error;
}

/**
 * Delete saved response (soft delete)
 */
export async function deleteSavedResponse(responseId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("responses_archived")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", responseId);

  if (error) throw error;
}
