import mongoose, { Schema, model } from "mongoose";

const StopSchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    placeId: { type: String, default: "" },
    notes: { type: String, default: "" },
    openingHours: { type: [String], default: [] },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    linkedDocIds: { type: [String], default: [] },
    arrivals: {
      type: [{ date: { type: String, required: true }, time: { type: String, required: true } }],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Stop;
}

export const Stop = mongoose.models.Stop ?? model("Stop", StopSchema);
