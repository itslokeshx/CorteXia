import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJournalEntry extends Document {
  userId: Types.ObjectId;
  date: string;
  title?: string;
  content?: string;
  mood?: number;
  energy?: number;
  focus?: number;
  stress?: number;
  tags: string[];
  aiSummary?: string;
  aiSentiment?: string;
  aiThemes?: string[];
  aiInsights?: string;
  linkedGoalIds: string[];
  linkedHabitIds: string[];
  linkedTaskIds: string[];
  gratitudeList: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    title: String,
    content: String,
    mood: {
      type: Number,
      min: 1,
      max: 10,
    },
    energy: {
      type: Number,
      min: 1,
      max: 10,
    },
    focus: {
      type: Number,
      min: 1,
      max: 10,
    },
    stress: {
      type: Number,
      min: 1,
      max: 10,
    },
    tags: {
      type: [String],
      default: [],
    },
    aiSummary: String,
    aiSentiment: String,
    aiThemes: {
      type: [String],
      default: [],
    },
    aiInsights: String,
    linkedGoalIds: {
      type: [String],
      default: [],
    },
    linkedHabitIds: {
      type: [String],
      default: [],
    },
    linkedTaskIds: {
      type: [String],
      default: [],
    },
    gratitudeList: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

JournalEntrySchema.index({ userId: 1, date: -1 });

export default mongoose.models.JournalEntry ||
  mongoose.model<IJournalEntry>("JournalEntry", JournalEntrySchema);
