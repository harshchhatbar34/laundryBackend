import nodemailer from 'nodemailer';

// Initialize the SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: parseInt(process.env.EMAIL_PORT || '465', 10) === 465, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Reusable email options structure
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a HTML email using the configured transporter.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<boolean> => {
  try {
    const fromName = process.env.EMAIL_FROM_NAME || 'Qwasho';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent successfully: messageId=${info.messageId} to=${to}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to=${to}`, error);
    return false;
  }
};

/**
 * Sends a welcome email to a newly registered user.
 */
export const sendWelcomeEmail = async (to: string, name: string, laundryName: string): Promise<boolean> => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${laundryName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 10px 0 0 0;
          font-size: 28px;
          font-weight: 700;
        }
        .logo {
          font-size: 48px;
        }
        .content {
          padding: 30px 40px;
          line-height: 1.6;
        }
        .content h2 {
          font-size: 20px;
          color: #111827;
          margin-top: 0;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: #3B82F6;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.2s ease;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🫧</div>
          <h1>Welcome to Qwasho</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for choosing <strong>${laundryName}</strong>! Your account has been successfully created.</p>
          <p>Qwasho helps you manage and track all your laundry services with ease. Get real-time updates on your clothes from pickup to clean delivery.</p>
          <div class="btn-container">
            <a href="${loginUrl}" class="btn">Login to Your Account</a>
          </div>
          <p>If you have any questions or need support, feel free to contact us at <a href="mailto:support@qwasho.com">support@qwasho.com</a>.</p>
          <p>Best regards,<br>The Qwasho Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Qwasho. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${laundryName} on Qwasho! 🧺`,
    html,
  });
};

/**
 * Sends a password reset email containing a secure link.
 */
export const sendPasswordResetEmail = async (to: string, name: string, token: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 10px 0 0 0;
          font-size: 28px;
          font-weight: 700;
        }
        .logo {
          font-size: 48px;
        }
        .content {
          padding: 30px 40px;
          line-height: 1.6;
        }
        .content h2 {
          font-size: 20px;
          color: #111827;
          margin-top: 0;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: #ef4444;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.2s ease;
        }
        .warning {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
          color: #b45309;
          border-radius: 4px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔑</div>
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>We received a request to reset the password associated with your account. Click the button below to set a new password:</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          <div class="warning">
            <strong>Important:</strong> This link will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access.
          </div>
          <p>Best regards,<br>The Qwasho Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Qwasho. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Reset your Qwasho Password 🔑',
    html,
  });
};

/**
 * Sends a password setup email to a newly created owner containing the web setup link.
 */
export const sendOwnerSetupEmail = async (
  to: string,
  name: string,
  laundryName: string,
  setupLink: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Configure Your Account</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 0;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
          background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 10px 0 0 0;
          font-size: 24px;
          font-weight: 700;
        }
        .logo {
          font-size: 40px;
        }
        .content {
          padding: 30px 40px;
          line-height: 1.6;
        }
        .content h2 {
          font-size: 20px;
          color: #111827;
          margin-top: 0;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: #06B6D4;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.2s ease;
        }
        .info-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 15px;
          margin: 20px 0;
          font-size: 13px;
          color: #4b5563;
          border-radius: 8px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🧺</div>
          <h1>Welcome to Qwasho Platform</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Your shop owner account for <strong>${laundryName}</strong> has been successfully registered on the platform.</p>
          <p>Please click the button below to configure your password and activate your account:</p>
          
          <div class="btn-container">
            <a href="${setupLink}" class="btn">Set Up Password</a>
          </div>

          <div class="info-box">
            <strong>Note:</strong> This link opens a secure web page where you can create your password. Once set, you can log in directly to the <strong>LaundroFlow</strong> mobile app using your credentials.
            <br/><br/>
            If clicking the button does not work, please copy and paste the raw link below directly into your web browser:
            <br/><br/>
            <span style="font-family: monospace; word-break: break-all; color: #0891B2;">${setupLink}</span>
          </div>

          <p>Best regards,<br>The Qwasho Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Qwasho. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Configure Your Qwasho Owner Account 🧺',
    html,
  });
};
