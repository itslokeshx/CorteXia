import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  provider: "credentials" | "google";
  emailVerified?: Date;
  theme: "light" | "dark" | "auto";
  timezone: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    dailySummary: boolean;
    goalReminders: boolean;
    habitStreaks: boolean;
  };
  onboardingCompleted: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    password: String,
    image: String,
    provider: {
      type: String,
      enum: ["credentials", "google"],
      required: true,
    },
    emailVerified: Date,
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "dark",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    notificationPreferences: {
      type: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        dailySummary: { type: Boolean, default: true },
        goalReminders: { type: Boolean, default: true },
        habitStreaks: { type: Boolean, default: true },
      },
      default: {},
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
