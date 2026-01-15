/**
 * Validate Invitation Token
 * Server-side validation of invitation tokens for signup flow
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface InvitationValidationResult {
  valid: true;
  invitation: {
    id: string;
    email: string;
    org_id: string;
    org_role: string;
    organization: {
      id: string;
      name: string;
    };
  };
}

export interface InvitationValidationError {
  valid: false;
  error: "no_token" | "not_found" | "not_pending" | "expired" | "user_exists";
  details?: string;
}

export type InvitationValidation = InvitationValidationResult | InvitationValidationError;

export async function validateInvitationToken(
  token: string | null
): Promise<InvitationValidation> {
  // No token provided
  if (!token) {
    return { valid: false, error: "no_token" };
  }

  // Fetch invitation
  const { data: invitation, error } = await supabaseAdmin
    .from("invitations")
    .select(
      `
      id,
      email,
      org_id,
      org_role,
      status,
      expires_at,
      organizations!inner (
        id,
        name
      )
    `
    )
    .eq("token", token)
    .single();

  // Type assertion for organizations
  const org = invitation?.organizations as { id: string; name: string } | undefined;

  // Invalid token
  if (error || !invitation || !org) {
    return { valid: false, error: "not_found" };
  }

  // Check status
  if (invitation.status !== "pending") {
    return {
      valid: false,
      error: "not_pending",
      details: `Status: ${invitation.status}`,
    };
  }

  // Check expiration
  const expiresAt = new Date(invitation.expires_at);
  const now = new Date();

  if (expiresAt < now) {
    // Mark as expired
    await supabaseAdmin
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return { valid: false, error: "expired" };
  }

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", invitation.email)
    .single();

  if (existingUser) {
    return { valid: false, error: "user_exists" };
  }

  // Valid invitation
  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      org_id: invitation.org_id,
      org_role: invitation.org_role,
      organization: org,
    },
  };
}
