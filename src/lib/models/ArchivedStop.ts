import mongoose, { Schema, model } from "mongoose";
import { Stop } from "@/lib/models/Stop";

const ArchivedStopSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true, index: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    ...Stop.schema.obj,
  },
  { collection: "archivedStops" },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedStop;
}

export const ArchivedStop =
  mongoose.models.ArchivedStop ?? model("ArchivedStop", ArchivedStopSchema);
