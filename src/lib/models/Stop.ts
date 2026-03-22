import mongoose, { Schema, model } from "mongoose";

const StopSchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    placeId: { type: String, default: "" },
    notes: { type: String, default: "", maxlength: 500 },
    openingHours: { type: [String], default: [] },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    linkedDocIds: { type: [String], default: [] },
    sourceType: {
      type: String,
      enum: ["manual", "flight", "custom_transport", "stay"],
      default: "manual",
      index: true,
    },
    sourceId: { type: String, default: "", index: true },
    sourceLabel: { type: String, default: "" },
    displayTime: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["scheduled", "unscheduled"],
      default: "unscheduled",
      index: true,
    },
    date: { type: String, default: "", index: true },
    time: { type: String, default: "" },
    sequence: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Stop;
}

export const Stop = mongoose.models.Stop ?? model("Stop", StopSchema);
