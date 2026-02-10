import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  priority: string;
  targetDate?: string;
  progress: number;
  status:
  | "active"
  | "completed"
  | "paused"
  | "abandoned"
  | "at_risk"
  | "failing";
  milestones: Array<{
    id: string;
    title: string;
    targetDate?: string;
    completed: boolean;
    completedAt?: string;
  }>;
  level: string;
  parentGoalId?: string;
  childGoalIds: string[];
  linkedHabitIds: string[];
  linkedTaskIds: string[];
  aiRoadmap?: any;
  tags: string[];
  archived: boolean;
  deletedAt?: Date;
  completedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
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
    category: {
      type: String,
      default: "personal",
    },
    priority: {
      type: String,
      default: "medium",
    },
    targetDate: String,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "paused",
        "abandoned",
        "at_risk",
        "failing",
      ],
      default: "active",
    },
    milestones: {
      type: [
        {
          id: String,
          title: String,
          targetDate: String,
          completed: Boolean,
          completedAt: String,
        },
      ],
      default: [],
    },
    level: {
      type: String,
      default: "yearly",
    },
    parentGoalId: String,
    childGoalIds: {
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
    aiRoadmap: Schema.Types.Mixed,
    tags: {
      type: [String],
      default: [],
    },
    archived: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    completedAt: String,
  },
  {
    timestamps: true,
  },
);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, deadline: 1 });
// Sparse index to allow multiple goals with same title if they have different parentGoalIds
// Only enforce uniqueness for top-level goals (parentGoalId is null or undefined)
GoalSchema.index(
  { userId: 1, title: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { parentGoalId: { $exists: false } }
  }
);

export default mongoose.models.Goal ||
  mongoose.model<IGoal>("Goal", GoalSchema);
