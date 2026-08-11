import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    actorId: mongoose.Types.ObjectId;
    actorRole: string;
    action: string;
    targetUserId?: mongoose.Types.ObjectId | undefined;
    previousValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
    timestamp: Date;
}

const AuditLogSchema = new Schema({
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Ensure audit logs are not editable or deletable via application logic
AuditLogSchema.pre('save', function (this: IAuditLog) {
    if (!this.isNew) {
        throw new Error('Audit logs are immutable and cannot be updated.');
    }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
