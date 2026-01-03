import mongoose from 'mongoose';
import { EncryptionService } from '../services/encryption';

export interface AccountDoc extends mongoose.Document {
  userId: string;
  accountNumber: string; // encrypted
  accountType: 'savings' | 'current';
  balance: number; // stored as integer (paise)
  currency: string;
  isActive: boolean;
  createdAt: Date;
  decryptAccountNumber(): string;
}

const accountSchema = new mongoose.Schema<AccountDoc>(
  {
    userId: { type: String, required: true, index: true },
    accountNumber: {
      type: String,
      required: true,
      set: (val: string) => EncryptionService.encrypt(val),
      get: (val: string) => val,
    },
    accountType: {
      type: String,
      enum: ['savings', 'current'],
      required: true,
    },
    balance: {
      type: Number,
      default: 0, // always stored as integer (paise)
    },
    currency: {
      type: String,
      default: 'INR',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
      },
    },
  }
);

accountSchema.methods.decryptAccountNumber = function () {
  return EncryptionService.decrypt(this.accountNumber);
};

export const Account = mongoose.model<AccountDoc>('Account', accountSchema);
