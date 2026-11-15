import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly rounds: number;
  /** Used to keep login timing similar for unknown e-mails. */
  private dummyHash: Promise<string>;

  constructor(config: ConfigService) {
    this.rounds = config.get<number>('BCRYPT_ROUNDS') ?? 12;
    this.dummyHash = hash('dummy-password-for-timing', this.rounds);
  }

  hash(password: string) {
    return hash(password, this.rounds);
  }

  async verify(password: string, passwordHash: string | null): Promise<boolean> {
    if (!passwordHash) {
      await compare(password, await this.dummyHash);
      return false;
    }
    return compare(password, passwordHash);
  }
}
