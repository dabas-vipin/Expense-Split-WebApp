import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Outgoing email abstraction.
 *
 * Ships with a single backend: a Nest Logger write that prints the message
 * to stdout. That keeps the demo container fully self-contained — no API
 * keys, no external network — while making it obvious to operators what
 * the system intends to send.
 *
 * To plug in a real provider (Resend, SES, SendGrid, ...), replace the body
 * of `send()` to dispatch the message via that provider's SDK. The rest of
 * the codebase only touches the typed helpers below.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(message: EmailMessage): Promise<void> {
    // Console backend: emit a structured-ish log so it's easy to grep.
    this.logger.log(
      `[email] -> ${message.to} | subject="${message.subject}"`,
    );
    this.logger.log(`[email]   ${message.text.replace(/\n/g, ' / ')}`);
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    const greeting = `Hi ${name || 'there'},`;
    await this.send({
      to,
      subject: 'Welcome to Soft Split',
      text: `${greeting}\n\nThanks for signing up for Soft Split. Add friends, form groups, and start splitting expenses.\n`,
      html: `<p>${greeting}</p><p>Thanks for signing up for Soft Split. Add friends, form groups, and start splitting expenses.</p>`,
    });
  }

  async sendPasswordReset(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const greeting = `Hi ${name || 'there'},`;
    await this.send({
      to,
      subject: 'Reset your Soft Split password',
      text: `${greeting}\n\nUse this link to reset your password:\n${resetUrl}\n\nThe link expires in 1 hour. If you didn't request this, ignore this email.\n`,
      html: `<p>${greeting}</p><p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    });
  }
}
