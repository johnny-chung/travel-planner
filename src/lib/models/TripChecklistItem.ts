import mongoose, { Schema, model } from "mongoose";

const TripChecklistItemSchema = new Schema(
  {
    tripId: { type: String, required: true, index: true },
    text: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false, index: true },
    checkedBy: { type: String, default: "", trim: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.TripChecklistItem;
}

export const TripChecklistItem =
  mongoose.models.TripChecklistItem ??
  model("TripChecklistItem", TripChecklistItemSchema);
