import mongoose, { Schema, model } from "mongoose";

const UserMonthlyUsageSchema = new Schema({
  userId: { type: String, required: true },
  yearMonth: { type: String, required: true }, // "2026-03"
  commuteCount: { type: Number, default: 0 },
}, { timestamps: false });

UserMonthlyUsageSchema.index({ userId: 1, yearMonth: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") { delete mongoose.models.UserMonthlyUsage; }

export const UserMonthlyUsage = mongoose.models.UserMonthlyUsage ?? model("UserMonthlyUsage", UserMonthlyUsageSchema);
