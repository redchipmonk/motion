import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { RsvpService } from "./rsvpService";
import { Event } from "../models/event";
import type { RsvpModel } from "../models/rsvp";

// Mock Event model
vi.mock("../models/event", () => ({
  Event: {
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

const mockedEvent = {
  findOneAndUpdate: (Event as unknown as { findOneAndUpdate: Mock }).findOneAndUpdate,
  findByIdAndUpdate: (Event as unknown as { findByIdAndUpdate: Mock }).findByIdAndUpdate,
  findById: (Event as unknown as { findById: Mock }).findById,
};

const createRsvpModelMock = () => {
  const saveSpy = vi.fn((doc) => Promise.resolve(doc));
  const deleteOneSpy = vi.fn().mockResolvedValue(true);

  // Helper to create a mock document with methods
  const createMockDoc = (data: Record<string, unknown>) => ({
    ...data,
    save: function () {
      return saveSpy(this);
    },
    deleteOne: function () {
      return deleteOneSpy(this) as Promise<boolean>;
    },
  });

  const findByIdSpy = vi.fn();
  const findSpy = vi.fn();

  const Constructor = function (this: Record<string, unknown>, doc: Record<string, unknown>) {
    Object.assign(this, createMockDoc(doc));
  };

  const model = Constructor as unknown as {
    findById: (id: string) => { then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => Promise<void>; exec: () => Promise<unknown> };
    find: (filter: Record<string, unknown>) => { exec: () => Promise<unknown> };
  };

  // Mock findById to return a thenable + exec object
  model.findById = (id: string) => {
    const result = findByIdSpy(id) as unknown;
    const promise = Promise.resolve(result);
    return {
      then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => promise.then(resolve, reject),
      exec: () => promise,
    };
  };

  model.find = (filter: Record<string, unknown>) => ({
    exec: () => Promise.resolve(findSpy(filter)),
  });

  return { model, saveSpy, findByIdSpy, findSpy, deleteOneSpy, createMockDoc };
};

describe("RsvpService", () => {
  let service: RsvpService;
  let rsvpMocks: ReturnType<typeof createRsvpModelMock>;
  const userId = new mongoose.Types.ObjectId();
  const eventId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    rsvpMocks = createRsvpModelMock();
    service = new RsvpService(rsvpMocks.model as unknown as RsvpModel);
  });

  describe("createRsvp", () => {
    it("should increment participantCount and set status to 'going'", async () => {
      // Mock Event.findOneAndUpdate to return a document (success)
      mockedEvent.findById.mockResolvedValue({
        createdBy: new mongoose.Types.ObjectId(), // Different user
      });
      mockedEvent.findOneAndUpdate.mockResolvedValue({ _id: eventId });

      const payload = {
        event: eventId,
        user: userId,
        status: "going" as const,
        plusOnes: 2,
      };

      const result = await service.createRsvp(payload);

      expect(result.status).toBe("going");
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
      expect(mockedEvent.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: eventId }),
        { $inc: { participantCount: 3 } } // 1 user + 2 plusOnes
      );
    });

    it("should move to waitlist if capacity is exceeded", async () => {
      // Mock Event.findOneAndUpdate to return null (capacity reached)
      mockedEvent.findById.mockResolvedValue({
        createdBy: new mongoose.Types.ObjectId(), // Different user
      });
      mockedEvent.findOneAndUpdate.mockResolvedValue(null);

      const payload = {
        event: eventId,
        user: userId,
        status: "going" as const,
        plusOnes: 5,
      };

      const result = await service.createRsvp(payload);

      expect(result.status).toBe("waitlist");
      expect(result.plusOnes).toBe(0);
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
    });

    it("should rollback participantCount if RSVP save fails", async () => {
      // Mock Event update success (increment happens first)
      mockedEvent.findById.mockResolvedValue({
        createdBy: new mongoose.Types.ObjectId(), // Different user
      });
      mockedEvent.findOneAndUpdate.mockResolvedValue({ _id: eventId });

      // Mock RSVP save failure
      const error = new Error("Database error");
      rsvpMocks.saveSpy.mockRejectedValue(error);

      const payload = {
        event: eventId,
        user: userId,
        status: "going" as const,
        plusOnes: 0,
      };

      await expect(service.createRsvp(payload)).rejects.toThrow("Database error");

      // Verify rollback happened (decrement)
      expect(mockedEvent.findByIdAndUpdate).toHaveBeenCalledWith(
        eventId,
        { $inc: { participantCount: -1 } }
      );
    });

    it("should prevent host from RSVPing to their own event", async () => {
      mockedEvent.findById.mockResolvedValue({
        createdBy: userId, // Same as user
      });

      const payload = {
        event: eventId,
        user: userId,
        status: "going" as const,
        plusOnes: 0,
      };

      await expect(service.createRsvp(payload)).rejects.toThrow("Hosts cannot RSVP to their own events");
    });
  });

  describe("updateRsvp", () => {
    it("should handle participantCount diffs when updating plusOnes", async () => {
      const rsvpId = "rsvp-123";
      const existingRsvp = rsvpMocks.createMockDoc({
        _id: rsvpId,
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 1,
      });
      rsvpMocks.findByIdSpy.mockReturnValue(existingRsvp);
      mockedEvent.findOneAndUpdate.mockResolvedValue({ _id: eventId });

      // Change plusOnes from 1 to 3 (+2 net increase)
      await service.updateRsvp(rsvpId, userId.toString(), { plusOnes: 3 });

      expect(mockedEvent.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: eventId }),
        { $inc: { participantCount: 2 } }
      );
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
    });

    it("should decrement count when changing status from 'going' to 'interested'", async () => {
      const rsvpId = "rsvp-123";
      const existingRsvp = rsvpMocks.createMockDoc({
        _id: rsvpId,
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 0,
      });
      rsvpMocks.findByIdSpy.mockReturnValue(existingRsvp);

      await service.updateRsvp(rsvpId, userId.toString(), { status: "interested" });

      expect(mockedEvent.findByIdAndUpdate).toHaveBeenCalledWith(eventId, {
        $inc: { participantCount: -1 },
      });
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
    });

    it("should throw Forbidden when updating another user's RSVP", async () => {
      const rsvpId = "rsvp-forbidden";
      const existingRsvp = rsvpMocks.createMockDoc({
        _id: rsvpId,
        event: eventId,
        user: new mongoose.Types.ObjectId(), // Different user
        status: "going",
      });
      rsvpMocks.findByIdSpy.mockReturnValue(existingRsvp);

      await expect(service.updateRsvp(rsvpId, userId.toString(), { status: "interested" })).rejects.toThrow("Forbidden");
    });
  });

  describe("deleteRsvp", () => {
    it("should decrement participantCount when a 'going' RSVP is deleted", async () => {
      const rsvpId = "rsvp-123";
      const existingRsvp = rsvpMocks.createMockDoc({
        _id: rsvpId,
        event: eventId,
        user: userId,
        status: "going",
        plusOnes: 1,
      });
      rsvpMocks.findByIdSpy.mockReturnValue(existingRsvp);

      await service.deleteRsvp(rsvpId, userId.toString());

      expect(mockedEvent.findByIdAndUpdate).toHaveBeenCalledWith(eventId, {
        $inc: { participantCount: -2 },
      });
      expect(rsvpMocks.deleteOneSpy).toHaveBeenCalled();
    });

    it("should throw Forbidden when deleting another user's RSVP", async () => {
      const rsvpId = "rsvp-forbidden-del";
      const existingRsvp = rsvpMocks.createMockDoc({
        _id: rsvpId,
        event: eventId,
        user: new mongoose.Types.ObjectId(), // Different user
        status: "going",
      });
      rsvpMocks.findByIdSpy.mockReturnValue(existingRsvp);

      await expect(service.deleteRsvp(rsvpId, userId.toString())).rejects.toThrow("Forbidden");
    });
  });
});