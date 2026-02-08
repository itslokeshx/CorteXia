import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  domain: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "completed" | "blocked";
  dueDate?: string;
  dueTime?: string;
  scheduledFor?: string;
  timeEstimate?: number;
  timeSpent?: number;
  completedAt?: string;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  tags: string[];
  linkedGoalId?: string;
  timeBlockId?: string;
  recurrence?: {
    frequency: string;
    daysOfWeek?: number[];
    endDate?: string;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
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
    domain: {
      type: String,
      default: "personal",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed", "blocked"],
      default: "todo",
    },
    dueDate: String,
    dueTime: String,
    scheduledFor: String,
    timeEstimate: Number,
    timeSpent: Number,
    completedAt: String,
    subtasks: {
      type: [
        {
          id: String,
          title: String,
          completed: Boolean,
          completedAt: String,
        },
      ],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    linkedGoalId: String,
    timeBlockId: String,
    recurrence: {
      type: Schema.Types.Mixed,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);
