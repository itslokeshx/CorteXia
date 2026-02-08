import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  userId: Types.ObjectId;
  category: string;
  amount: number;
  description: string;
  date: string;
  type: "income" | "expense";
  tags: string[];
  linkedGoalId?: string;
  recurring?: boolean;
  vendor?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    linkedGoalId: String,
    recurring: Boolean,
    vendor: String,
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, type: 1 });

export default mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
