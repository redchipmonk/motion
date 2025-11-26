import mongoose, { Schema, Document, Model } from "mongoose";

export interface EventLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface EventDocument extends Document {
  title: string;
  description: string;
  dateTime: Date;
  location: EventLocation;
  visibility: "public" | "friends";
  images: string[];
  price?: number;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
}

const locationSchema = new Schema<EventLocation>(
  {
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const eventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    dateTime: { type: Date, required: true },
    location: { type: locationSchema, required: true },
    visibility: { type: String, enum: ["public", "friends"], required: true },
    images: { type: [String], default: [] },
    price: Number,
    tags: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

export type EventModel = Model<EventDocument>;
export const Event: EventModel =
  (mongoose.models.Event as EventModel) || mongoose.model<EventDocument>("Event", eventSchema);
