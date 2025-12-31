import mongoose, { Schema, Document, Model } from "mongoose";

export interface EventLocation {
  address: string;
  type: "Point";
  coordinates: number[];
}

export interface EventDocument extends Document {
  title: string;
  description: string;
  dateTime: Date;
  endDateTime?: Date;
  capacity?: number;
  status: "published" | "past" | "draft";
  location: EventLocation;
  images: string[];
  tags: string[];
  price?: number;
  createdBy: mongoose.Types.ObjectId;
  participantCount: number;
  visibility: "public" | "mutuals" | "followers" | "friends" | "private";
  hideLocation: boolean;
}

const locationSchema = new Schema<EventLocation>(
  {
    address: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords: number[]) =>
          coords.length === 2 && Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90,
        message: "Coordinates must be [longitude (-180 to 180), latitude (-90 to 90)]",
      },
    },
  },
  { _id: false }
);

const eventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    dateTime: { type: Date, required: true },
    endDateTime: {
      type: Date,
      validate: {
        validator: function (this: EventDocument, val: Date) {
          return !val || val > this.dateTime;
        },
        message: "End date must be after start date",
      },
    },
    capacity: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["published", "past", "draft"],
      default: "published",
    },
    visibility: {
      type: String,
      enum: ["public", "mutuals", "followers", "friends", "private"],
      default: "public",
    },
    hideLocation: { type: Boolean, default: false },
    location: { type: locationSchema, required: true },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    price: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Geospatial index for "10-mile radius" queries
eventSchema.index({ location: "2dsphere" });
// Index for sorting the discovery feed by upcoming events
eventSchema.index({ dateTime: 1 });

// Cleanup: Delete all RSVPs when an event is deleted
eventSchema.post("deleteOne", { document: true, query: false }, async function (doc) {
  await mongoose.model("Rsvp").deleteMany({ event: doc._id });
});

export type EventModel = Model<EventDocument>;
export const Event: EventModel =
  (mongoose.models.Event as EventModel) || mongoose.model<EventDocument>("Event", eventSchema);
