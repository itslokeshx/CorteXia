import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAIConversation extends Document {
  userId: Types.ObjectId;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    actions?: any[];
  }>;
  contextSnapshot?: any;
  conversationType: "general" | "mental_health" | "planning" | "reflection";
  title?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: {
      type: [
        {
          role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
          },
          content: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          actions: [Schema.Types.Mixed],
        },
      ],
      default: [],
    },
    contextSnapshot: Schema.Types.Mixed,
    conversationType: {
      type: String,
      enum: ["general", "mental_health", "planning", "reflection"],
      default: "general",
    },
    title: String,
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

AIConversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.AIConversation ||
  mongoose.model<IAIConversation>("AIConversation", AIConversationSchema);
