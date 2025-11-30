import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventModel } from "../models/event";
import { EventService, CreateEventInput, UpdateEventInput } from "./eventService";

type EventModelLike = {
  new (doc: Record<string, unknown>): { save: () => Promise<Record<string, unknown>> };
  findById(id: string): { exec: () => Promise<Record<string, unknown> | null> };
  find(filter?: Record<string, unknown>): {
    sort: (order: Record<string, number>) => { exec: () => Promise<Record<string, unknown>[]> };
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
    return {
      ...doc,
      save: () => saveSpy({ ...doc, _id: "new-event" }),
    };
  };

  const model = Constructor as unknown as EventModelLike;
  model.findById = (id: string) => ({ exec: () => findByIdSpy(id) });
  model.find = (filter?: Record<string, unknown>) => ({
    sort: () => ({ exec: () => findSpy(filter) }),
  });
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

  it("deletes event", async () => {
    mocks.deleteSpy.mockResolvedValueOnce({ acknowledged: true });
    const deleted = await service.deleteEvent("1");
    expect(deleted).toEqual({ acknowledged: true });
    expect(mocks.deleteSpy).toHaveBeenCalledWith("1");
  });
});
