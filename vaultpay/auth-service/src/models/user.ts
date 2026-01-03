import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// Interface for TypeScript Safety
export interface IUser extends Document {
  id: string; //
  email: string;
  password: string;
  role: 'admin' | 'customer';
  deviceFingerprint: string;
  failedLoginAttempts: number;
  lockUntil: Date | null;
}

const AES_KEY = process.env.AES_SECRET!; // Must be 32 bytes (256-bit key)
const IV_LENGTH = 16;

// 🔐 Helper: Encryption
const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(AES_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// 🔓 Helper: Decryption for device fingerprint comparison
export const decryptDeviceFingerprint = (value: string): string => {
  try {
    const [ivHex, encryptedHex] = value.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(AES_KEY),
      iv
    );

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString();
  } catch {
    return ''; // return empty if decryption fails
  }
};

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    deviceFingerprint: {
      type: String,
      required: true,
      set: encrypt,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        // 👇 Make the fields optional to avoid TS delete error
        delete ret?.password;
        delete ret?.__v;
        delete ret?.deviceFingerprint;
        delete ret?.failedLoginAttempts;
        delete ret?.lockUntil;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
