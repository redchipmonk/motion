import { QueryFilter } from "mongoose";
import { Rsvp, RsvpDocument, RsvpModel } from "../models/rsvp";
import { Event } from "../models/event";

export interface CreateRsvpInput {
  event: RsvpDocument["event"];
  user: RsvpDocument["user"];
  status?: RsvpDocument["status"];
  notes?: string;
  plusOnes?: number;
}

export interface UpdateRsvpInput {
  status?: RsvpDocument["status"];
  notes?: string;
  plusOnes?: number;
}

export class RsvpService {
  constructor(private readonly rsvpModel: RsvpModel = Rsvp) { }

  async createRsvp(payload: CreateRsvpInput) {
    // Prevent hosts from RSVPing to their own events
    const eventDoc = await Event.findById(payload.event);
    if (!eventDoc) throw new Error("Event not found");
    if (eventDoc.createdBy.toString() === payload.user.toString()) {
      throw new Error("Hosts cannot RSVP to their own events");
    }

    const rsvp = new this.rsvpModel(payload);
    const newVal = rsvp.status === "going" ? 1 + (rsvp.plusOnes || 0) : 0;
    let incremented = 0;

    try {
      if (newVal > 0) {
        const updatedEvent = await Event.findOneAndUpdate(
          {
            _id: rsvp.event,
            $or: [
              { capacity: { $exists: false } },
              { capacity: null },
              { $expr: { $lte: [{ $add: ["$participantCount", newVal] }, "$capacity"] } },
            ],
          },
          { $inc: { participantCount: newVal } }
        );

        if (!updatedEvent) {
          rsvp.status = "waitlist";
          rsvp.plusOnes = 0;
        } else {
          incremented = newVal;
        }
      }
      return await rsvp.save();
    } catch (error) {
      // Rollback if save fails
      if (incremented > 0) {
        await Event.findByIdAndUpdate(rsvp.event, { $inc: { participantCount: -incremented } });
      }
      throw error;
    }
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

  async updateRsvp(id: string, userId: string, updates: UpdateRsvpInput) {
    const rsvp = await this.rsvpModel.findById(id);
    if (!rsvp) return null;

    if (rsvp.user.toString() !== userId.toString()) {
      throw new Error("Forbidden");
    }

    const oldVal = rsvp.status === "going" ? 1 + (rsvp.plusOnes || 0) : 0;

    // Apply updates
    if (updates.status) rsvp.status = updates.status;
    if (updates.notes !== undefined) rsvp.notes = updates.notes;
    if (updates.plusOnes !== undefined) rsvp.plusOnes = updates.plusOnes;

    const newVal = rsvp.status === "going" ? 1 + (rsvp.plusOnes || 0) : 0;
    const diff = newVal - oldVal;
    let incremented = 0;

    try {
      if (diff > 0) {
        const updatedEvent = await Event.findOneAndUpdate(
          {
            _id: rsvp.event,
            $or: [
              { capacity: { $exists: false } },
              { capacity: null },
              { $expr: { $lte: [{ $add: ["$participantCount", diff] }, "$capacity"] } },
            ],
          },
          { $inc: { participantCount: diff } }
        );

        if (!updatedEvent) {
          rsvp.status = "waitlist";
          rsvp.plusOnes = 0;
          // If they were already going, we must remove their old contribution
          if (oldVal > 0) {
            await Event.findByIdAndUpdate(rsvp.event, { $inc: { participantCount: -oldVal } });
          }
        } else {
          incremented = diff;
        }
      } else if (diff < 0) {
        await Event.findByIdAndUpdate(rsvp.event, { $inc: { participantCount: diff } });
      }

      return await rsvp.save();
    } catch (error) {
      if (incremented > 0) {
        await Event.findByIdAndUpdate(rsvp.event, { $inc: { participantCount: -incremented } });
      }
      throw error;
    }
  }

  async deleteRsvp(id: string, userId: string) {
    const rsvp = await this.rsvpModel.findById(id);
    if (!rsvp) return null;

    if (rsvp.user.toString() !== userId.toString()) {
      throw new Error("Forbidden");
    }

    if (rsvp.status === "going") {
      const amount = 1 + (rsvp.plusOnes || 0);
      await Event.findByIdAndUpdate(rsvp.event, {
        $inc: { participantCount: -amount },
      });
    }

    return rsvp.deleteOne();
  }
}

export const rsvpService = new RsvpService();
