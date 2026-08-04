import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const TokenSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Expires at the time stored in this field
    }
});

export default mongoose.model<IToken>('Token', TokenSchema);
