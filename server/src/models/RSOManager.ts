import mongoose, { Schema, Document, Model } from "mongoose";

export interface RSOManagerDocument extends Document {
  user: mongoose.Types.ObjectId;
  rso: mongoose.Types.ObjectId;
  role: "president" | "officer" | "member"; // Extend roles as needed
}

const rsoManagerSchema = new Schema<RSOManagerDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rso: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["president", "officer", "member"],
      default: "officer",
    },
  },
  { timestamps: true }
);

// Ensure a user has only one role per RSO
rsoManagerSchema.index({ user: 1, rso: 1 }, { unique: true });

export type RSOManagerModel = Model<RSOManagerDocument>;
export const RSOManager: RSOManagerModel =
  (mongoose.models.RSOManager as RSOManagerModel) ||
  mongoose.model<RSOManagerDocument>("RSOManager", rsoManagerSchema);
