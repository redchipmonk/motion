import { QueryFilter } from "mongoose";
import { Event, EventDocument, EventModel } from "../models/event";

export interface CreateEventInput {
  title: string;
  description: string;
  dateTime: Date;
  location: EventDocument["location"];
  visibility: EventDocument["visibility"];
  images?: string[];
  price?: number;
  tags?: string[];
  createdBy: EventDocument["createdBy"];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  dateTime?: Date;
  location?: EventDocument["location"];
  visibility?: EventDocument["visibility"];
  images?: string[];
  price?: number;
  tags?: string[];
}

export class EventService {
  constructor(private readonly eventModel: EventModel = Event) {}

  async createEvent(payload: CreateEventInput) {
    const event = new this.eventModel({
      ...payload,
      images: payload.images ?? [],
      tags: payload.tags ?? [],
    });
    return event.save();
  }

  async getEventById(id: string) {
    return this.eventModel.findById(id).exec();
  }

  async listEvents(filter: QueryFilter<EventDocument> = {}) {
    return this.eventModel.find(filter).sort({ dateTime: 1 }).exec();
  }

  async updateEvent(id: string, updates: UpdateEventInput) {
    return this.eventModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
  }

  async deleteEvent(id: string) {
    return this.eventModel.findByIdAndDelete(id).exec();
  }

  async listEventsByCreator(userId: string) {
    return this.eventModel.find({ createdBy: userId }).sort({ dateTime: -1 }).exec();
  }
}

export const eventService = new EventService();
