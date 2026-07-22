import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

// Initialize the SMTP transporter
const getEmailUser = () => (process.env.EMAIL_USER || '').trim();
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: parseInt(process.env.EMAIL_PORT || '465', 10) === 465, // true for 465, false for 587
  auth: {
    get user() { return getEmailUser(); },
    get pass() { return getEmailPass(); },
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const getAppName = (): string => {
  return process.env.APP_NAME || process.env.EMAIL_FROM_NAME || 'Qwasho';
};

/**
 * Sends an HTML email using the configured transporter.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<boolean> => {
  try {
    const fromName = process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Qwasho';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    logger.info(`[EMAIL] ✅ Sent successfully: messageId=${info.messageId} to=${to} subject="${subject}"`);
    return true;
  } catch (error) {
    logger.error(`[EMAIL] ❌ Failed to send email to=${to} subject="${subject}"`, error);
    return false;
  }
};

/**
 * Common CSS Reset & Container layout for 100% cross-client compatibility
 * (Gmail, Outlook, Apple Mail, Yahoo, Mobile clients)
 */
const getBaseStyle = () => `
  body {
    margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #333333; line-height: 1.6;
  }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 40px 24px; text-align: center; color: #ffffff; }
  .header h1 { margin: 12px 0 0 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff; }
  .logo { font-size: 48px; line-height: 1; }
  .content { padding: 36px 40px; }
  .content h2 { font-size: 20px; color: #111827; margin-top: 0; font-weight: 700; }
  .highlight-box { background: #F0F9FF; border-left: 4px solid #0284C7; border-radius: 8px; padding: 16px 20px; margin: 24px 0; font-size: 14px; color: #0369A1; }
  .otp-box { background: #EFF6FF; border: 2px dashed #2563EB; border-radius: 12px; text-align: center; padding: 24px 16px; margin: 24px 0; }
  .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1D4ED8; font-family: monospace; }
  .otp-label { font-size: 13px; color: #6B7280; margin-top: 8px; }
  .btn-container { text-align: center; margin: 28px 0; }
  .btn { display: inline-block; background: #2563EB; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .btn-danger { background: #DC2626 !important; }
  .warning { background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #92400E; }
  .info-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 16px; margin: 20px 0; font-size: 13px; color: #4B5563; border-radius: 8px; }
  .footer { background-color: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  .signoff { margin-top: 28px; font-size: 15px; color: #111827; }
  @media only screen and (max-width: 600px) {
    .content { padding: 24px 20px !important; }
    .header { padding: 32px 16px !important; }
    .container { margin: 10px !important; border-radius: 12px !important; }
    .otp-code { font-size: 34px !important; letter-spacing: 8px !important; }
  }
`;

/**
 * 1. Welcome Email — Sent after account is created & verified
 */
export const sendWelcomeEmail = async (to: string, name: string, laundryName: string): Promise<boolean> => {
  const appName = getAppName();

  const supportEmail = process.env.SUPPORT_EMAIL || `support@${appName.toLowerCase()}.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Welcome to ${laundryName}</title>
      <style>${getBaseStyle()}</style>
    </head>
    <body>
      <span class="preheader">Your ${appName} account for ${laundryName} is ready to use.</span>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <div class="logo">🧺</div>
                <h1>Welcome to ${appName}!</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Thank you for choosing <strong>${laundryName}</strong>! Your account has been successfully created and verified.</p>
                <p>You can now log in to the <strong>${appName}</strong> app on your mobile device to track and manage all your laundry orders.</p>

                <div class="highlight-box">
                  📲 Open the <strong>${appName}</strong> app &rarr; tap <strong>Login</strong> &rarr; enter your registered email and password to begin.
                </div>

                <p><strong>What you can do with ${appName}:</strong></p>
                <ul style="padding-left: 20px; margin: 16px 0; color: #374151;">
                  <li style="margin-bottom: 8px;">📦 <strong>Easy Scheduling:</strong> Book laundry pickups in a few taps</li>
                  <li style="margin-bottom: 8px;">🔔 <strong>Live Tracking:</strong> Real-time status from pickup to clean delivery</li>
                  <li style="margin-bottom: 8px;">🧾 <strong>Transparent Billing:</strong> View and confirm itemized bills instantly</li>
                  <li style="margin-bottom: 8px;">⭐ <strong>Ratings & Reviews:</strong> Share feedback for continuous service quality</li>
                </ul>

                <p>If you have any questions or need assistance, feel free to contact us at <a href="mailto:${supportEmail}" style="color: #2563EB; text-decoration: none;">${supportEmail}</a>.</p>

                <div class="signoff">
                  Best regards,<br>
                  <strong>Team ${appName}</strong>
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 ${appName}. All rights reserved.</p>
                <p>You received this email because you created an account on ${appName}.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${laundryName} — Your ${appName} account is ready 🧺`,
    html,
  });
};

/**
 * 2. OTP Email — Sent for email verification during registration
 */
export const sendOtpEmail = async (to: string, name: string, otp: string): Promise<boolean> => {
  const appName = getAppName();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Your Verification Code</title>
      <style>${getBaseStyle()}</style>
    </head>
    <body>
      <span class="preheader">Your ${appName} verification code is ${otp}. Expires in 10 minutes.</span>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6;">
        <tr>
          <td align="center">
            <div class="container" style="max-width: 520px;">
              <div class="header">
                <div class="logo">🫧</div>
                <h1>Verify Your Email</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Use the code below to verify your email address and complete your ${appName} registration:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                  <div class="otp-label">This code expires in <strong>10 minutes</strong></div>
                </div>
                <div class="warning">
                  🔒 <strong>Security Tip:</strong> Never share this code with anyone. ${appName} staff will never ask for your OTP.
                </div>
                <p>If you did not initiate this registration on ${appName}, please ignore this email.</p>
                <div class="signoff">
                  Best regards,<br>
                  <strong>Team ${appName}</strong>
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 ${appName}. All rights reserved.</p>
                <p>Security Notification from ${appName} Authentication</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${otp} is your ${appName} verification code`,
    html,
  });
};

/**
 * 3. Password Reset Email — Sent when user requests a reset
 */
export const sendPasswordResetEmail = async (to: string, name: string, token: string): Promise<boolean> => {
  const appName = getAppName();
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Reset Your Password</title>
      <style>${getBaseStyle()}</style>
    </head>
    <body>
      <span class="preheader">Password reset link for your ${appName} account. Valid for 15 minutes.</span>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <div class="logo">🔑</div>
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>We received a request to reset the password for your ${appName} account. Click the button below to set a new password:</p>
                <div class="btn-container">
                  <a href="${resetUrl}" class="btn btn-danger">Reset Password</a>
                </div>
                <div class="warning">
                  ⏱️ <strong>Important:</strong> This link will expire in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.
                </div>
                <div class="signoff">
                  Best regards,<br>
                  <strong>Team ${appName}</strong>
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 ${appName}. All rights reserved.</p>
                <p>Account Security Email from ${appName}</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Reset your ${appName} Password 🔑`,
    html,
  });
};

/**
 * 4. Owner Setup Email — Sent when a new shop owner is created
 */
export const sendOwnerSetupEmail = async (
  to: string,
  name: string,
  laundryName: string,
  setupLink: string
): Promise<boolean> => {
  const appName = getAppName();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Configure Your Owner Account</title>
      <style>${getBaseStyle()}</style>
    </head>
    <body>
      <span class="preheader">Set up your shop owner password for ${laundryName} on ${appName}.</span>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7f6;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);">
                <div class="logo">🧺</div>
                <h1>Welcome to ${appName} Platform</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Your shop owner account for <strong>${laundryName}</strong> has been successfully registered on ${appName}.</p>
                <p>Please click the button below to configure your password and activate your shop account:</p>
                
                <div class="btn-container">
                  <a href="${setupLink}" class="btn" style="background: #0891B2;">Set Up Password</a>
                </div>

                <div class="info-box">
                  📌 <strong>Note:</strong> This setup link will open a web page to set your password. Once set, you can sign in directly to the mobile app.
                  <br/><br/>
                  If the button doesn't work, copy and paste this link into your browser:
                  <br/>
                  <span style="font-family: monospace; word-break: break-all; color: #0891B2;">${setupLink}</span>
                </div>

                <div class="signoff">
                  Best regards,<br>
                  <strong>Team ${appName}</strong>
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 ${appName}. All rights reserved.</p>
                <p>Owner Activation Email from ${appName}</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Configure Your ${appName} Owner Account 🧺`,
    html,
  });
};
