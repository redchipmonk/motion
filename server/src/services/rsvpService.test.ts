import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RsvpService } from "./rsvpService";
import { Event } from "../models/event";
import type { RsvpModel } from "../models/rsvp";

// Mock Event model
vi.mock("../models/event", () => ({
  Event: {
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

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
      (Event.findOneAndUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: eventId } as unknown as null);

      const payload = {
        event: eventId,
        user: userId,
        status: "going" as const,
        plusOnes: 2,
      };

      const result = await service.createRsvp(payload);

      expect(result.status).toBe("going");
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
      expect(vi.mocked(Event).findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: eventId }),
        { $inc: { participantCount: 3 } } // 1 user + 2 plusOnes
      );
    });

    it("should move to waitlist if capacity is exceeded", async () => {
      // Mock Event.findOneAndUpdate to return null (capacity reached)
      (Event.findOneAndUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

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
      (Event.findOneAndUpdate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ _id: eventId } as unknown as null);

      // Change plusOnes from 1 to 3 (+2 net increase)
      await service.updateRsvp(rsvpId, { plusOnes: 3 });

      expect(vi.mocked(Event).findOneAndUpdate).toHaveBeenCalledWith(
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

      await service.updateRsvp(rsvpId, { status: "interested" });

      expect(vi.mocked(Event).findByIdAndUpdate).toHaveBeenCalledWith(eventId, {
        $inc: { participantCount: -1 },
      });
      expect(rsvpMocks.saveSpy).toHaveBeenCalled();
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

      await service.deleteRsvp(rsvpId);

      expect(vi.mocked(Event).findByIdAndUpdate).toHaveBeenCalledWith(eventId, {
        $inc: { participantCount: -2 },
      });
      expect(rsvpMocks.deleteOneSpy).toHaveBeenCalled();
    });
  });
});