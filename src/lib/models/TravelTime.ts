import mongoose, { Schema, model } from "mongoose";

const TravelTimeSchema = new Schema({
  planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
  fromStopId: { type: Schema.Types.ObjectId, ref: "Stop", required: true, index: true },
  toStopId: { type: Schema.Types.ObjectId, ref: "Stop", required: true },
  mode: { type: String, enum: ["TRANSIT", "DRIVE", "WALK"], default: "TRANSIT" },
  durationMinutes: { type: Number, required: true },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

TravelTimeSchema.index({ fromStopId: 1, toStopId: 1, mode: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") { delete mongoose.models.TravelTime; }

export const TravelTime = mongoose.models.TravelTime ?? model("TravelTime", TravelTimeSchema);
