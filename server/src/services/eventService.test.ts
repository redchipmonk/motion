import { Types, PipelineStage } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventModel, EventDocument } from "../models/event";
import { EventService, CreateEventInput } from "./eventService";

const setupMocks = () => {
  const saveSpy = vi.fn<(doc: Partial<EventDocument>) => Promise<EventDocument>>();
  const aggregateSpy = vi.fn<(pipeline: PipelineStage[]) => Promise<EventDocument[]>>();

  // Use a real class for the mock model to ensure it's a valid constructor
  class MockEventModel {
    doc: Partial<EventDocument>;
    constructor(doc: Partial<EventDocument>) {
      this.doc = doc;
    }
    save() {
      // The instance's save method calls the spy
      return saveSpy(this.doc);
    }
    static aggregate(pipeline: PipelineStage[]) {
      // The static aggregate method calls the other spy
      return { exec: () => aggregateSpy(pipeline) };
    }
    // Add other static mocks as needed, even if empty
    static findById = vi.fn();
    static findByIdAndUpdate = vi.fn();
    static findByIdAndDelete = vi.fn();
  }

  // Create the service instance with the mock model
  const service = new EventService(MockEventModel as unknown as EventModel);

  // Return everything needed for tests
  return {
    service,
    saveSpy,
    aggregateSpy,
  };
};

describe("EventService", () => {
  beforeEach(() => {
    // Reset all mocks and timers before each test
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("creates an event", async () => {
    const { service, saveSpy } = setupMocks();
    const payload: CreateEventInput = {
      title: "Event",
      description: "Desc",
      dateTime: new Date(),
      location: { address: "UW", latitude: 47.65, longitude: -122.3 },
      visibility: "public",
      createdBy: new Types.ObjectId(),
    };
    // Mock the resolved value of the save operation
    saveSpy.mockResolvedValue({ ...payload, _id: "new-id" } as unknown as EventDocument);

    await service.createEvent(payload);

    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ title: "Event" }));
  });

  it("lists events by calling aggregate", async () => {
    const { service, aggregateSpy } = setupMocks();
    const pipeline: PipelineStage[] = [{ $match: { title: "test" } }];
    aggregateSpy.mockResolvedValue([]);
    await service.listEvents(pipeline);
    expect(aggregateSpy).toHaveBeenCalledWith(pipeline);
  });

  describe("getDiscoveryFeed", () => {
    const userId = new Types.ObjectId().toHexString();
    const longitude = -122.3;
    const latitude = 47.65;
    const radiusInMiles = 15;

    it("should start the pipeline with a $geoNear stage", async () => {
      const { service, aggregateSpy } = setupMocks();
      aggregateSpy.mockResolvedValue([]);
      await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);

      // Explicitly cast the mock's arguments to fix lint errors
      const pipeline = aggregateSpy.mock.calls[0][0];
      const geoNearStage = pipeline[0] as PipelineStage.GeoNear;

      expect(geoNearStage.$geoNear).toBeDefined();
    });

    it("should include a $match stage for event status and date", async () => {
      const { service, aggregateSpy } = setupMocks();
      aggregateSpy.mockResolvedValue([]);
      await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);
      const pipeline = aggregateSpy.mock.calls[0][0];
      const matchStage = pipeline.find(
        (stage): stage is PipelineStage.Match => "$match" in stage && "status" in stage.$match
      );
      expect(matchStage).toBeDefined();
    });

    it("should include a $lookup stage to find user's friends", async () => {
      const { service, aggregateSpy } = setupMocks();
      aggregateSpy.mockResolvedValue([]);
      await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);
      const pipeline = aggregateSpy.mock.calls[0][0];
      const lookupStage = pipeline.find(
        (stage): stage is PipelineStage.Lookup => "$lookup" in stage && stage.$lookup.from === "friendships"
      );
      expect(lookupStage).toBeDefined();
    });

    it("should include a final $match stage for bouncer logic", async () => {
      const { service, aggregateSpy } = setupMocks();
      aggregateSpy.mockResolvedValue([]);
      await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);
      const pipeline = aggregateSpy.mock.calls[0][0];
      const bouncerStage = pipeline.find(
        (stage): stage is PipelineStage.Match => "$match" in stage && "$or" in stage.$match
      );
      expect(bouncerStage).toBeDefined();
    });

    it("should project and remove sensitive/temporary fields at the end", async () => {
      const { service, aggregateSpy } = setupMocks();
      aggregateSpy.mockResolvedValue([]);
      await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);
      const pipeline = aggregateSpy.mock.calls[0][0];
      const projectStage = pipeline[pipeline.length - 1] as PipelineStage.Project;

      expect(projectStage).toBeDefined();
      expect(projectStage.$project?.friendIds).toBe(0);
      expect(projectStage.$project?.userFriends).toBe(0);
      expect(projectStage.$project?.["creatorDetails.password"]).toBe(0);
    });
  });
});