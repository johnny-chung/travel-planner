import mongoose, { Schema, model } from "mongoose";
import { TripTransport } from "@/lib/models/TripTransport";

const ArchivedTripTransportSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true, index: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    ...TripTransport.schema.obj,
  },
  { collection: "archivedTripTransports" },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedTripTransport;
}

export const ArchivedTripTransport =
  mongoose.models.ArchivedTripTransport ??
  model("ArchivedTripTransport", ArchivedTripTransportSchema);
