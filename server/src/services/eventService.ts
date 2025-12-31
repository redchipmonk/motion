import mongoose, { PipelineStage } from "mongoose";
import { Event, EventDocument, EventModel } from "../models/event";

export interface CreateEventInput {
  title: string;
  description: string;
  dateTime: Date;
  endDateTime?: Date;
  capacity?: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  images?: string[];
  tags?: string[];
  price?: number;
  visibility?: "public" | "mutuals" | "followers" | "friends" | "private";
  hideLocation?: boolean;
  createdBy: mongoose.Types.ObjectId | string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  dateTime?: Date;
  endDateTime?: Date;
  capacity?: number;
  status?: "published" | "past" | "draft";
  visibility?: "public" | "mutuals" | "followers" | "friends" | "private";
  hideLocation?: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  images?: string[];
  tags?: string[];
  price?: number;
}

export class EventService {
  constructor(private readonly eventModel: EventModel = Event) { }

  async createEvent(payload: CreateEventInput) {
    if (payload.endDateTime && payload.endDateTime <= payload.dateTime) {
      throw new Error("End date must be after start date");
    }

    const eventData = {
      ...payload,
      location: {
        address: payload.location.address,
        type: "Point",
        coordinates: [payload.location.longitude, payload.location.latitude],
      },
    };
    const event = new this.eventModel(eventData);
    return event.save();
  }

  async getEventById(id: string) {
    return this.eventModel.findById(id).exec();
  }

  async listEvents(pipeline: PipelineStage[]) {
    return this.eventModel.aggregate(pipeline).exec();
  }

  async updateEvent(id: string, userId: string, updates: UpdateEventInput) {
    const event = await this.eventModel.findById(id);
    if (!event) return null;

    if (event.createdBy.toString() !== userId.toString()) {
      throw new Error("Forbidden");
    }

    // Manual check for date logic if both are present in the update
    if (updates.dateTime && updates.endDateTime && updates.endDateTime <= updates.dateTime) {
      throw new Error("End date must be after start date");
    }

    const { location, ...rest } = updates;
    const updateData: Partial<EventDocument> = { ...rest };
    if (location) {
      updateData.location = {
        address: location.address,
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      };
    }
    return this.eventModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  async deleteEvent(id: string, userId: string) {
    const event = await this.eventModel.findById(id);
    if (!event) return null;

    if (event.createdBy.toString() !== userId.toString()) {
      throw new Error("Forbidden");
    }

    return this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Fetches the discovery feed for a user based on location.
   *
   * Logic:
   * 1. Find events within {radiusInMiles} of the user using $geoNear.
   * 2. Filter for "published" events that haven't happened yet.
   */
  async getDiscoveryFeed(
    userId: string, // Kept for future use or if we want to flag "my events" in the UI
    longitude: number,
    latitude: number,
    radiusInMiles: number = 10
  ) {
    // Earth radius is approximately 3963.2 miles
    const radiusInMeters = radiusInMiles * 1609.34;

    const pipeline: PipelineStage[] = [
      // Stage 1: Geospatial filter using $geoNear. This MUST be the first stage.
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
        },
      },
      // Stage 2: Initial lifecycle filters
      {
        $match: {
          status: "published",
          dateTime: { $gte: new Date() },
        },
      },
      // Stage 3: Sort by soonest first
      { $sort: { dateTime: 1 } },
      // Stage 4: Pagination limit
      { $limit: 50 },
      // Stage 5: Populate creator details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creatorDetails",
        },
      },
      // Stage 6: Reshape the creator data and project final fields
      {
        $unwind: "$creatorDetails",
      },
      {
        $project: {
          "creatorDetails.password": 0,
          "creatorDetails.email": 0,
        },
      },
    ];

    return this.listEvents(pipeline);
  }
}

export const eventService = new EventService();