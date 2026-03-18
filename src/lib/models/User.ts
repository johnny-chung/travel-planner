import mongoose, { Schema, model } from "mongoose";
import { randomBytes } from "crypto";

/** Generate a short, human-readable user ID: e.g. usr_a3f8k2m1 */
function generateUserId(): string {
  return "usr_" + randomBytes(5).toString("hex"); // 10 hex chars → usr_a3f8k2m1
}

/**
 * App-owned user record, created on first Auth0 sign-in.
 * Fields are written ONCE at creation and never overwritten on subsequent logins
 * so users can edit them later. Add any custom app fields here.
 */
const UserSchema = new Schema(
  {
    userId:   { type: String, unique: true, index: true, default: generateUserId },
    auth0Sub: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: "" }, // Auth0 nickname / username
    email:    { type: String, default: "" },
    name:     { type: String, default: "" },
    image:    { type: String, default: "" },
    phone:    { type: String, default: "" },
    membershipStatus: { type: String, enum: ['basic', 'pro'], default: 'basic' },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    navigationUsage: [{ type: Date }],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.User;
}

export const User = mongoose.models.User ?? model("User", UserSchema);
