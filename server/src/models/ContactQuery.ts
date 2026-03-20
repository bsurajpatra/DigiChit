import mongoose from 'mongoose';

export interface IMessage {
    senderId?: mongoose.Types.ObjectId;
    senderRole: 'USER' | 'ADMIN';
    message: string;
    sentAt: Date;
    isRead: boolean;
}

export interface IContactQuery extends mongoose.Document {
    userId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    subject: string;
    status: 'PENDING' | 'RESOLVED';
    source: 'EXTERNAL' | 'INTERNAL';
    messages: IMessage[];
    // Legacy fields for backward compatibility
    message?: string;
    responses?: any[];
    createdAt: Date;
    updatedAt: Date;
}

const ContactQuerySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'RESOLVED'], default: 'PENDING' },
    source: { type: String, enum: ['EXTERNAL', 'INTERNAL'], default: 'EXTERNAL' },
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderRole: { type: String, enum: ['USER', 'ADMIN'], required: true },
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false }
    }],
    // Added for legacy data mapping
    message: { type: String },
    responses: [{
        message: { type: String },
        respondedAt: { type: Date },
        respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

export default mongoose.model<IContactQuery>('ContactQuery', ContactQuerySchema);
