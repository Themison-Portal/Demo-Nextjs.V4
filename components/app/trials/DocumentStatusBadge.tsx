/**
 * Documents-table status badge.
 *
 * Replaces the always-"Ready" badge with one that reflects real RAG
 * ingestion state. Reads two signals:
 *
 *   1. `document.ingestion_status` — coarse persisted status from the
 *      backend (`queued | processing | ready | failed | null`). Always
 *      available, including after a hard refresh.
 *   2. The live job poll from `useDocumentIngestionStatus`, which adds a
 *      progress percentage while a job is actively running. Only fires
 *      when there's a localStorage `ingestionJob:<id>` entry from a
 *      recent upload in this browser session.
 *
 * The live job (if present) wins because it has the freshest status and
 * the only source of `progress_percent`. Falls back to the persisted
 * field (for legacy `null` rows we still render "Ready" to preserve
 * the previous behaviour).
 */

"use client";

import { Loader2 } from "lucide-react";
import { useDocumentIngestionStatus } from "@/hooks/client/useDocumentIngestionStatus";
import type { TrialDocument } from "@/services/documents/types";

type BadgeTone = "green" | "yellow" | "gray" | "red";

const TONE_STYLES: Record<BadgeTone, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
};

interface DocumentStatusBadgeProps {
    document: TrialDocument;
}

export function DocumentStatusBadge({ document }: DocumentStatusBadgeProps) {
    const { data: jobStatus } = useDocumentIngestionStatus(
        document.id,
        document.ingestion_status ?? null
    );

    // Live job status wins (has progress %). Fall back to the persisted
    // backend field, then finally to "ready" for legacy rows with no
    // ingestion_status at all (old behaviour preserved).
    const status =
        jobStatus?.status ?? document.ingestion_status ?? "ready";

    const isProcessing = status === "processing";
    const showProgress = isProcessing && jobStatus;

    let tone: BadgeTone;
    let label: string;

    switch (status) {
        case "ready":
        case "complete":
            tone = "green";
            label = "Ready";
            break;
        case "processing":
            tone = "yellow";
            label = showProgress
                ? `Processing (${jobStatus!.progress_percent}%)`
                : "Processing...";
            break;
        case "queued":
            tone = "gray";
            label = "Queued";
            break;
        case "failed":
        case "error":
            tone = "red";
            label = "Failed";
            break;
        default:
            tone = "gray";
            label = "Unknown";
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${TONE_STYLES[tone]} ${isProcessing ? "animate-pulse" : ""
                }`}
        >
            {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
            {label}
        </span>
    );
}
