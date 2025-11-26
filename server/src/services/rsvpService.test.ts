import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RsvpModel } from "../models/rsvp";
import { RsvpService, CreateRsvpInput, UpdateRsvpInput } from "./rsvpService";

type RsvpModelLike = {
  new (doc: Record<string, unknown>): { save: () => Promise<Record<string, unknown>> };
  findById(id: string): { exec: () => Promise<Record<string, unknown> | null> };
  find(filter?: Record<string, unknown>): { exec: () => Promise<Record<string, unknown>[]> };
  findByIdAndUpdate(
    id: string,
    updates: Record<string, unknown>,
    options: Record<string, unknown>
  ): { exec: () => Promise<Record<string, unknown> | null> };
  findByIdAndDelete(id: string): { exec: () => Promise<Record<string, unknown> | null> };
};

const createRsvpModelMock = () => {
  const saveSpy = vi.fn((doc: Record<string, unknown>) => Promise.resolve(doc));
  const findByIdSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
  const findSpy = vi.fn<(filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>>();
  const updateSpy = vi.fn<
    (id: string, updates: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  >();
  const deleteSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();

  const Constructor = function (this: unknown, doc: Record<string, unknown>) {
    return {
      ...doc,
      save: () => saveSpy({ ...doc, _id: "rsvp-id" }),
    };
  };

  const model = Constructor as unknown as RsvpModelLike;
  model.findById = (id: string) => ({ exec: () => findByIdSpy(id) });
  model.find = (filter?: Record<string, unknown>) => ({
    exec: () => findSpy(filter),
  });
  model.findByIdAndUpdate = (
    id: string,
    updates: Record<string, unknown>,
    options: Record<string, unknown>
  ) => {
    void options;
    return { exec: () => updateSpy(id, updates) };
  };
  model.findByIdAndDelete = (id: string) => ({
    exec: () => deleteSpy(id),
  });

  return { model, saveSpy, findByIdSpy, findSpy, updateSpy, deleteSpy };
};

describe("RsvpService", () => {
  let service: RsvpService;
  let mocks: ReturnType<typeof createRsvpModelMock>;

  beforeEach(() => {
    mocks = createRsvpModelMock();
    service = new RsvpService(mocks.model as unknown as RsvpModel);
  });

  it("creates an RSVP", async () => {
    const payload: CreateRsvpInput = {
      event: new Types.ObjectId(),
      user: new Types.ObjectId(),
      status: "interested",
    };
    const rsvp = await service.createRsvp(payload);
    expect(rsvp._id).toBe("rsvp-id");
    expect(mocks.saveSpy).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  it("gets an RSVP by id", async () => {
    mocks.findByIdSpy.mockResolvedValueOnce({ _id: "123" });
    const rsvp = await service.getRsvpById("123");
    expect(rsvp?._id).toBe("123");
  });

  it("lists RSVPs", async () => {
    mocks.findSpy.mockResolvedValueOnce([{ _id: "1" }]);
    const list = await service.listRsvps();
    expect(list).toHaveLength(1);
  });

  it("lists RSVPs by event", async () => {
    mocks.findSpy.mockResolvedValueOnce([{ _id: "1" }]);
    const list = await service.listRsvpsByEvent("event");
    expect(list).toHaveLength(1);
    expect(mocks.findSpy).toHaveBeenCalledWith({ event: "event" });
  });

  it("lists RSVPs by user", async () => {
    mocks.findSpy.mockResolvedValueOnce([{ _id: "1" }]);
    const list = await service.listRsvpsByUser("user");
    expect(list).toHaveLength(1);
    expect(mocks.findSpy).toHaveBeenCalledWith({ user: "user" });
  });

  it("updates an RSVP", async () => {
    const updates: UpdateRsvpInput = { status: "going" };
    mocks.updateSpy.mockResolvedValueOnce({ _id: "1", status: "going" });
    const rsvp = await service.updateRsvp("1", updates);
    expect(rsvp?.status).toBe("going");
  });

  it("deletes an RSVP", async () => {
    mocks.deleteSpy.mockResolvedValueOnce({ acknowledged: true });
    const deleted = await service.deleteRsvp("1");
    expect(deleted).toEqual({ acknowledged: true });
  });
});
