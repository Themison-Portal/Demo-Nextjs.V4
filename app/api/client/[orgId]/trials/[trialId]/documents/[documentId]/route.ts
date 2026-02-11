/**
 * Individual Trial Document API Route
 * PATCH: Update document metadata (category, status)
 */

import { createClient } from "@/lib/supabase/server";
import { withTrialMember } from "@/lib/api/middleware";
import { responses } from "@/lib/api/middleware/types";
import { DOCUMENT_CATEGORY, DOCUMENT_STATUS } from "@/lib/constants/documents";
import type { DocumentCategory, DocumentStatus } from "@/services/documents";

const VALID_CATEGORIES = Object.values(DOCUMENT_CATEGORY);
const VALID_STATUSES = Object.values(DOCUMENT_STATUS);

// ============================================================================
// PATCH - Update document metadata
// ============================================================================

export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { documentId } = ctx.params;
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { category, status, processing_error } = body;

    if (!category && !status) {
      return responses.badRequest("At least one field is required (category or status)");
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (category) {
      if (!VALID_CATEGORIES.includes(category as DocumentCategory)) {
        return responses.badRequest("Invalid category");
      }
      updateData.category = category;
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as DocumentStatus)) {
        return responses.badRequest("Invalid status");
      }
      updateData.status = status;
      updateData.processing_error = processing_error || null;
    }

    const { data: document, error } = await supabase
      .from("trial_documents")
      .update(updateData)
      .eq("id", documentId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      console.error("[API] Error updating document:", error);
      return Response.json({ error: "Failed to update document" }, { status: 500 });
    }

    if (!document) {
      return responses.notFound("Document not found");
    }

    return Response.json({
      document,
      message: "Document updated successfully",
    });
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
