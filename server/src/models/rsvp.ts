import mongoose, { Schema, Document, Model } from "mongoose";

export interface RsvpDocument extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: "going" | "interested" | "waitlist";
  notes?: string;
}

const rsvpSchema = new Schema<RsvpDocument>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["going", "interested", "waitlist"], default: "going" },
    notes: String,
  },
  { timestamps: true }
);

rsvpSchema.index({ event: 1, user: 1 }, { unique: true });

export type RsvpModel = Model<RsvpDocument>;
export const Rsvp: RsvpModel =
  (mongoose.models.Rsvp as RsvpModel) || mongoose.model<RsvpDocument>("Rsvp", rsvpSchema);
