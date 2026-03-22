import mongoose, { Schema, model } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    stripeCustomerId: { type: String, default: "", index: true },
    stripeInvoiceId: { type: String, default: "", index: true, sparse: true },
    stripeCheckoutSessionId: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },
    orderNumber: { type: String, required: true, index: true },
    kind: {
      type: String,
      enum: ["subscription", "donation"],
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    orderDate: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

OrderSchema.index(
  { stripeInvoiceId: 1 },
  {
    unique: true,
    partialFilterExpression: { stripeInvoiceId: { $type: "string", $ne: "" } },
  },
);

OrderSchema.index(
  { stripeCheckoutSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      stripeCheckoutSessionId: { $type: "string", $ne: "" },
    },
  },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Order;
}

export const Order = mongoose.models.Order ?? model("Order", OrderSchema);
