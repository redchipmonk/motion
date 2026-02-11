/**
 * @file Event business logic service.
 * 
 * Handles CRUD operations for events including geospatial queries for the
 * discovery feed. Uses MongoDB aggregation pipelines with $geoNear for
 * location-based filtering.
 * 
 * @example
 * import { eventService } from './eventService';
 * const feed = await eventService.getDiscoveryFeed(userId, lng, lat, 10);
 */

import mongoose, { PipelineStage } from "mongoose";
import { Event, EventDocument, EventModel } from "../models/event";
import {
  MILES_TO_METERS,
  DEFAULT_FEED_RADIUS_MILES,
  ERROR_FORBIDDEN,
  ERROR_END_DATE_BEFORE_START
} from "../constants";

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

/**
 * Service class for event CRUD operations and geospatial queries.
 * Uses dependency injection for testability (accepts custom EventModel).
 */
export class EventService {
  constructor(private readonly eventModel: EventModel = Event) { }

  /**
   * Creates a new event with location data.
   * Converts lat/lng to GeoJSON Point format for MongoDB 2dsphere indexing.
   * 
   * @param payload - Event creation data including location
   * @returns The created event document
   * @throws Error if endDateTime <= dateTime
   */
  async createEvent(payload: CreateEventInput) {
    // Validate date range
    if (payload.endDateTime && payload.endDateTime <= payload.dateTime) {
      throw new Error(ERROR_END_DATE_BEFORE_START);
    }

    // Convert location to GeoJSON Point format
    // MongoDB 2dsphere index requires [longitude, latitude] order
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

  /**
   * Retrieves a single event by its MongoDB ObjectId.
   * @param id - Event ID string
   * @returns Event document or null if not found
   */
  async getEventById(id: string) {
    return this.eventModel.findById(id).populate('createdBy', 'name email userType avatarUrl bio').exec();
  }

  /**
   * Executes an aggregation pipeline for flexible event queries.
   * @param pipeline - MongoDB aggregation pipeline stages
   * @returns Array of aggregation results
   */
  async listEvents(pipeline: PipelineStage[]) {
    return this.eventModel.aggregate(pipeline).exec();
  }

  /**
   * Updates an existing event with ownership verification.
   * Only the event creator can modify the event.
   * 
   * @param id - Event ID to update
   * @param userId - ID of the user making the request
   * @param updates - Partial event data to update
   * @returns Updated event document or null if not found
   * @throws Error("Forbidden") if user is not the creator
   */
  async updateEvent(id: string, userId: string, updates: UpdateEventInput) {
    const event = await this.eventModel.findById(id);
    if (!event) return null;

    // Ownership check - only creator can modify
    if (event.createdBy.toString() !== userId.toString()) {
      throw new Error(ERROR_FORBIDDEN);
    }

    // Validate date range if both are being updated
    if (updates.dateTime && updates.endDateTime && updates.endDateTime <= updates.dateTime) {
      throw new Error("End date must be after start date");
    }

    // Convert location to GeoJSON if provided
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

  /**
   * Deletes an event with ownership verification.
   * Only the event creator can delete the event.
   * 
   * @param id - Event ID to delete
   * @param userId - ID of the user making the request
   * @returns Deleted event document or null if not found
   * @throws Error("Forbidden") if user is not the creator
   */
  async deleteEvent(id: string, userId: string) {
    const event = await this.eventModel.findById(id);
    if (!event) return null;

    // Ownership check - only creator can delete
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
    radiusInMiles: number = DEFAULT_FEED_RADIUS_MILES
  ) {
    const radiusInMeters = radiusInMiles * MILES_TO_METERS;

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