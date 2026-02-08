import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHabit extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  frequency: "daily" | "weekly" | "custom";
  customDays?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  color: string;
  streak: number;
  longestStreak: number;
  active: boolean;
  targetDaysPerWeek?: number;
  linkedGoalIds: string[];
  targetTime?: string;
  duration?: number;
  archived: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      default: "productivity",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "custom"],
      default: "daily",
    },
    customDays: {
      type: Schema.Types.Mixed,
    },
    color: {
      type: String,
      default: "#8B5CF6",
    },
    streak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    targetDaysPerWeek: Number,
    linkedGoalIds: {
      type: [String],
      default: [],
    },
    targetTime: String,
    duration: Number,
    archived: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

HabitSchema.index({ userId: 1, active: 1 });
HabitSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Habit ||
  mongoose.model<IHabit>("Habit", HabitSchema);
