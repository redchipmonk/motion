import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { RsvpDocument } from "../models/rsvp";
import rsvpsRouter from "./rsvps";
import { rsvpService, CreateRsvpInput } from "../services/rsvpService";

vi.mock("../middleware/auth", () => ({
  protectedRoute: (req: { user?: { _id: Types.ObjectId } }, _res: unknown, next: () => void) => {
    req.user = { _id: new Types.ObjectId("507f1f77bcf86cd799439011") };
    next();
  },
}));

vi.mock("../services/rsvpService", () => {
  const mockFn = () => vi.fn();
  return {
    rsvpService: {
      createRsvp: mockFn(),
      listRsvps: mockFn(),
      getRsvpById: mockFn(),
      updateRsvp: mockFn(),
      deleteRsvp: mockFn(),
    },
  };
});

type RsvpServiceMock = {
  createRsvp: ReturnType<typeof vi.fn>;
  listRsvps: ReturnType<typeof vi.fn>;
  getRsvpById: ReturnType<typeof vi.fn>;
  updateRsvp: ReturnType<typeof vi.fn>;
  deleteRsvp: ReturnType<typeof vi.fn>;
};

const mockedService = rsvpService as unknown as RsvpServiceMock;

const app = express();
app.use(express.json());
app.use("/rsvps", rsvpsRouter);

const buildRsvp = (overrides: Partial<RsvpDocument> = {}): RsvpDocument =>
({
  _id: new Types.ObjectId(),
  event: new Types.ObjectId(),
  user: new Types.ObjectId(),
  status: "going",
  notes: undefined,
  ...overrides,
} as RsvpDocument);

describe("rsvps router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an rsvp", async () => {
    mockedService.createRsvp.mockResolvedValueOnce(buildRsvp());
    const payload = {
      event: new Types.ObjectId().toString(),
      user: new Types.ObjectId().toString(),
      status: "interested",
    };
    const response = await request(app).post("/rsvps").send(payload);
    expect(response.status).toBe(201);
    expect(mockedService.createRsvp).toHaveBeenCalledWith({
      event: expect.any(Types.ObjectId) as CreateRsvpInput["event"],
      user: new Types.ObjectId("507f1f77bcf86cd799439011"),
      status: payload.status,
      notes: undefined,
    });
  });

  it("rejects invalid create body", async () => {
    const response = await request(app).post("/rsvps").send({ event: "1" });
    expect(response.status).toBe(400);
    expect(mockedService.createRsvp).not.toHaveBeenCalled();
  });

  it("lists rsvps with filters", async () => {
    const eventId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    mockedService.listRsvps.mockResolvedValueOnce([buildRsvp()]);
    const response = await request(app)
      .get("/rsvps")
      .query({ event: eventId, user: userId, status: "going" });
    expect(response.status).toBe(200);
    expect(mockedService.listRsvps).toHaveBeenCalledWith({
      event: eventId,
      user: userId,
      status: "going",
    });
  });

  it("fetches an rsvp by id", async () => {
    mockedService.getRsvpById.mockResolvedValueOnce(buildRsvp());
    const response = await request(app).get("/rsvps/123");
    expect(response.status).toBe(200);
  });

  it("returns 404 when rsvp not found", async () => {
    mockedService.getRsvpById.mockResolvedValueOnce(null);
    const response = await request(app).get("/rsvps/missing");
    expect(response.status).toBe(404);
  });

  it("updates an rsvp", async () => {
    mockedService.updateRsvp.mockResolvedValueOnce(buildRsvp({ status: "waitlist" }));
    const response = await request(app).patch("/rsvps/123").send({ status: "waitlist" });
    expect(response.status).toBe(200);
    expect(mockedService.updateRsvp).toHaveBeenCalledWith("123", "507f1f77bcf86cd799439011", { status: "waitlist" });
  });

  it("rejects invalid updates", async () => {
    const response = await request(app).patch("/rsvps/123").send({ status: "invalid" });
    expect(response.status).toBe(400);
    expect(mockedService.updateRsvp).not.toHaveBeenCalled();
  });

  it("returns 404 when updating missing rsvp", async () => {
    mockedService.updateRsvp.mockResolvedValueOnce(null);
    const response = await request(app).patch("/rsvps/missing").send({ status: "going" });
    expect(response.status).toBe(404);
  });

  it("deletes an rsvp", async () => {
    mockedService.deleteRsvp.mockResolvedValueOnce(buildRsvp());
    const response = await request(app).delete("/rsvps/123");
    expect(response.status).toBe(204);
    expect(mockedService.deleteRsvp).toHaveBeenCalledWith("123", "507f1f77bcf86cd799439011");
  });

  it("returns 404 when deleting missing rsvp", async () => {
    mockedService.deleteRsvp.mockResolvedValueOnce(null);
    const response = await request(app).delete("/rsvps/unknown");
    expect(response.status).toBe(404);
  });
});
