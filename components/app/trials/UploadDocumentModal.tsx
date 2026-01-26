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

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, category: string) => Promise<void>;
  isLoading: boolean;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: UploadDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = DOCUMENT_CATEGORY_OPTIONS.find(
    (c) => c.value === category
  )?.label;

  const handleSubmit = async () => {
    if (!selectedFile || !category) return;

    await onSubmit(selectedFile, category);
    handleClose();
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
              disabled={isLoading}
              className="hidden"
              id="file-upload-modal"
            />
            <label
              htmlFor="file-upload-modal"
              className="flex items-center w-full h-10 px-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors text-sm"
            >
              <FileText className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-700 truncate">
                {selectedFile ? selectedFile.name : "Choose file..."}
              </span>
            </label>
          </div>
        </div>

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
                disabled={isLoading}
              >
                <span className="truncate">
                  {categoryLabel || "Select category"}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              {DOCUMENT_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                    category === cat.value && "bg-gray-50",
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

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || !category || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Uploading..." : "Upload Document"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
