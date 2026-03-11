/**
 * RAG Upload Status API Route - Proxy to external RAG backend
 * Checks processing status and updates DB when terminal
 */

import { NextRequest, NextResponse } from "next/server";
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
                progress: stages[stageIndex].progress,          // optional
                progress_percent: stages[stageIndex].progress,
            };

            if (!isCompleted) {
                mockProgress.set(documentId, current + 1);
            }
            // Keep the entry in the map after completion so subsequent polls
            // keep returning "completed" instead of restarting from 0
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
