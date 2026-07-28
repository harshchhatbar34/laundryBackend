import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

// Initialize the SMTP transporter
const getEmailUser = () => (process.env.EMAIL_USER || '').trim();
const getEmailPass = () => (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: parseInt(process.env.EMAIL_PORT || '465', 10) === 465,
  auth: {
    get user() { return getEmailUser(); },
    get pass() { return getEmailPass(); },
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const getAppName = (): string => {
  return process.env.APP_NAME || process.env.EMAIL_FROM_NAME || 'Qwasho';
};

const currentYear = new Date().getFullYear();

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
 * Shared wrapper — white background, 600px centred card, top brand strip, bottom footer.
 * Inspired by Zerodha / Care Health / professional Indian B2C email style.
 */
const wrap = (appName: string, preheader: string, bodyHtml: string): string => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <style>
    body, html { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background:#f0f2f5; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; max-height:0; overflow:hidden; font-size:0px; }
    @media only screen and (max-width: 620px) {
      .email-card { width:100% !important; margin:0 !important; border-radius:0 !important; }
      .email-body { padding:28px 20px !important; }
      .otp-code { font-size:40px !important; letter-spacing:10px !important; }
      .brand-header { padding:20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
  <span class="preheader">${preheader}</span>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">

        <!-- Email card -->
        <table class="email-card" width="600" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.10);">

          <!-- Brand header strip -->
          <tr>
            <td class="brand-header" style="background:#1B2B4B;padding:22px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">${appName}</span>
                  </td>
                  <td align="right">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:0.5px;">OFFICIAL COMMUNICATION</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding:36px 40px 28px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid #e8e8e8;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#999999;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#bbbbbb;">
                &copy; ${currentYear} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->
</body>
</html>`;

/* ─────────────────────────────────────────────────────────────────────────────
   1. OTP Email — Email Verification during Registration / Resend
───────────────────────────────────────────────────────────────────────────── */
export const sendOtpEmail = async (to: string, name: string, otp: string): Promise<boolean> => {
  const appName = getAppName();

  const body = `
    <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111111;">Dear ${name},</p>

    <p style="margin:16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      Your One-Time Password (OTP) for email verification on <strong>${appName}</strong> is:
    </p>

    <!-- OTP block -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <p class="otp-code" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:52px;font-weight:900;letter-spacing:14px;color:#1B2B4B;line-height:1.1;">${otp}</p>
          <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#777777;">This OTP is valid for <strong style="color:#333333;">10 minutes</strong>.</p>
        </td>
      </tr>
    </table>

    <!-- Horizontal rule -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e53935;line-height:1.6;">
      If you did not initiate this request, someone may be trying to access your account. Please ignore this email or contact our support team immediately.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
      Regards,<br>
      <strong>Team ${appName}</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject: `${otp} is your ${appName} verification code`,
    html: wrap(appName, `Your ${appName} OTP is ${otp}. Valid for 10 minutes.`, body),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. Welcome Email — Sent after OTP is verified & account is activated
───────────────────────────────────────────────────────────────────────────── */
export const sendWelcomeEmail = async (to: string, name: string, laundryName: string): Promise<boolean> => {
  const appName = getAppName();
  const supportEmail = process.env.SUPPORT_EMAIL || `support@${appName.toLowerCase()}.com`;

  const body = `
    <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111111;">Dear ${name},</p>

    <p style="margin:16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      Welcome to <strong>${appName}</strong>! Your account has been successfully verified and activated with <strong>${laundryName}</strong>.
    </p>

    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      You can now log in to the <strong>${appName}</strong> app to schedule laundry pickups, track your orders in real-time, and manage your account.
    </p>

    <!-- Horizontal rule -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <!-- Feature list -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;">
          &rsaquo;&nbsp; <strong>Easy Scheduling</strong> &mdash; Book laundry pickups in a few taps
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;">
          &rsaquo;&nbsp; <strong>Live Tracking</strong> &mdash; Real-time order status from pickup to delivery
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;">
          &rsaquo;&nbsp; <strong>Transparent Billing</strong> &mdash; View and confirm itemised bills instantly
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;">
          &rsaquo;&nbsp; <strong>Ratings &amp; Reviews</strong> &mdash; Share feedback for continuous quality improvement
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#777777;line-height:1.6;">
      For assistance, please write to us at <a href="mailto:${supportEmail}" style="color:#1B2B4B;text-decoration:none;">${supportEmail}</a>.
    </p>

    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
      Regards,<br>
      <strong>Team ${appName}</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${appName} — Your account is ready`,
    html: wrap(appName, `Your ${appName} account for ${laundryName} is verified and ready to use.`, body),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. Password Reset Email — Sent when user requests a password reset
───────────────────────────────────────────────────────────────────────────── */
export const sendPasswordResetEmail = async (to: string, name: string, token: string): Promise<boolean> => {
  const appName = getAppName();
  const resetUrl = `${process.env.FRONTEND_URL || 'https://laundry-backend-eta.vercel.app'}/reset-password?token=${token}`;

  const body = `
    <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111111;">Dear ${name},</p>

    <p style="margin:16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      We received a request to reset the password for your <strong>${appName}</strong> account associated with this email address.
    </p>

    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      Click the button below to set a new password. This link is valid for <strong>10 minutes</strong>.
    </p>

    <!-- Reset button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" target="_blank"
             style="display:inline-block;background:#1B2B4B;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;padding:14px 40px;border-radius:3px;letter-spacing:0.5px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <!-- Fallback URL -->
    <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#999999;">
      If the button does not work, copy and paste the link below into your browser:
    </p>
    <p style="margin:0 0 20px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#1B2B4B;word-break:break-all;">${resetUrl}</p>

    <!-- Horizontal rule -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e53935;line-height:1.6;">
      If you did not request a password reset, please ignore this email. Your password will remain unchanged.
    </p>

    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
      Regards,<br>
      <strong>Team ${appName}</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject: `Password Reset Request — ${appName}`,
    html: wrap(appName, `Reset link for your ${appName} account. Valid for 10 minutes.`, body),
  });
};

/* ─────────────────────────────────────────────────────────────────────────────
   4. Owner Setup Email — Sent when a new shop owner account is created by admin
───────────────────────────────────────────────────────────────────────────── */
export const sendOwnerSetupEmail = async (
  to: string,
  name: string,
  laundryName: string,
  setupLink: string
): Promise<boolean> => {
  const appName = getAppName();

  const body = `
    <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111111;">Dear ${name},</p>

    <p style="margin:16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      Congratulations! Your registration as a Laundry Shop Owner for <strong>${laundryName}</strong> on <strong>${appName}</strong> has been successful.
    </p>

    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
      To complete your setup and create your password, please click the button below:
    </p>

    <!-- Setup button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <a href="${setupLink}" target="_blank"
             style="display:inline-block;background:#1B2B4B;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;padding:14px 40px;border-radius:3px;letter-spacing:0.5px;">
            Set Your Password
          </a>
        </td>
      </tr>
    </table>

    <!-- Fallback URL -->
    <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#999999;">
      If the button above does not work, copy and paste the following link into your web browser:
    </p>
    <p style="margin:0 0 20px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#1B2B4B;word-break:break-all;">${setupLink}</p>

    <!-- Note -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="background:#f8f8f8;border-left:3px solid #1B2B4B;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555555;line-height:1.6;">
          <strong>Note:</strong> Once you set your password, you can sign in to manage your shop using the ${appName} mobile app or web portal.
        </td>
      </tr>
    </table>

    <!-- Horizontal rule -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr><td style="border-top:1px solid #eeeeee;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>

    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
      Regards,<br>
      <strong>Team ${appName}</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject: `Registration Successful — Set Up Password for ${laundryName}`,
    html: wrap(appName, `Registration successful for ${laundryName}. Set your password to get started.`, body),
  });
};
