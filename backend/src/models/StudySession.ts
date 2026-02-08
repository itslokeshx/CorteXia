import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudySession extends Document {
  userId: Types.ObjectId;
  subject: string;
  topic?: string;
  duration: number;
  pomodoros: number;
  difficulty: string;
  notes?: string;
  startTime: string;
  endTime: string;
  retention?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    topic: String,
    duration: {
      type: Number,
      required: true,
    },
    pomodoros: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      default: "medium",
    },
    notes: String,
    startTime: String,
    endTime: String,
    retention: Number,
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

StudySessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);
