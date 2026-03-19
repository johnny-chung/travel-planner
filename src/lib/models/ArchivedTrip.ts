import mongoose, { Schema, model } from "mongoose";
import { Trip } from "@/lib/models/Trip";

const ArchivedTripSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true, index: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    ...Trip.schema.obj,
  },
  { collection: "archivedTrips" },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedTrip;
}

export const ArchivedTrip =
  mongoose.models.ArchivedTrip ?? model("ArchivedTrip", ArchivedTripSchema);
