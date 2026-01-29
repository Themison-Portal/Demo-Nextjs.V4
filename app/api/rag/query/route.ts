/**
 * RAG Query API Route - Proxy to external RAG backend
 * Handles CORS issues by proxying requests from server-side
 */

import { NextRequest, NextResponse } from "next/server";
import { RAG_CONFIG, isDevelopment } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, documentId, documentName } = body;

    if (!query || !documentId || !documentName) {
      return NextResponse.json(
        { error: "Missing required fields: query, documentId, documentName" },
        { status: 400 }
      );
    }

    // Use mock document in development, real document in production
    const params = isDevelopment
      ? {
          query,
          document_id: RAG_CONFIG.mockDocument.id,
          document_name: RAG_CONFIG.mockDocument.name,
        }
      : {
          query,
          document_id: documentId,
          document_name: documentName,
        };

    // Forward request to external RAG backend
    const response = await fetch(`${RAG_CONFIG.apiUrl}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": RAG_CONFIG.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        { error: error.error || "Failed to query document" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("RAG query error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
