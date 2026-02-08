import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserMemory extends Document {
  userId: Types.ObjectId;
  name?: string;
  preferences: Record<string, any>;
  reminders: Array<{
    id: string;
    content: string;
    time: string;
    completed: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserMemorySchema = new Schema<IUserMemory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: String,
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reminders: {
      type: [
        {
          id: String,
          content: String,
          time: String,
          completed: Boolean,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.UserMemory ||
  mongoose.model<IUserMemory>("UserMemory", UserMemorySchema);
