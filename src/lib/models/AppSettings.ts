import mongoose, { Schema, model } from "mongoose";

const AppSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    limits: {
      basicActiveTrips: { type: Number, default: null },
      basicArchivedTrips: { type: Number, default: null },
      basicEditorTrips: { type: Number, default: null },
      basicEditorsPerTrip: { type: Number, default: null },
      basicRouteCallsPerMonth: { type: Number, default: null },
      proRouteCallsPerMonth: { type: Number, default: null },
      guestActiveTrips: { type: Number, default: null },
      guestStops: { type: Number, default: null },
      globalRouteCallsPerMonth: { type: Number, default: null },
    },
  },
  { collection: "appSettings", timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AppSettings;
}

export const AppSettings =
  mongoose.models.AppSettings ?? model("AppSettings", AppSettingsSchema);
