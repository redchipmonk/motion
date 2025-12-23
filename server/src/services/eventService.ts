import mongoose, { QueryFilter } from "mongoose";
import { Event, EventDocument, EventModel } from "../models/event";
import { User } from "../models/user";

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
  visibility: "public" | "friends";
  images?: string[];
  price?: number;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId | string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  dateTime?: Date;
  endDateTime?: Date;
  capacity?: number;
  status?: "draft" | "published" | "cancelled" | "past";
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  visibility?: "public" | "friends";
  images?: string[];
  price?: number;
  tags?: string[];
}

export class EventService {
  constructor(private readonly eventModel: EventModel = Event) {}

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

  async listEvents(filter: QueryFilter<EventDocument> = {}) {
    return this.eventModel.find(filter).sort({ dateTime: 1 }).exec();
  }

  async updateEvent(id: string, updates: UpdateEventInput) {
    const updateData: any = { ...updates };
    if (updates.location) {
      updateData.location = {
        address: updates.location.address,
        type: "Point",
        coordinates: [updates.location.longitude, updates.location.latitude],
      };
    }
    return this.eventModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteEvent(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Fetches the discovery feed for a user based on location and social graph.
   *
   * Logic:
   * 1. Find events within {radiusInMiles} of the user.
   * 2. Filter out drafts, cancelled, or past events.
   * 3. Apply "Bouncer" logic:
   *    - Show ALL "public" events.
   *    - Show "friends" events ONLY if the user follows the creator.
   *    - Always show events created by the user themselves.
   */
  async getDiscoveryFeed(
    userId: string,
    longitude: number,
    latitude: number,
    radiusInMiles: number = 10
  ) {
    // 1. Get the list of users the current user follows to resolve "Friends" visibility
    const user = await User.findById(userId).select("following");
    const followingIds = user?.following || [];

    // 2. Calculate radius in radians for MongoDB $centerSphere
    // Earth radius is approximately 3963.2 miles
    const radiusInRadians = radiusInMiles / 3963.2;

    // 3. Execute the Discovery Query
    const events = await this.eventModel.find({
      // Geospatial filter: Events within radius
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
      // Lifecycle filters
      status: "published",
      dateTime: { $gte: new Date() }, // Only future events
      // "Bouncer" Logic
      $or: [
        { visibility: "public" },
        {
          visibility: "friends",
          createdBy: { $in: followingIds }, // I can see friends-only events if I follow the creator
        },
        { createdBy: userId }, // I can always see my own events
      ],
    })
      .sort({ dateTime: 1 }) // Sort by soonest first
      .limit(50) // Pagination limit for the feed
      .populate("createdBy", "name handle profileImage userType"); // Hydrate host details

    return events;
  }
}

export const eventService = new EventService();