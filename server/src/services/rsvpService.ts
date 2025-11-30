import { QueryFilter } from "mongoose";
import { Rsvp, RsvpDocument, RsvpModel } from "../models/rsvp";

export interface CreateRsvpInput {
  event: RsvpDocument["event"];
  user: RsvpDocument["user"];
  status?: RsvpDocument["status"];
  notes?: string;
}

export interface UpdateRsvpInput {
  status?: RsvpDocument["status"];
  notes?: string;
}

export class RsvpService {
  constructor(private readonly rsvpModel: RsvpModel = Rsvp) {}

  async createRsvp(payload: CreateRsvpInput) {
    const rsvp = new this.rsvpModel(payload);
    return rsvp.save();
  }

  async getRsvpById(id: string) {
    return this.rsvpModel.findById(id).exec();
  }

  async listRsvps(filter: QueryFilter<RsvpDocument> = {}) {
    return this.rsvpModel.find(filter).exec();
  }

  async listRsvpsByEvent(eventId: string) {
    return this.rsvpModel.find({ event: eventId }).exec();
  }

  async listRsvpsByUser(userId: string) {
    return this.rsvpModel.find({ user: userId }).exec();
  }

  async updateRsvp(id: string, updates: UpdateRsvpInput) {
    return this.rsvpModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
  }

  async deleteRsvp(id: string) {
    return this.rsvpModel.findByIdAndDelete(id).exec();
  }
}

export const rsvpService = new RsvpService();
