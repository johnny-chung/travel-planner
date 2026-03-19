import mongoose, { Schema, model } from "mongoose";

const TripLocationPointSchema = new Schema(
  {
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    placeId: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false },
);

const TripTransportSchema = new Schema(
  {
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["flight", "custom"], required: true },
    title: { type: String, default: "" },
    flightNumber: { type: String, default: "" },
    departureDate: { type: String, required: true, index: true },
    departureTime: { type: String, required: true },
    arrivalDate: { type: String, required: true, index: true },
    arrivalTime: { type: String, required: true },
    departure: { type: TripLocationPointSchema, required: true },
    arrival: { type: TripLocationPointSchema, required: true },
    sourceMode: {
      type: String,
      enum: ["manual", "airlabs"],
      default: "manual",
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.TripTransport;
}

export const TripTransport =
  mongoose.models.TripTransport ?? model("TripTransport", TripTransportSchema);
