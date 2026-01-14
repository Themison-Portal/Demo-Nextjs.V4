/**
 * Email Service - Send Invitation Emails
 * Uses nodemailer with SMTP configuration from constants
 * In dev: sends to Inbucket (localhost:54325)
 * In prod: uses configured SMTP provider
 */

import nodemailer from 'nodemailer';
import { SMTP_CONFIG, EMAIL_CONFIG, isDevelopment } from '@/lib/constants';

interface InvitationEmailData {
  to: string;
  organizationName: string;
  invitationUrl: string;
}

// Create transporter based on environment
const createTransporter = () => {
  const baseConfig = {
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
  };

  if (isDevelopment) {
    // Dev: use Inbucket SMTP (comes with Supabase local)
    return nodemailer.createTransport({
      ...baseConfig,
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Prod: use configured SMTP provider with authentication
    return nodemailer.createTransport({
      ...baseConfig,
      auth: SMTP_CONFIG.auth,
    });
  }
};

export async function sendInvitationEmail(data: InvitationEmailData) {
  const transporter = createTransporter();

  const mailOptions = {
    from: SMTP_CONFIG.from,
    to: data.to,
    subject: `Invitation to join ${data.organizationName}`,
    html: `
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
    `,
    text: `
You've been invited to join ${data.organizationName}

Click the link below to create your account:
${data.invitationUrl}

This invitation was sent by ${data.organizationName}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Invitation sent to ${data.to}`);
  } catch (error) {
    console.error('[Email] Error sending invitation:', error);
    // Don't throw - email sending is "best effort"
    // Caller can continue with the request even if email fails
  }
}
