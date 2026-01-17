/**
 * Modal Component
 * Reusable modal/dialog base component
 */

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-lg bg-white shadow-xl",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  children,
  onClose,
  showCloseButton = true,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}
