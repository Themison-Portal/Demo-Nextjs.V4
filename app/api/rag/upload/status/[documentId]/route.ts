/**
 * RAG Upload Status API Route - Proxy to external RAG backend
 * Checks processing status and updates DB when terminal
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RAG_CONFIG } from "@/lib/constants";
import type { DocumentProcessingStatus } from "@/services/documents";

// Track mock progress per document (dev only)
const mockProgress = new Map<string, number>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing documentId" },
      { status: 400 }
    );
  }

  try {
    let status: DocumentProcessingStatus;

    if (RAG_CONFIG.isLocalMock) {
      // Mock: simulate progress over multiple calls
      const current = mockProgress.get(documentId) || 0;
      const stages = [
        { stage: "starting", progress: 10 },
        { stage: "parsing", progress: 20 },
        { stage: "chunking", progress: 40 },
        { stage: "embedding", progress: 60 },
        { stage: "storing", progress: 80 },
        { stage: "done", progress: 100 },
      ];

      const stageIndex = Math.min(current, stages.length - 1);
      const isCompleted = current >= stages.length - 1;

      status = {
        document_id: documentId,
        status: isCompleted ? "completed" : "processing",
        stage: stages[stageIndex].stage,
        progress: stages[stageIndex].progress,
      };

      mockProgress.set(documentId, current + 1);

      if (isCompleted) {
        mockProgress.delete(documentId);
      }
    } else {
      // Real RAG backend call
      const response = await fetch(
        `${RAG_CONFIG.apiUrl}/upload/status/${documentId}`,
        {
          method: "GET",
          headers: {
            "X-API-KEY": RAG_CONFIG.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`RAG backend returned ${response.status}`);
      }

      status = await response.json();
    }

    // Update DB when terminal status
    if (status.status === "completed" || status.status === "failed") {
      const supabase = await createClient();

      const updateData =
        status.status === "completed"
          ? { status: "ready" as const, processing_error: null }
          : {
              status: "error" as const,
              processing_error: status.error || "Processing failed",
            };

      const { error: updateError } = await supabase
        .from("trial_documents")
        .update(updateData)
        .eq("id", documentId);

      if (updateError) {
        console.error("[API] Failed to update document status:", updateError);
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("RAG status check error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
