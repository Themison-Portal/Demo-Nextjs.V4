/**
 * Toast utilities using sonner
 * Provides consistent toast notifications across the app
 */

import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 4000,
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 3000,
    });
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
