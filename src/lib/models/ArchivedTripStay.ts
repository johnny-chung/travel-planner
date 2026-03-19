import mongoose, { Schema, model } from "mongoose";
import { TripStay } from "@/lib/models/TripStay";

const ArchivedTripStaySchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true, index: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    ...TripStay.schema.obj,
  },
  { collection: "archivedTripStays" },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedTripStay;
}

export const ArchivedTripStay =
  mongoose.models.ArchivedTripStay ??
  model("ArchivedTripStay", ArchivedTripStaySchema);
