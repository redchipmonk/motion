import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { EventDocument } from "../models/event";
import eventsRouter from "./events";
import { eventService } from "../services/eventService";

vi.mock("../services/eventService", () => {
  const createMock = () => vi.fn();
  return {
    eventService: {
      createEvent: createMock(),
      listEvents: createMock(),
      getEventById: createMock(),
      updateEvent: createMock(),
      deleteEvent: createMock(),
    },
  };
});

const app = express();
app.use(express.json());
app.use("/events", eventsRouter);

type EventServiceMock = {
  createEvent: ReturnType<typeof vi.fn>;
  listEvents: ReturnType<typeof vi.fn>;
  getEventById: ReturnType<typeof vi.fn>;
  updateEvent: ReturnType<typeof vi.fn>;
  deleteEvent: ReturnType<typeof vi.fn>;
};

const mockedEventService = eventService as unknown as EventServiceMock;

const buildEvent = (overrides: Partial<EventDocument> = {}): EventDocument =>
  ({
    _id: new Types.ObjectId(),
    title: "Event",
    description: "Desc",
    dateTime: new Date(),
    location: { address: "UW", latitude: 0, longitude: 0 },
    visibility: "public",
    images: [],
    tags: [],
    createdBy: new Types.ObjectId(),
    ...overrides,
  } as EventDocument);

describe("events router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an event", async () => {
    mockedEventService.createEvent.mockResolvedValueOnce(buildEvent());

    const payload = {
      title: "Test",
      description: "Desc",
      dateTime: new Date().toISOString(),
      location: { address: "UW", latitude: 1, longitude: 2 },
      visibility: "public",
      createdBy: "user",
    };

    const response = await request(app).post("/events").send(payload);
    expect(response.status).toBe(201);
    expect(mockedEventService.createEvent).toHaveBeenCalled();
  });

  it("rejects invalid create payload", async () => {
    const response = await request(app).post("/events").send({ title: "Only title" });
    expect(response.status).toBe(400);
    expect(mockedEventService.createEvent).not.toHaveBeenCalled();
  });

  it("lists events with filters", async () => {
    mockedEventService.listEvents.mockResolvedValueOnce([buildEvent()]);
    const response = await request(app)
      .get("/events")
      .query({ visibility: "public", createdBy: "user" });
    expect(response.status).toBe(200);
    expect(mockedEventService.listEvents).toHaveBeenCalledWith([
      {
        $match: {
          visibility: "public",
          createdBy: "user",
        },
      },
    ]);
  });

  it("lists events with a valid createdBy filter", async () => {
    mockedEventService.listEvents.mockResolvedValueOnce([buildEvent()]);
    const userId = new Types.ObjectId();
    const response = await request(app)
      .get("/events")
      .query({ createdBy: userId.toHexString() });
    expect(response.status).toBe(200);
    expect(mockedEventService.listEvents).toHaveBeenCalledWith([
      {
        $match: {
          createdBy: userId,
        },
      },
    ]);
  });

  it("fetches an event by id", async () => {
    mockedEventService.getEventById.mockResolvedValueOnce(buildEvent());
    const response = await request(app).get("/events/1");
    expect(response.status).toBe(200);
  });

  it("returns 404 when event is missing", async () => {
    mockedEventService.getEventById.mockResolvedValueOnce(null);
    const response = await request(app).get("/events/unknown");
    expect(response.status).toBe(404);
  });

  it("updates an event", async () => {
    mockedEventService.updateEvent.mockResolvedValueOnce(buildEvent({ title: "Updated" }));
    const response = await request(app).patch("/events/1").send({ title: "Updated" });
    expect(response.status).toBe(200);
    expect(mockedEventService.updateEvent).toHaveBeenCalledWith("1", { title: "Updated" });
  });

  it("rejects invalid updates", async () => {
    const response = await request(app).patch("/events/1").send({ dateTime: "invalid" });
    expect(response.status).toBe(400);
    expect(mockedEventService.updateEvent).not.toHaveBeenCalled();
  });

  it("deletes an event", async () => {
    mockedEventService.deleteEvent.mockResolvedValueOnce(buildEvent());
    const response = await request(app).delete("/events/1");
    expect(response.status).toBe(204);
    expect(mockedEventService.deleteEvent).toHaveBeenCalledWith("1");
  });

  it("returns 404 when deleting missing event", async () => {
    mockedEventService.deleteEvent.mockResolvedValueOnce(null);
    const response = await request(app).delete("/events/unknown");
    expect(response.status).toBe(404);
  });
});
