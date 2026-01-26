/**
 * Response Archive Types
 */

export interface ArchiveFolder {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SavedResponse {
  id: string;
  folder_id: string;
  user_id: string;
  trial_id: string;
  org_id: string;
  title: string;
  question: string;
  answer: string;
  raw_data: {
    question: Record<string, any>;
    answer: Record<string, any>;
  } | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateFolderInput {
  org_id: string;
  name: string;
}

export interface CreateSavedResponseInput {
  folder_id: string;
  trial_id: string;
  org_id: string;
  title: string;
  question: string;
  answer: string;
  raw_data?: {
    question: Record<string, any>;
    answer: Record<string, any>;
  };
  document_id?: string;
}
