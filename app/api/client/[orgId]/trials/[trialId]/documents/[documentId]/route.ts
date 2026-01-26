/**
 * Individual Trial Document API Route
 * PATCH: Update document metadata (e.g., category)
 */

import { createClient } from "@/lib/supabase/server";
import { withTrialMember } from "@/lib/api/middleware";
import { responses } from "@/lib/api/middleware/types";
import { DOCUMENT_CATEGORY } from "@/lib/constants/documents";
import type { DocumentCategory } from "@/services/documents";

// ============================================================================
// PATCH - Update document metadata
// ============================================================================

export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { documentId } = ctx.params;
  const supabase = await createClient();

  try {
    const body = await req.json();
    const { category } = body;

    if (!category) {
      return responses.badRequest("Category is required");
    }

    // Validate category is valid
    const validCategories = Object.values(DOCUMENT_CATEGORY);
    if (!validCategories.includes(category as DocumentCategory)) {
      return responses.badRequest("Invalid category");
    }

    // Update document
    const { data: document, error } = await supabase
      .from("trial_documents")
      .update({
        category,
        updated_at: new Date().toISOString(),
      })
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
