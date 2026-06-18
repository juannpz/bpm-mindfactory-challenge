import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface MagicToken {
  email: string;
  expiresAt: Date;
}

@Injectable()
export class MagicTokenService {
  private tokens = new Map<string, MagicToken>();

  private readonly ttlMs = 15 * 60 * 1000; // 15 minutes

  generate(email: string): string {
    this.cleanExpired();

    const raw = crypto.randomBytes(32).toString('hex');
    const token = `${raw}:${Date.now()}`;

    this.tokens.set(token, {
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + this.ttlMs),
    });

    return token;
  }

  validate(token: string): string | null {
    this.cleanExpired();

    const stored = this.tokens.get(token);
    if (!stored) return null;

    this.tokens.delete(token);
    return stored.email;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.tokens) {
      if (value.expiresAt.getTime() < now) {
        this.tokens.delete(key);
      }
    }
  }
}
