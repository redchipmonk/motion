import mongoose from "mongoose";
import { rsvpService } from "./rsvpService";
import { Event } from "../models/event";
import { Rsvp } from "../models/rsvp";

describe("RsvpService", () => {
  let userId: mongoose.Types.ObjectId;
  let eventId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL || "mongodb://localhost:27017/motion-test";
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Event.deleteMany({});
    await Rsvp.deleteMany({});

    userId = new mongoose.Types.ObjectId();
    const event = await Event.create({
      title: "Service Test Event",
      description: "Testing RsvpService logic",
      dateTime: new Date(),
      location: { address: "123 Service St", coordinates: [0, 0] },
      visibility: "public",
      createdBy: userId,
      status: "published",
    });
    eventId = event._id;
  });

  describe("createRsvp", () => {
    it("should increment participantCount and set status to 'going'", async () => {
      const rsvp = await rsvpService.createRsvp({
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 2,
      });

      expect(rsvp.status).toBe("going");
      const updatedEvent = await Event.findById(eventId);
      expect(updatedEvent?.participantCount).toBe(3); // 1 user + 2 plusOnes
    });

    it("should move to waitlist if capacity is exceeded", async () => {
      await Event.findByIdAndUpdate(eventId, { capacity: 2 });

      const rsvp = await rsvpService.createRsvp({
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 5, // Total 6, capacity 2
      });

      expect(rsvp.status).toBe("waitlist");
      expect(rsvp.plusOnes).toBe(0);
      const updatedEvent = await Event.findById(eventId);
      expect(updatedEvent?.participantCount).toBe(0);
    });
  });

  describe("updateRsvp", () => {
    it("should handle participantCount diffs when updating plusOnes", async () => {
      const rsvp = await rsvpService.createRsvp({
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 1,
      });

      // Change plusOnes from 1 to 3 (+2 net increase)
      await rsvpService.updateRsvp(rsvp._id.toString(), { plusOnes: 3 });

      const updatedEvent = await Event.findById(eventId);
      expect(updatedEvent?.participantCount).toBe(4); // 1 user + 3 plusOnes
    });

    it("should decrement count when changing status from 'going' to 'interested'", async () => {
      const rsvp = await rsvpService.createRsvp({ event: eventId, user: userId, status: "going" });
      await rsvpService.updateRsvp(rsvp._id.toString(), { status: "interested" });

      const updatedEvent = await Event.findById(eventId);
      expect(updatedEvent?.participantCount).toBe(0);
    });
  });

  describe("deleteRsvp", () => {
    it("should decrement participantCount when a 'going' RSVP is deleted", async () => {
      const rsvp = await rsvpService.createRsvp({
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 1,
      });
      await rsvpService.deleteRsvp(rsvp._id.toString());

      const updatedEvent = await Event.findById(eventId);
      expect(updatedEvent?.participantCount).toBe(0);
    });
  });
});