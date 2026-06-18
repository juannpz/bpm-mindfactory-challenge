import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: port === '465',
        auth: { user, pass },
      });
    }
  }

  async sendMagicLink(
    email: string,
    magicLink: string,
    nombre?: string,
  ): Promise<{ sent: boolean }> {
    const subject = 'Acceso a BPM Trámites de Oficina';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Acceso a BPM Trámites de Oficina</h2>
        <p>Hola${nombre ? ' ' + nombre : ''},</p>
        <p>Hacé clic en el siguiente enlace para iniciar sesión:</p>
        <p>
          <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 4px;">
            Iniciar sesión
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Este enlace expira en 15 minutos. Si no solicitaste este acceso, ignorá este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 11px;">
          Enlace directo: ${magicLink}
        </p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'no-reply@bpm.local',
        to: email,
        subject,
        html,
      });
      return { sent: true };
    }

    console.log('========================================');
    console.log('  MAGIC LINK (email simulado)');
    console.log(`  Para: ${email}`);
    console.log(`  Link: ${magicLink}`);
    console.log('========================================');

    return { sent: false };
  }

  get isReal(): boolean {
    return this.transporter !== null;
  }
}
