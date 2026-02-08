import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimeBlock extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  type: string;
  status: string;
  linkedTaskId?: string;
  linkedHabitId?: string;
  linkedGoalId?: string;
  color?: string;
  aiGenerated?: boolean;
  aiReason?: string;
  notes?: string;
  completed: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimeBlockSchema = new Schema<ITimeBlock>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    date: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: Number,
    type: {
      type: String,
      default: "task",
    },
    status: {
      type: String,
      default: "planned",
    },
    linkedTaskId: String,
    linkedHabitId: String,
    linkedGoalId: String,
    color: String,
    aiGenerated: Boolean,
    aiReason: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

TimeBlockSchema.index({ userId: 1, date: 1 });

export default mongoose.models.TimeBlock ||
  mongoose.model<ITimeBlock>("TimeBlock", TimeBlockSchema);
