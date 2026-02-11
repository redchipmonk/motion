import mongoose, { Schema, Document, Model } from "mongoose";

export interface ConnectionRequestDocument extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
}

const connectionRequestSchema = new Schema<ConnectionRequestDocument>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Ensure unique request between two users
connectionRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export type ConnectionRequestModel = Model<ConnectionRequestDocument>;
export const ConnectionRequest: ConnectionRequestModel =
  (mongoose.models.ConnectionRequest as ConnectionRequestModel) ||
  mongoose.model<ConnectionRequestDocument>("ConnectionRequest", connectionRequestSchema);
