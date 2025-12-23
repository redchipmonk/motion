import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { EventModel } from "../models/event";
import { User } from "../models/user";
import { EventService, CreateEventInput, UpdateEventInput } from "./eventService";

// Mock User model
vi.mock("../models/user", () => ({
  User: {
    findById: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ following: [] }),
    })),
  },
}));

type EventModelLike = {
  new (doc: Record<string, unknown>): { save: () => Promise<Record<string, unknown>> };
  findById(id: string): { exec: () => Promise<Record<string, unknown> | null> };
  find(filter?: Record<string, unknown>): {
    sort: (order: Record<string, number>) => {
      limit: (n: number) => {
        populate: (path: string, fields: string) => { exec: () => Promise<Record<string, unknown>[]> };
      };
    };
  };
  findByIdAndUpdate(
    id: string,
    updates: Record<string, unknown>,
    options: Record<string, unknown>
  ): { exec: () => Promise<Record<string, unknown> | null> };
  findByIdAndDelete(id: string): { exec: () => Promise<Record<string, unknown> | null> };
};

type EventModelMock = {
  model: EventModelLike;
  saveSpy: ReturnType<typeof vi.fn>;
  findByIdSpy: ReturnType<typeof vi.fn>;
  findSpy: ReturnType<typeof vi.fn>;
  updateSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
};

const createEventModelMock = (): EventModelMock => {
  const saveSpy = vi.fn<(doc: Record<string, unknown>) => Promise<Record<string, unknown>>>(
    (doc) => Promise.resolve(doc)
  );
  const findByIdSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
  const findSpy = vi.fn<(filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>>();
  const updateSpy = vi.fn<
    (id: string, updates: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  >();
  const deleteSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();

  const Constructor = function (this: unknown, doc: Record<string, unknown>) {
    const docWithDefaults = { images: [], tags: [], ...doc };
    return {
      ...docWithDefaults,
      save: () => saveSpy({ ...docWithDefaults, _id: "new-event" }),
    };
  };

  const model = Constructor as unknown as EventModelLike;
  model.findById = (id: string) => ({ exec: () => findByIdSpy(id) });
  model.find = (filter?: Record<string, unknown>) => {
    const query = {
      sort: () => query,
      limit: () => query,
      populate: () => query,
      exec: () => findSpy(filter),
      then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) =>
        findSpy(filter).then(resolve, reject),
    };
    return query as unknown as ReturnType<EventModelLike["find"]>;
  };
  model.findByIdAndUpdate = (
    id: string,
    updates: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => {
    void options;
    return {
      exec: () => updateSpy(id, updates),
    };
  };
  model.findByIdAndDelete = (id: string) => ({
    exec: () => deleteSpy(id),
  });

  return { model, saveSpy, findByIdSpy, findSpy, updateSpy, deleteSpy };
};

describe("EventService", () => {
  let service: EventService;
  let mocks: EventModelMock;

  beforeEach(() => {
    mocks = createEventModelMock();
    service = new EventService(mocks.model as unknown as EventModel);
  });

  it("creates an event with defaults", async () => {
    const payload: CreateEventInput = {
      title: "Event",
      description: "Desc",
      dateTime: new Date(),
      location: { address: "UW", latitude: 47.65, longitude: -122.3 },
      visibility: "public",
      createdBy: new Types.ObjectId(),
    };

    const result = await service.createEvent(payload);

    expect(result._id).toBe("new-event");
    expect(mocks.saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ images: [], tags: [] })
    );
  });

  it("throws error if endDateTime is before dateTime", async () => {
    const payload: CreateEventInput = {
      title: "Invalid Event",
      description: "Desc",
      dateTime: new Date("2025-01-02"),
      endDateTime: new Date("2025-01-01"),
      location: { address: "UW", latitude: 47.65, longitude: -122.3 },
      visibility: "public",
      createdBy: new Types.ObjectId(),
    };

    await expect(service.createEvent(payload)).rejects.toThrow("End date must be after start date");
  });

  it("gets event by id", async () => {
    mocks.findByIdSpy.mockResolvedValueOnce({ _id: "123" });
    const event = await service.getEventById("123");
    expect(event?._id).toBe("123");
  });

  it("lists events", async () => {
    mocks.findSpy.mockResolvedValueOnce([{ _id: "1" }]);
    const events = await service.listEvents();
    expect(events).toHaveLength(1);
  });

  it("updates event", async () => {
    const updates: UpdateEventInput = { title: "Updated" };
    mocks.updateSpy.mockResolvedValueOnce({ _id: "1", title: "Updated" });
    const event = await service.updateEvent("1", updates);
    expect(event?.title).toBe("Updated");
    expect(mocks.updateSpy).toHaveBeenCalledWith("1", updates);
  });

  it("updates event location with GeoJSON coordinates", async () => {
    const updates: UpdateEventInput = {
      location: {
        address: "New Place",
        latitude: 40.7128,
        longitude: -74.006,
      },
    };

    mocks.updateSpy.mockResolvedValueOnce({ _id: "1" });
    await service.updateEvent("1", updates);

    expect(mocks.updateSpy).toHaveBeenCalledWith("1", {
      location: {
        address: "New Place",
        type: "Point",
        coordinates: [-74.006, 40.7128],
      },
    });
  });

  it("deletes event", async () => {
    mocks.deleteSpy.mockResolvedValueOnce({ acknowledged: true });
    const deleted = await service.deleteEvent("1");
    expect(deleted).toEqual({ acknowledged: true });
    expect(mocks.deleteSpy).toHaveBeenCalledWith("1");
  });

  it("filters discovery feed by radius", async () => {
    const userId = "user-123";
    const longitude = -122.3;
    const latitude = 47.65;
    const radiusInMiles = 10;
    const radiusInRadians = radiusInMiles / 3963.2;

    mocks.findSpy.mockResolvedValueOnce([]);

    await service.getDiscoveryFeed(userId, longitude, latitude, radiusInMiles);

    expect(mocks.findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInRadians],
          },
        },
      })
    );
  });

  it("applies visibility and lifecycle filters to discovery feed", async () => {
    const userId = "user-123";
    const followingId = "friend-456";

    // Override User mock to return a specific following list
    (User.findById as unknown as Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue({ following: [followingId] }),
    });

    mocks.findSpy.mockResolvedValueOnce([]);

    await service.getDiscoveryFeed(userId, 0, 0, 10);

    expect(mocks.findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "published",
        dateTime: { $gte: expect.any(Date) as unknown },
        $or: [
          { visibility: "public" },
          {
            visibility: "friends",
            createdBy: { $in: [followingId] },
          },
          { createdBy: userId },
        ],
      })
    );
  });
});
