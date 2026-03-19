import mongoose, { Schema, model } from "mongoose";

const AirportCacheSchema = new Schema(
  {
    iataCode: { type: String, required: true, uppercase: true, trim: true, unique: true },
    icaoCode: { type: String, default: "", uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    countryCode: { type: String, default: "", uppercase: true, trim: true },
    website: { type: String, default: "", trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AirportCache;
}

export const AirportCache =
  mongoose.models.AirportCache ?? model("AirportCache", AirportCacheSchema);
