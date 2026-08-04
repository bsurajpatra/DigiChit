import mongoose, { Document, Schema } from 'mongoose';

export interface IThreadMessage {
    _id?: string;
    senderId: mongoose.Types.ObjectId;
    senderRole: 'MEMBER' | 'ORGANIZER';
    senderName: string;
    text: string;
    sentAt: Date;
}

export interface IChitMessage extends Document {
    groupId: mongoose.Types.ObjectId;
    memberId: mongoose.Types.ObjectId;
    organizerId: mongoose.Types.ObjectId;
    subject: string;
    status: 'OPEN' | 'RESOLVED';
    messages: IThreadMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ThreadMessageSchema = new Schema<IThreadMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['MEMBER', 'ORGANIZER'], required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

const ChitMessageSchema = new Schema<IChitMessage>({
    groupId: { type: Schema.Types.ObjectId, ref: 'ChitGroup', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    messages: [ThreadMessageSchema]
}, { timestamps: true });

export default mongoose.model<IChitMessage>('ChitMessage', ChitMessageSchema);
