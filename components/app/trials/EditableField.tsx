/**
 * Editable Field Component
 * Click to edit inline - saves on blur or Enter
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface EditableTextProps {
  value: string | null | undefined;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export function EditableText({
  value,
  placeholder = "Click to add...",
  onSave,
  className = "",
  inputClassName = "",
  multiline = false,
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const handleSave = async () => {
    if (editValue === (value || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      setEditValue(value || "");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      disabled: isSaving,
      className: `w-full bg-white border border-blue-500 rounded px- py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`,
    };

    if (multiline) {
      return (
        <textarea
          {...commonProps}
          rows={3}
          className={`${commonProps.className} resize-none`}
        />
      );
    }

    return <input type="text" {...commonProps} />;
  }

  const displayValue = value || placeholder;
  const isEmpty = !value;

  // Read-only mode when disabled
  if (disabled) {
    return (
      <div className={`rounded px-2 py-1 -mx-2 ${className}`}>
        <span className={isEmpty ? "text-gray-400" : ""}>{displayValue}</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`group cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-gray-100 transition-colors ${className}`}
    >
      <span className={isEmpty ? "text-gray-400" : ""}>{displayValue}</span>
      <Pencil className="inline-block ml-2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface EditableSelectProps {
  value: string | null | undefined;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

export function EditableSelect({
  value,
  options,
  placeholder = "Select...",
  onSave,
  className = "",
}: EditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value || ""}
        onChange={handleChange}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        className="bg-white border border-blue-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  const displayLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`group cursor-pointer rounded px-2 py-1 -mx-2 hover:bg-gray-100 transition-colors ${className}`}
    >
      <span className={!value ? "text-gray-400" : ""}>
        {displayLabel || placeholder}
      </span>
      <Pencil className="inline-block ml-2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
