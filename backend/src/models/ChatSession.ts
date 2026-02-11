import mongoose, { Schema, Document } from "mongoose";

export interface ICoachMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface IChatSession extends Document {
    userId: mongoose.Types.ObjectId;
    messages: ICoachMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const CoachMessageSchema = new Schema({
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        messages: [CoachMessageSchema],
    },
    { timestamps: true },
);

// Create compound index for faster queries by user
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
