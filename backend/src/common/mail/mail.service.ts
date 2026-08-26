import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppConfig } from '../../config/configuration';

export interface SendInvitationMailInput {
  to: string;
  name: string;
  invitationUrl: string;
  expiresAt: Date;
}

/**
 * Thin SMTP-backed mail sender. `mail.provider`/`mail.host`/`mail.port`/
 * `mail.from` are read from AppConfig (never process.env directly, per
 * config module convention) so switching to a real provider later
 * (Mailjet, SES, ...) is an env-var + transport-construction change here
 * only - callers only ever see `sendInvitation()`.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(configService: ConfigService<AppConfig>) {
    const mailConfig = configService.get('mail', { infer: true });
    this.from = mailConfig.from;
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: false,
    });
  }

  async sendInvitation(input: SendInvitationMailInput): Promise<void> {
    const expiresAtLabel = input.expiresAt.toUTCString();
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'You have been invited to create an account',
      html: `
        <p>Hi ${input.name},</p>
        <p>You have been invited to create an account.</p>
        <p><a href="${input.invitationUrl}">Accept Invitation</a></p>
        <p>This link expires on ${expiresAtLabel}.</p>
      `,
    });
    this.logger.log('Invitation email sent.', MailService.name);
  }
}
