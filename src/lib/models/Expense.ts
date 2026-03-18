import mongoose, { Schema, model } from "mongoose";

const ExpenseSchema = new Schema(
  {
    tripId: { type: String, required: true, index: true },
    addedBy: { type: String, required: true }, // userId
    description: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    amount: { type: Number, required: true },
    currency: { type: String, default: "CAD" },
    type: { type: String, enum: ["shared", "own"], default: "shared" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Expense;
}

export const Expense = mongoose.models.Expense ?? model("Expense", ExpenseSchema);
