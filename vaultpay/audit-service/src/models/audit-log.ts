import mongoose from 'mongoose';

export interface AuditLogDoc extends mongoose.Document {
  eventType: string;
  correlationId?: string;
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata: any;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDoc>({
  eventType: { type: String, required: true },
  correlationId: { type: String },
  userId: { type: String },
  role: { type: String },
  path: { type: String },
  method: { type: String },
  statusCode: { type: Number },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

// IMMUTABLE: disable all updates
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs cannot be updated');
});
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs cannot be updated');
});
auditLogSchema.pre('save', function (next) {
  // allow save
  next();
});

export const AuditLog = mongoose.model<AuditLogDoc>('AuditLog', auditLogSchema);
