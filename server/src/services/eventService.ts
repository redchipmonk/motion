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

  async listEvents(pipeline: PipelineStage[]) {
    return this.eventModel.aggregate(pipeline).exec();
  }

  async updateEvent(id: string, updates: UpdateEventInput) {
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

  async deleteEvent(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Fetches the discovery feed for a user based on location and social graph using a single aggregation pipeline.
   *
   * Logic:
   * 1. Find events within {radiusInMiles} of the user using $geoNear.
   * 2. Filter out drafts, cancelled, or past events.
   * 3. Look up the user's friends from the 'friendships' collection.
   * 4. Apply "Bouncer" logic:
   *    - Show ALL "public" events.
   *    - Show "friends" events ONLY if the event creator is a friend.
   *    - Always show events created by the user themselves.
   */
  async getDiscoveryFeed(
    userId: string,
    longitude: number,
    latitude: number,
    radiusInMiles: number = 10
  ) {
    const userIdObject = new mongoose.Types.ObjectId(userId);

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
      // Stage 3: Look up friendships where the user is either the requester or recipient
      {
        $lookup: {
          from: "friendships",
          let: { userId: userIdObject },
          pipeline: [
            {
              $match: {
                status: "accepted",
                $expr: {
                  $or: [
                    { $eq: ["$requester", "$$userId"] },
                    { $eq: ["$recipient", "$$userId"] },
                  ],
                },
              },
            },
            // Project the other user's ID
            {
              $project: {
                friendId: {
                  $cond: {
                    if: { $eq: ["$requester", "$$userId"] },
                    then: "$recipient",
                    else: "$requester",
                  },
                },
              },
            },
          ],
          as: "userFriends",
        },
      },
      // Stage 4: Create a field with an array of just the friend IDs
      {
        $addFields: {
          friendIds: {
            $map: {
              input: "$userFriends",
              as: "friend",
              in: "$$friend.friendId",
            },
          },
        },
      },
      // Stage 5: "Bouncer" Logic Filter
      {
        $match: {
          $or: [
            { visibility: "public" },
            { createdBy: userIdObject },
            {
              "visibility": "friends",
              "createdBy": { $in: "$friendIds" },
            },
          ],
        },
      },
      // Stage 6: Sort by soonest first
      { $sort: { dateTime: 1 } },
      // Stage 7: Pagination limit
      { $limit: 50 },
      // Stage 8: Populate creator details
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creatorDetails",
        },
      },
      // Stage 9: Reshape the creator data and project final fields
      {
        $unwind: "$creatorDetails",
      },
      {
        $project: {
          // Exclude helper fields and sensitive data
          friendships: 0,
          friendIds: 0,
          userFriends: 0,
          "creatorDetails.password": 0,
          "creatorDetails.email": 0,
        },
      },
    ];

    return this.listEvents(pipeline);
  }
}

export const eventService = new EventService();