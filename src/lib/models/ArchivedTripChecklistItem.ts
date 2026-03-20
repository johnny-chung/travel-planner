import mongoose, { Schema, model } from "mongoose";

const ArchivedTripChecklistItemSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    tripId: { type: String, required: true, index: true },
    text: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    checkedBy: { type: String, default: "", trim: true },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true },
  },
  { timestamps: false },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedTripChecklistItem;
}

export const ArchivedTripChecklistItem =
  mongoose.models.ArchivedTripChecklistItem ??
  model("ArchivedTripChecklistItem", ArchivedTripChecklistItemSchema);
