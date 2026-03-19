import mongoose, { Schema, model } from "mongoose";

const TravelTimeSchema = new Schema({
  planId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  fromStopId: { type: String, required: true, index: true },
  toStopId: { type: String, required: true },
  mode: { type: String, enum: ["TRANSIT", "DRIVE", "WALK"], default: "TRANSIT" },
  durationMinutes: { type: Number, required: true },
  distanceMeters: { type: Number, default: null },
  summary: { type: String, default: "" },
  details: {
    type: [{
      type: { type: String, enum: ["TRANSIT", "DRIVE", "WALK"], required: true },
      label: { type: String, required: true },
      durationMinutes: { type: Number, required: true },
      distanceMeters: { type: Number, default: null },
      departureStop: { type: String, default: "" },
      arrivalStop: { type: String, default: "" },
      lineName: { type: String, default: "" },
      headsign: { type: String, default: "" },
    }],
    default: [],
  },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

TravelTimeSchema.index({ fromStopId: 1, toStopId: 1, mode: 1 }, { unique: true });

if (process.env.NODE_ENV === "development") { delete mongoose.models.TravelTime; }

export const TravelTime = mongoose.models.TravelTime ?? model("TravelTime", TravelTimeSchema);
