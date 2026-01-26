/**
 * New Folder Input
 * Inline folder creation (macOS style)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Folder } from "lucide-react";

interface NewFolderInputProps {
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function NewFolderInput({ onSave, onCancel }: NewFolderInputProps) {
  const [name, setName] = useState("Untitled Folder");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus and select all text
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="px-3 py-2 flex items-center gap-2 bg-blue-50 border-l-2 border-blue-500">
      <Folder className="w-4 h-4 text-blue-600 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        className="flex-1 bg-transparent text-sm text-gray-900 outline-none border-b border-blue-400 focus:border-blue-600"
      />
    </div>
  );
}
