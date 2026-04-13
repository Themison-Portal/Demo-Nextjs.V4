/**
 * useSignup Hook
 * Handles invitation-based signup via backend API
 */

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

interface SignupData {
    password: string;
    first_name: string;
    last_name: string;
}

interface SignupResponse {
    success: boolean;
    message?: string;
}

export function useSignup() {
    const router = useRouter();
    const searchParams = useSearchParams();

    return useMutation<SignupResponse, Error, SignupData>({
        mutationFn: async (data: SignupData) => {
            const token = searchParams.get("token");

            if (!token) {
                throw new Error("Missing invitation token. Please use the link from your invitation email.");
            }

            const backendUrl = process.env.NEXT_PUBLIC_API_URL;

            let response: Response;
            try {
                response = await fetch(`${backendUrl}/signup/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token,
                        password: data.password,
                        first_name: data.first_name,
                        last_name: data.last_name,
                    }),
                });
            } catch (networkError) {
                throw new Error("Unable to connect to server. Please check your internet connection and try again.");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Signup failed:", {
                    status: response.status,
                    error: errorData,
                });
                throw new Error(
                    errorData.detail || errorData.message || "Signup failed. Please try again."
                );
            }

            return response.json();
        },
        onSuccess: () => {
            // Small delay for better UX
            setTimeout(() => {
                router.push("/signin?signup=success");
            }, 500);
        },
    });
}