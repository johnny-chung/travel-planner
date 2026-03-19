import mongoose, { Schema, model } from "mongoose";

const SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateShareCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += SHARE_CODE_CHARS[Math.floor(Math.random() * SHARE_CODE_CHARS.length)];
  }
  return code;
}

const TripSchema = new Schema(
  {
    ownerType: {
      type: String,
      enum: ["user", "guest"],
      default: "user",
      index: true,
    },
    userId: { type: String, default: "", index: true },
    guestId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    centerName: { type: String, default: "" },
    centerPlaceId: { type: String, default: "" },
    centerThumbnail: { type: String, default: "" },
    centerLat: { type: Number, default: null },
    centerLng: { type: Number, default: null },
    shareCode: { type: String, unique: true, sparse: true, index: true },
    editors: [{ type: String }],
    pendingEditors: [
      {
        userId: { type: String, required: true },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    travelDates: { type: [String], default: [] },
    transportMode: {
      type: String,
      enum: ["transit", "drive"],
      default: "transit",
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Trip;
}

export const Trip = mongoose.models.Trip ?? model("Trip", TripSchema);
