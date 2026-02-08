import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimeEntry extends Document {
  userId: Types.ObjectId;
  task: string;
  category: string;
  duration: number;
  date: string;
  focusQuality: string;
  interruptions: number;
  notes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "work",
    },
    duration: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    focusQuality: {
      type: String,
      default: "moderate",
    },
    interruptions: {
      type: Number,
      default: 0,
    },
    notes: String,
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

TimeEntrySchema.index({ userId: 1, date: -1 });

export default mongoose.models.TimeEntry ||
  mongoose.model<ITimeEntry>("TimeEntry", TimeEntrySchema);
