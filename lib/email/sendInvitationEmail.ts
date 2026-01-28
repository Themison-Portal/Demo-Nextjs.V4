/**
 * Email Service - Send Invitation Emails
 * Uses Resend in production or development with API key
 * Falls back to nodemailer (Inbucket) if Resend not configured
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import {
  RESEND_CONFIG,
  SMTP_CONFIG,
  EMAIL_CONFIG,
  isDevelopment
} from '@/lib/constants';

interface InvitationEmailData {
  to: string;
  organizationName: string;
  invitationUrl: string;
}

// Initialize Resend if API key is available
const resend = RESEND_CONFIG.apiKey
  ? new Resend(RESEND_CONFIG.apiKey)
  : null;

/**
 * Send invitation email using Resend or fallback to nodemailer
 */
export async function sendInvitationEmail(data: InvitationEmailData) {
  // Use Resend if configured
  if (resend && RESEND_CONFIG.useResend) {
    console.log(`[Email] Attempting to send invitation via Resend to ${data.to}`);
    const success = await sendWithResend(data);

    // If Resend fails (e.g., dev restrictions), fallback to nodemailer
    if (!success) {
      console.warn(`[Email] Resend failed for ${data.to}, falling back to nodemailer/SMTP`);
      return sendWithNodemailer(data);
    }

    return;
  }

  // Fallback to nodemailer (Inbucket for dev)
  console.log(`[Email] Resend not configured, using nodemailer/SMTP for ${data.to}`);
  return sendWithNodemailer(data);
}

/**
 * Send email using Resend
 * @returns true if successful, false if failed
 */
async function sendWithResend(data: InvitationEmailData): Promise<boolean> {
  try {
    const { data: result, error } = await resend!.emails.send({
      from: RESEND_CONFIG.from,
      to: data.to,
      subject: `Invitation to join ${data.organizationName}`,
      html: getEmailHtml(data),
      text: getEmailText(data),
    });

    if (error) {
      // Check if it's a dev restriction error (403)
      const isDevRestriction = error.message?.includes('only send testing emails to your own email');

      if (isDevRestriction) {
        console.warn(
          `[Email/Resend] Dev mode restriction for ${data.to}: Can only send to verified email. ` +
          `Error: ${error.message}`
        );
      } else {
        // Log detailed error information for production debugging
        console.error(
          `[Email/Resend] Failed to send to ${data.to}`,
          {
            error_name: error.name,
            error_message: error.message,
            from: RESEND_CONFIG.from,
            to: data.to,
            organization: data.organizationName,
          }
        );
      }

      return false;
    }

    console.log(`[Email/Resend] ✓ Invitation sent successfully to ${data.to} (Email ID: ${result?.id})`);
    return true;
  } catch (error) {
    // Catch unexpected errors (network issues, etc.)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error(
      `[Email/Resend] Unexpected error sending to ${data.to}`,
      {
        error_name: errorName,
        error_message: errorMessage,
        error_stack: error instanceof Error ? error.stack : undefined,
        from: RESEND_CONFIG.from,
        to: data.to,
      }
    );

    return false;
  }
}

/**
 * Send email using nodemailer (fallback for local dev)
 */
async function sendWithNodemailer(data: InvitationEmailData) {
  const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: SMTP_CONFIG.auth,
    tls: isDevelopment ? { rejectUnauthorized: false } : undefined,
  });

  const mailOptions = {
    from: SMTP_CONFIG.from,
    to: data.to,
    subject: `Invitation to join ${data.organizationName}`,
    html: getEmailHtml(data),
    text: getEmailText(data),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[Email/Nodemailer] ✓ Invitation sent successfully to ${data.to}`,
      {
        messageId: info.messageId,
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error(
      `[Email/Nodemailer] Failed to send to ${data.to}`,
      {
        error_name: errorName,
        error_message: errorMessage,
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        from: SMTP_CONFIG.from,
        to: data.to,
      }
    );
    // Don't throw - email sending is "best effort"
  }
}

/**
 * Generate HTML email template
 */
function getEmailHtml(data: InvitationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${data.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: ${EMAIL_CONFIG.brandColor};">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${EMAIL_CONFIG.brandName}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">
                      You've been invited to join ${data.organizationName}
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                      Click the button below to create your account and get started.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${data.invitationUrl}"
                             style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_CONFIG.brandColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                            Create Account
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                      Or copy and paste this URL into your browser:<br>
                      <a href="${data.invitationUrl}" style="color: #666666; word-break: break-all;">${data.invitationUrl}</a>
                    </p>
                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px;">
                      This invitation will expire in ${EMAIL_CONFIG.invitationExpiryDays} days.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9f9f9; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      This invitation was sent by ${data.organizationName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email
 */
function getEmailText(data: InvitationEmailData): string {
  return `
You've been invited to join ${data.organizationName}

Click the link below to create your account:
${data.invitationUrl}

This invitation will expire in ${EMAIL_CONFIG.invitationExpiryDays} days.

This invitation was sent by ${data.organizationName}
  `.trim();
}
