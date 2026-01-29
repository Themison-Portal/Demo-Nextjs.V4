/**
 * Toast Usage Examples
 *
 * This file demonstrates how to use the toast utility throughout the app
 */

import { toast } from "@/lib/toast";

// ============================================================================
// Basic Examples
// ============================================================================

// Success toast
export function exampleSuccess() {
  toast.success("Patient saved");
  toast.success("Patient saved", "Changes have been saved successfully");
}

// Error toast
export function exampleError() {
  toast.error("Failed to save patient");
  toast.error("Failed to save patient", "Please try again later");
}

// Info toast
export function exampleInfo() {
  toast.info("New message received");
  toast.info("System update", "A new version is available");
}

// ============================================================================
// Advanced Examples
// ============================================================================

// Loading toast (returns ID that can be dismissed)
export function exampleLoading() {
  const toastId = toast.loading("Saving patient...");

  // Later, you can dismiss it manually if needed:
  // import { toast as sonnerToast } from "sonner";
  // sonnerToast.dismiss(toastId);
}

// Promise-based toast (automatically shows loading/success/error)
export async function examplePromise() {
  const savePatient = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { name: "Patient P004" };
  };

  toast.promise(savePatient(), {
    loading: "Saving patient...",
    success: (data) => `${data.name} saved successfully`,
    error: (error) => `Failed to save: ${error.message}`,
  });
}

// ============================================================================
// Real-world Usage Examples
// ============================================================================

// Example 1: Form submission
export async function handleFormSubmit(data: any) {
  try {
    // Show loading state
    const toastId = toast.loading("Saving changes...");

    // Make API call
    const response = await fetch("/api/patients", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to save");

    // Show success (loading toast will be replaced)
    toast.success("Patient created", "The patient has been added to the trial");
  } catch (error) {
    toast.error("Failed to create patient", "Please try again");
  }
}

// Example 2: Using with mutation hooks
export function exampleWithMutation() {
  // Inside a component with mutation:

  const mutation = {
    mutateAsync: async (data: any) => {
      return toast.promise(
        fetch("/api/patients", { method: "POST", body: JSON.stringify(data) }),
        {
          loading: "Creating patient...",
          success: "Patient created successfully",
          error: "Failed to create patient",
        }
      );
    },
  };
}

// Example 3: Conditional messages
export function exampleConditional(isUpdate: boolean, patientName: string) {
  if (isUpdate) {
    toast.success("Patient updated", `${patientName} has been updated`);
  } else {
    toast.success("Patient created", `${patientName} has been added`);
  }
}

// Example 4: Error handling with details
export function exampleDetailedError(error: any) {
  const message = error.response?.data?.message || error.message || "Something went wrong";
  toast.error("Operation failed", message);
}
