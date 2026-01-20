"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import type { CreatePatientInput } from "@/services/patients/types";

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePatientInput) => Promise<void>;
  isLoading: boolean;
}

export function CreatePatientModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreatePatientModalProps) {
  const [formData, setFormData] = useState<CreatePatientInput>({
    patient_number: "",
    initials: "",
    date_of_birth: "",
    sex: undefined,
    screening_date: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.patient_number.trim()) return;

    await onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      patient_number: "",
      initials: "",
      date_of_birth: "",
      sex: undefined,
      screening_date: "",
      notes: "",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <ModalHeader onClose={handleClose}>Add New Patient</ModalHeader>

      <ModalBody className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Patient Number *
          </label>
          <input
            type="text"
            value={formData.patient_number}
            onChange={(e) =>
              setFormData({ ...formData, patient_number: e.target.value })
            }
            placeholder="e.g., P001"
            disabled={isLoading}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Initials
          </label>
          <input
            type="text"
            value={formData.initials}
            onChange={(e) =>
              setFormData({ ...formData, initials: e.target.value })
            }
            placeholder="e.g., JD"
            disabled={isLoading}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
            }
            disabled={isLoading}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sex</label>
          <select
            value={formData.sex || ""}
            onChange={(e) =>
              setFormData({ ...formData, sex: e.target.value as any })
            }
            disabled={isLoading}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Screening Date
          </label>
          <input
            type="date"
            value={formData.screening_date}
            onChange={(e) =>
              setFormData({ ...formData, screening_date: e.target.value })
            }
            disabled={isLoading}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            disabled={isLoading}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            rows={3}
            placeholder="Additional notes..."
          />
        </div>
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
          disabled={isLoading || !formData.patient_number.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Patient"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
