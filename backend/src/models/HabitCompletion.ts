import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHabitCompletion extends Document {
  habitId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  completed: boolean;
  note?: string;
  mood?: number;
  createdAt: Date;
  updatedAt: Date;
}

const HabitCompletionSchema = new Schema<IHabitCompletion>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
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
    completed: {
      type: Boolean,
      default: false,
    },
    note: String,
    mood: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

HabitCompletionSchema.index({ habitId: 1, date: 1 }, { unique: true });
HabitCompletionSchema.index({ userId: 1, date: 1 });

export default mongoose.models.HabitCompletion ||
  mongoose.model<IHabitCompletion>("HabitCompletion", HabitCompletionSchema);
