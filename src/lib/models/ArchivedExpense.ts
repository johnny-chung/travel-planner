import mongoose, { Schema, model } from "mongoose";
import { Expense } from "@/lib/models/Expense";

const ArchivedExpenseSchema = new Schema(
  {
    originalId: { type: String, required: true, index: true },
    archivedAt: { type: Date, default: Date.now, index: true },
    archivedBy: { type: String, required: true, index: true },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    ...Expense.schema.obj,
  },
  { collection: "archivedExpenses" },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ArchivedExpense;
}

export const ArchivedExpense =
  mongoose.models.ArchivedExpense ??
  model("ArchivedExpense", ArchivedExpenseSchema);
