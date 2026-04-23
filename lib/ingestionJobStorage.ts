/**
 * Shared localStorage helper for tracking in-flight RAG ingestion jobs.
 *
 * The upload modal writes an entry after STEP 2 (triggerPdfProcessing) succeeds,
 * and the documents page polls these entries to drive status badges. Using a
 * shared module keeps the key shape (`ingestionJob:<documentId>`) and value
 * shape consistent across both producers and consumers.
 *
 * All functions are SSR-safe — they no-op (or return null) when `window` is
 * undefined, so they can be imported from components that may render on the
 * server.
 */

export type IngestionJob = {
    jobId: string;
    startedAt: string;
};

const keyFor = (documentId: string) => `ingestionJob:${documentId}`;

export function setIngestionJob(documentId: string, jobId: string): void {
    if (typeof window === "undefined") return;

    const payload: IngestionJob = {
        jobId,
        startedAt: new Date().toISOString(),
    };

    try {
        window.localStorage.setItem(keyFor(documentId), JSON.stringify(payload));
    } catch (err) {
        // Storage may be full or disabled (private mode). Don't crash the upload flow.
        console.error("Failed to persist ingestion job to localStorage:", err);
    }
}

export function getIngestionJob(documentId: string): IngestionJob | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(keyFor(documentId));
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<IngestionJob>;
        if (
            !parsed ||
            typeof parsed.jobId !== "string" ||
            typeof parsed.startedAt !== "string"
        ) {
            return null;
        }

        return { jobId: parsed.jobId, startedAt: parsed.startedAt };
    } catch {
        return null;
    }
}

export function clearIngestionJob(documentId: string): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.removeItem(keyFor(documentId));
    } catch {
        // Ignore — nothing actionable if removal fails.
    }
}
