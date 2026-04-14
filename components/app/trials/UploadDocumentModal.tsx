"use client";

import { useState, useRef } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { FileText, ChevronDown, Check } from "lucide-react";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/lib/constants/documents";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;

    // parent provides trialId (important)
    trialId: string;

    isLoading: boolean;
    onSuccess?: () => void;
}

export function UploadDocumentModal({
    isOpen,
    onClose,
    trialId,
    isLoading,
    onSuccess,
}: UploadDocumentModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState<string>("");
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const categoryLabel = DOCUMENT_CATEGORY_OPTIONS.find(
        (c) => c.value === category
    )?.label;

    /**
     * STEP 1: Upload file to backend (/trial-documents/upload)
     * STEP 2: Trigger RAG processing (/upload/upload-pdf)
     */
    const handleUpload = async () => {
        if (!selectedFile || !category) return;

        try {
            setUploading(true);

            // STEP 1: upload file (GCS + DB)
            const doc = await apiClient.uploadTrialDocument(
                selectedFile,
                trialId,
                selectedFile.name,
                category
            );

            // STEP 2: trigger AI processing (RAG pipeline)
            await apiClient.triggerPdfProcessing(
                doc.document_url,
                doc.id
            );

            console.log("Upload + RAG processing started");

            handleClose();
            onSuccess?.();
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setCategory("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
            <ModalHeader onClose={handleClose}>Upload Document</ModalHeader>

            <ModalBody className="space-y-4">
                {/* FILE PICKER */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        PDF File *
                    </label>

                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            disabled={isLoading || uploading}
                            className="hidden"
                            id="file-upload-modal"
                        />

                        <label
                            htmlFor="file-upload-modal"
                            className="flex items-center w-full h-10 px-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer text-sm"
                        >
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-700 truncate">
                                {selectedFile ? selectedFile.name : "Choose file..."}
                            </span>
                        </label>
                    </div>
                </div>

                {/* CATEGORY */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Category *
                    </label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-10 justify-between"
                                disabled={isLoading || uploading}
                            >
                                <span className="truncate">
                                    {categoryLabel || "Select category"}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-1"
                            align="start"
                        >
                            {DOCUMENT_CATEGORY_OPTIONS.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategory(cat.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-gray-100",
                                        category === cat.value && "bg-gray-50"
                                    )}
                                >
                                    <span>{cat.label}</span>
                                    {category === cat.value && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                </button>
                            ))}
                        </PopoverContent>
                    </Popover>
                </div>

                <p className="text-xs text-gray-500">
                    Only PDF files up to 50MB are supported
                </p>
            </ModalBody>

            {/* ACTIONS */}
            <ModalFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading || uploading}
                >
                    Cancel
                </Button>

                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || !category || isLoading || uploading}
                >
                    {uploading ? "Processing..." : "Upload Document"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}