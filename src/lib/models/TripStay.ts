import mongoose, { Schema, model } from "mongoose";

const TripStaySchema = new Schema(
  {
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    placeId: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    checkInDate: { type: String, required: true, index: true },
    checkOutDate: { type: String, required: true, index: true },
    thumbnail: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.TripStay;
}

export const TripStay =
  mongoose.models.TripStay ?? model("TripStay", TripStaySchema);
