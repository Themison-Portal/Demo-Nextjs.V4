/**
 * Trial Documents API Route
 * GET: List documents for a trial
 * POST: Upload new document and optionally send to RAG backend
 */

import { createClient } from "@/lib/supabase/server";
import { withTrialMember } from "@/lib/api/middleware";
import { responses } from "@/lib/api/middleware/types";
import { RAG_CONFIG } from "@/lib/constants";
import { DOCUMENT_CATEGORY } from "@/lib/constants/documents";
import type {
  TrialDocument,
  RAGIndexResponse,
  DocumentCategory,
} from "@/services/documents";

// ============================================================================
// GET - List documents
// ============================================================================

export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("trial_documents")
    .select("*")
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Error fetching documents:", error);
    return Response.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }

  return Response.json({
    documents: documents || [],
    total: documents?.length || 0,
  });
});

// ============================================================================
// POST - Upload document
// ============================================================================

export const POST = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string | null;

    if (!file) {
      return responses.badRequest("No file provided");
    }

    if (!category) {
      return responses.badRequest("Category is required");
    }

    // Validate category is valid
    const validCategories = Object.values(DOCUMENT_CATEGORY);
    if (!validCategories.includes(category as DocumentCategory)) {
      return responses.badRequest("Invalid category");
    }

    // Validate file type (only PDFs for now)
    if (file.type !== "application/pdf") {
      return responses.badRequest("Only PDF files are allowed");
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return responses.badRequest("File size exceeds 50MB limit");
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `trials/${trialId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("trial-documents")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[API] Storage upload error:", uploadError);
      return Response.json(
        { error: "Failed to upload file to storage" },
        { status: 500 },
      );
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from("trial-documents")
      .getPublicUrl(storagePath);

    // Create document record in database
    const { data: document, error: dbError } = await supabase
      .from("trial_documents")
      .insert({
        trial_id: trialId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        storage_url: urlData.publicUrl,
        status: "processing",
        category: category,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[API] Database insert error:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("trial-documents").remove([storagePath]);
      return Response.json(
        { error: "Failed to create document record" },
        { status: 500 },
      );
    }

    // Call RAG backend (or mock if localhost)
    let ragSuccess = false;
    let ragError: string | undefined;

    if (RAG_CONFIG.isLocalMock) {
      // Mock RAG processing for development
      console.log("[API] RAG_API_URL is 'localhost', mocking RAG processing");
      ragSuccess = true;

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      // Real RAG backend call
      try {
        const ragResponse = await fetch(
          `${RAG_CONFIG.apiUrl}/upload/upload-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": RAG_CONFIG.apiKey,
            },
            body: JSON.stringify({
              document_id: document.id,
              document_url: urlData.publicUrl,
            }),
          },
        );

        if (!ragResponse.ok) {
          throw new Error(`RAG backend returned ${ragResponse.status}`);
        }

        const ragData: RAGIndexResponse = await ragResponse.json();
        ragSuccess = ragData.status === "succeeded";
        ragError = ragData.error;
      } catch (error) {
        console.error("[API] RAG backend error:", error);
        ragError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Update document status based on RAG result
    const { error: updateError } = await supabase
      .from("trial_documents")
      .update({
        status: ragSuccess ? "ready" : "error",
        processing_error: ragError || null,
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("[API] Failed to update document status:", updateError);
    }

    // Fetch updated document
    const { data: updatedDocument } = await supabase
      .from("trial_documents")
      .select("*")
      .eq("id", document.id)
      .single();

    return Response.json({
      document: updatedDocument || document,
      message: ragSuccess
        ? "Document uploaded and processed successfully"
        : "Document uploaded but processing failed",
    });
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
});
