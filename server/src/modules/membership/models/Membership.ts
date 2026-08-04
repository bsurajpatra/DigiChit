import mongoose, { Schema, Document } from 'mongoose';

export enum MembershipStatus {
    INVITED = 'INVITED',
    REQUESTED = 'REQUESTED',
    APPROVED = 'APPROVED', // Ready for Aktivator
    REJECTED = 'REJECTED',
    ACTIVE_MEMBER = 'ACTIVE_MEMBER' // Final status
}

export interface IMembership extends Document {
    chitGroupId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    status: MembershipStatus;
    joinedAt?: Date;
    payoutMonth?: number;
    isWinner: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MembershipSchema: Schema = new Schema({
    chitGroupId: { type: Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(MembershipStatus), default: MembershipStatus.REQUESTED },
    joinedAt: { type: Date },
    payoutMonth: { type: Number, default: 0 },
    isWinner: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Unique index to prevent same user in same group twice
MembershipSchema.index({ chitGroupId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IMembership>('Membership', MembershipSchema);
