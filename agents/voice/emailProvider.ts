/**
 * Email Provider Abstraction
 *
 * All email delivery goes through EmailProvider. No SDK-specific types
 * appear outside the concrete provider implementation.
 * Mirrors the AIProvider pattern in provider.ts.
 */

// ── Normalized types ──────────────────────────────────────────────────────────

export interface SendEmailParams {
  /** Recipient address or list of addresses. */
  to:       string | string[];
  /** Sender address — defaults to RESEND_FROM_EMAIL env var. */
  from?:    string;
  subject:  string;
  /** HTML body (required). */
  html:     string;
  /** Plain-text fallback (optional but recommended). */
  text?:    string;
  /** Reply-to address (optional). */
  replyTo?: string;
}

export interface EmailResult {
  /** Provider-assigned message ID. */
  id: string;
}

// ── Rate limit error ──────────────────────────────────────────────────────────

export class EmailRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailRateLimitError";
  }
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface EmailProvider {
  send(params: SendEmailParams): Promise<EmailResult>;
}
