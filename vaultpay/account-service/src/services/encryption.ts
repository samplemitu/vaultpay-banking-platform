import crypto from 'crypto';

const AES_SECRET = process.env.AES_SECRET!; // must be 32 bytes
const IV_LENGTH = 16;

export class EncryptionService {
  static encrypt(data: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(AES_SECRET),
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(payload: string): string {
    const [ivHex, encrypted] = payload.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(AES_SECRET),
      iv
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}


