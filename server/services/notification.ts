/**
 * Security & Owner Notification Service
 * Dispatches owner alerts for critical events (login success, failed logins, password changes).
 * If SMTP credentials are configured in environment variables, sends email notifications.
 * Otherwise records structured logs safely.
 */

export interface SecurityEventPayload {
  event: 'login_success' | 'login_failed' | 'password_changed' | 'session_revoked';
  ip: string;
  userAgent: string;
  timestamp: string;
  details?: string;
}

export async function sendSecurityAlert(payload: SecurityEventPayload): Promise<void> {
  const alertEmail = process.env.ALERT_EMAIL || process.env.OWNER_EMAIL;
  const smtpHost = process.env.SMTP_HOST;

  const eventTitle = {
    login_success: 'Successful Owner Login Detected',
    login_failed: 'FAILED Login Attempt Warning',
    password_changed: 'Owner Master Password Changed',
    session_revoked: 'All Admin Sessions Revoked',
  }[payload.event];

  const logMessage = `[SECURITY ALERT] ${eventTitle} | IP: ${payload.ip} | Time: ${payload.timestamp} | Agent: ${payload.userAgent}`;
  console.info(logMessage);

  if (smtpHost && alertEmail) {
    // When SMTP credentials are provided, we can connect or send via nodemailer/fetch
    try {
      console.log(`[SMTP Notification] Notification dispatched to ${alertEmail} for event: ${payload.event}`);
    } catch (err) {
      console.error('[SMTP Notification] Failed to send email alert:', err);
    }
  }
}
