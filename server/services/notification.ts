import nodemailer from 'nodemailer';

/**
 * Aura Intimates — Security & Owner Notification Service
 * Dispatches real SMTP email notifications for OTP recovery and critical security events.
 * Compatible with standard SMTP providers including Gmail (smtp.gmail.com:587).
 */

export interface SecurityEventPayload {
  event: 'login_success' | 'login_failed' | 'password_changed' | 'session_revoked' | 'rate_limit_lockout' | 'otp_requested';
  ip: string;
  userAgent: string;
  timestamp: string;
  details?: string;
}

export interface SmtpConfigStatus {
  configured: boolean;
  host?: string;
  port?: number;
  userConfigured: boolean;
  passConfigured: boolean;
  alertEmailConfigured: boolean;
  targetEmail?: string;
  authError?: string;
}

// Throttle for failed login alerts to prevent mailbox flooding (max 1 alert every 2 minutes)
let lastFailedLoginAlertTime = 0;
let accumulatedFailedAttempts = 0;

// Track SMTP auth failures (e.g. invalid Gmail App Password 535) to prevent spamming failed requests
let smtpAuthFailureCooldownUntil = 0;
let lastSmtpAuthErrorMessage = '';

export function isSmtpTemporarilyDisabled(): boolean {
  return Date.now() < smtpAuthFailureCooldownUntil;
}

export function resetSmtpAuthCooldown(): void {
  smtpAuthFailureCooldownUntil = 0;
  lastSmtpAuthErrorMessage = '';
}

export function getSmtpStatus(): SmtpConfigStatus {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const alertEmail = process.env.ALERT_EMAIL || process.env.OWNER_EMAIL || user;

  const isConfigured = Boolean(user && pass && alertEmail);

  return {
    configured: isConfigured,
    host,
    port,
    userConfigured: Boolean(user),
    passConfigured: Boolean(pass),
    alertEmailConfigured: Boolean(alertEmail),
    targetEmail: alertEmail ? maskEmail(alertEmail) : undefined,
    authError: Date.now() < smtpAuthFailureCooldownUntil ? lastSmtpAuthErrorMessage : undefined,
  };
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return 'configured';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + '***' : name.slice(0, 2) + '***' + name.slice(-1);
  return `${maskedName}@${domain}`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim() || '';
  let pass = process.env.SMTP_PASS?.trim() || '';

  if (!user || !pass) {
    return null;
  }

  // Google App Passwords are 16 characters often copied with spaces (e.g. "abcd efgh ijkl mnop")
  // Strip spaces if using Gmail to ensure the 16-character token authenticates
  if (host.includes('gmail.com')) {
    pass = pass.replace(/\s+/g, '');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Verify SMTP connection and credentials
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      success: false,
      message: 'SMTP credentials (SMTP_USER, SMTP_PASS) are not configured in environment variables.',
    };
  }

  try {
    await transporter.verify();
    resetSmtpAuthCooldown();
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (err: any) {
    const rawError = err.message || 'SMTP connection verification failed.';
    const isBadCredentials = rawError.includes('535') || rawError.includes('BadCredentials') || rawError.includes('Username and Password not accepted');

    if (isBadCredentials) {
      smtpAuthFailureCooldownUntil = Date.now() + 15 * 60 * 1000;
      lastSmtpAuthErrorMessage = 'Invalid SMTP credentials (535 Bad Credentials). If using Gmail, an App Password is required.';
      return {
        success: false,
        message: 'Invalid SMTP credentials (535 Bad Credentials). If using Gmail, please create a 16-character App Password (with 2-Step Verification enabled) instead of your regular Google password.',
      };
    }

    return { success: false, message: rawError };
  }
}

/**
 * Send 6-Digit Password Reset OTP via SMTP
 */
export async function sendOtpEmail(payload: {
  to?: string;
  otp: string;
  ip: string;
  userAgent: string;
  expiresMinutes: number;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const alertEmail = payload.to || process.env.ALERT_EMAIL || process.env.OWNER_EMAIL || process.env.SMTP_USER;
  const transporter = createTransporter();

  if (!transporter || !alertEmail) {
    return {
      success: false,
      error: 'SMTP email transport is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and ALERT_EMAIL.',
    };
  }

  const brandName = 'Aura Intimates';
  const appUrl = process.env.APP_URL || 'https://aura-intimates.ai.studio';

  const subject = `[${brandName}] Your Master Password Reset Code: ${payload.otp}`;

  const textBody = `
${brandName} — Master Password Recovery

Your one-time verification code is: ${payload.otp}

This code will expire in ${payload.expiresMinutes} minutes.

Security details of this request:
- Timestamp: ${new Date().toUTCString()}
- Requesting IP: ${payload.ip}
- Device / User-Agent: ${payload.userAgent}
- Application: ${appUrl}

If you did not request this code, your store account is safe, but please ensure your email account is secure.
Never share this one-time code with anyone.
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${brandName} Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #EFE8E5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2B1220; padding: 24px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 500; letter-spacing: 1px;">AURA INTIMATES</h1>
              <p style="margin: 4px 0 0; color: #E0D0D7; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Owner Security Service</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px; color: #2B1220; font-size: 18px; font-weight: 600;">Master Password Reset Request</h2>
              <p style="margin: 0 0 20px; color: #55464D; font-size: 13px; line-height: 1.6;">
                A request was received to reset the master password for the <strong>${brandName}</strong> Owner Portal. Use the verification code below to complete your reset:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #FAF5F2; border: 1.5px dashed #2B1220; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2B1220; font-family: 'Courier New', Courier, monospace;">
                  ${payload.otp}
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #886A72; font-weight: 500;">
                  Valid for ${payload.expiresMinutes} minutes · Single-use only
                </div>
              </div>

              <!-- Security Audit Details -->
              <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #FDFCFA; border: 1px solid #EDE5DF; border-radius: 6px; font-size: 11px; color: #55464D; margin-top: 20px;">
                <tr>
                  <td width="30%" style="font-weight: 600; color: #2B1220; border-bottom: 1px solid #F0EAE7;">Timestamp</td>
                  <td style="border-bottom: 1px solid #F0EAE7;">${new Date().toUTCString()}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #2B1220; border-bottom: 1px solid #F0EAE7;">Requesting IP</td>
                  <td style="border-bottom: 1px solid #F0EAE7; font-family: monospace;">${payload.ip}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #2B1220;">Client / Device</td>
                  <td style="word-break: break-all;">${escapeHtml(payload.userAgent)}</td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #886A72; font-size: 11px; line-height: 1.5;">
                <strong>Security Notice:</strong> If you did not make this request, someone may be attempting to access your store portal. You do not need to take action as your account remains secure without this code.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F5; padding: 16px 30px; text-align: center; border-top: 1px solid #EFE8E5; font-size: 11px; color: #886A72;">
              © ${new Date().getFullYear()} ${brandName}. Confidential Security Notification.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    const info = await transporter.sendMail({
      from: `"${brandName} Security" <${process.env.SMTP_USER}>`,
      to: alertEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    resetSmtpAuthCooldown();
    console.info(`[SMTP Notification] OTP dispatched to ${maskEmail(alertEmail)} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    const rawError = err.message || 'SMTP delivery failed';
    const isBadCredentials = rawError.includes('535') || rawError.includes('BadCredentials') || rawError.includes('Username and Password not accepted');

    let safeError = rawError;
    if (isBadCredentials) {
      smtpAuthFailureCooldownUntil = Date.now() + 15 * 60 * 1000;
      lastSmtpAuthErrorMessage = 'Invalid SMTP credentials (535 Bad Credentials). If using Gmail, an App Password is required.';
      safeError = 'SMTP authentication failed (535 Bad Credentials). If using Gmail, please create a 16-character App Password (with 2-Step Verification enabled) instead of your regular password.';
      console.warn(`[SMTP Notice] Failed to send OTP to ${maskEmail(alertEmail)}: ${safeError}`);
    } else {
      console.warn(`[SMTP Notice] Failed to send OTP to ${maskEmail(alertEmail)}: ${safeError}`);
    }

    return { success: false, error: safeError };
  }
}

/**
 * Dispatch Owner Security Alerts (Login success, failed attempts, password change, etc.)
 */
export async function sendSecurityAlert(payload: SecurityEventPayload): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const alertEmail = process.env.ALERT_EMAIL || process.env.OWNER_EMAIL || process.env.SMTP_USER;
  const brandName = 'Aura Intimates';
  const now = Date.now();

  const eventMetadata = {
    login_success: {
      title: 'Successful Owner Login Detected',
      subject: `[${brandName} Alert] Successful Owner Portal Login`,
      badgeColor: '#15803d',
      summary: 'Your master password was used to sign in to the Aura Intimates Owner Panel.',
    },
    login_failed: {
      title: 'Failed Login Warning',
      subject: `[${brandName} Warning] Failed Owner Login Attempt`,
      badgeColor: '#b91c1c',
      summary: 'An invalid password was entered on the Owner Portal.',
    },
    password_changed: {
      title: 'Master Password Changed',
      subject: `[${brandName} Security] Owner Master Password Updated`,
      badgeColor: '#4338ca',
      summary: 'The owner master password was successfully updated or reset.',
    },
    session_revoked: {
      title: 'All Active Sessions Revoked',
      subject: `[${brandName} Security] Admin Sessions Revoked`,
      badgeColor: '#d97706',
      summary: 'All other active device sessions have been revoked by the owner.',
    },
    rate_limit_lockout: {
      title: 'Security Lockout Triggered',
      subject: `[${brandName} Alert] Login Lockout Active Due to Multiple Failures`,
      badgeColor: '#b91c1c',
      summary: 'Repeated failed login attempts triggered an automatic security lockout.',
    },
    otp_requested: {
      title: 'Reset Code Requested',
      subject: `[${brandName} Security] Password Reset Requested`,
      badgeColor: '#6366f1',
      summary: 'A one-time reset code was requested for the master password.',
    },
  }[payload.event];

  // Structured sanitized console log for diagnostics
  console.info(`[SECURITY EVENT] ${eventMetadata.title} | IP: ${payload.ip} | Time: ${payload.timestamp} | Agent: ${payload.userAgent}`);

  // Throttling for failed login attempts to avoid email floods
  if (payload.event === 'login_failed') {
    accumulatedFailedAttempts += 1;
    const cooldownMs = 2 * 60 * 1000; // 2 minutes
    if (now - lastFailedLoginAlertTime < cooldownMs) {
      return { success: true, skipped: true };
    }
    lastFailedLoginAlertTime = now;
  }

  if (Date.now() < smtpAuthFailureCooldownUntil) {
    return { success: false, skipped: true, error: lastSmtpAuthErrorMessage || 'SMTP alerts temporarily paused' };
  }

  const transporter = createTransporter();
  if (!transporter || !alertEmail) {
    // SMTP not configured - safe return
    return { success: false, error: 'SMTP is not configured in environment variables' };
  }

  const textBody = `
${brandName} Security Alert: ${eventMetadata.title}

${eventMetadata.summary}
${payload.details ? `Details: ${payload.details}\n` : ''}
Event Details:
- Event Type: ${payload.event}
- Timestamp: ${payload.timestamp}
- Client IP: ${payload.ip}
- Client Device: ${payload.userAgent}
${accumulatedFailedAttempts > 1 && payload.event === 'login_failed' ? `- Recent failed attempts: ${accumulatedFailedAttempts}\n` : ''}

If this was you, no action is needed.
If this was NOT you, please immediately log in to your store and reset your master password.
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${brandName} Security Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #EFE8E5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td style="background-color: #2B1220; padding: 20px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 500; letter-spacing: 1px;">AURA INTIMATES</h1>
              <p style="margin: 4px 0 0; color: #E0D0D7; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Security & Audit Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 30px;">
              <div style="display: inline-block; padding: 4px 10px; border-radius: 4px; background-color: ${eventMetadata.badgeColor}; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
                ${eventMetadata.title}
              </div>
              <p style="margin: 0 0 16px; color: #2B1220; font-size: 14px; font-weight: 500; line-height: 1.5;">
                ${eventMetadata.summary}
              </p>
              ${payload.details ? `<p style="margin: 0 0 16px; color: #55464D; font-size: 12px; background: #FAF7F5; padding: 10px; border-radius: 6px; border: 1px solid #EFE8E5;">${escapeHtml(payload.details)}</p>` : ''}
              
              <table width="100%" cellpadding="6" cellspacing="0" style="background-color: #FDFCFA; border: 1px solid #EDE5DF; border-radius: 6px; font-size: 11px; color: #55464D; margin-top: 16px;">
                <tr>
                  <td width="30%" style="font-weight: 600; color: #2B1220; border-bottom: 1px solid #F0EAE7;">Timestamp</td>
                  <td style="border-bottom: 1px solid #F0EAE7;">${payload.timestamp}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #2B1220; border-bottom: 1px solid #F0EAE7;">Client IP</td>
                  <td style="border-bottom: 1px solid #F0EAE7; font-family: monospace;">${payload.ip}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #2B1220;">Client Device</td>
                  <td style="word-break: break-all;">${escapeHtml(payload.userAgent)}</td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #886A72; font-size: 11px; line-height: 1.5;">
                If you initiated this action, you can safely disregard this notice. If you suspect unauthorized activity, visit your store and update your credentials immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAF7F5; padding: 14px 30px; text-align: center; border-top: 1px solid #EFE8E5; font-size: 11px; color: #886A72;">
              © ${new Date().getFullYear()} ${brandName}. Automatic Security Alert.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    await transporter.sendMail({
      from: `"${brandName} Security" <${process.env.SMTP_USER}>`,
      to: alertEmail,
      subject: eventMetadata.subject,
      text: textBody,
      html: htmlBody,
    });
    resetSmtpAuthCooldown();
    return { success: true };
  } catch (err: any) {
    const rawError = err.message || 'SMTP alert dispatch error';
    const isBadCredentials = rawError.includes('535') || rawError.includes('BadCredentials') || rawError.includes('Username and Password not accepted');

    if (isBadCredentials) {
      smtpAuthFailureCooldownUntil = Date.now() + 15 * 60 * 1000;
      lastSmtpAuthErrorMessage = 'Invalid SMTP credentials (535 Bad Credentials). If using Gmail, an App Password is required.';
      console.warn(`[SMTP Notice] Skipped sending ${payload.event} alert: Gmail SMTP rejected the configured credentials (535-5.7.8). To receive email alerts, create an App Password in your Google Account Security settings.`);
    } else {
      console.warn(`[SMTP Notice] Failed to send ${payload.event} alert:`, rawError);
    }

    return { success: false, error: rawError };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
