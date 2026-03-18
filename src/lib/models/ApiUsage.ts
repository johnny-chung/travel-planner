import mongoose, { Schema, model } from "mongoose";

const ApiUsageSchema = new Schema({
  yearMonth: { type: String, required: true },  // "2026-03"
  apiType: { type: String, enum: ["routes", "places", "geolocation"], required: true },
  count: { type: Number, default: 0 },
}, { timestamps: false });

ApiUsageSchema.index({ yearMonth: 1, apiType: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") { delete mongoose.models.ApiUsage; }

export const ApiUsage = mongoose.models.ApiUsage ?? model("ApiUsage", ApiUsageSchema);
