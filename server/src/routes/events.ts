import { Router } from "express";
import { PipelineStage, Types } from "mongoose";
import { protectedRoute, AuthRequest } from "../middleware/auth";
import { eventService, CreateEventInput, UpdateEventInput } from "../services/eventService";
import { asyncHandler } from "../middleware/asyncHandler";

const eventsRouter = Router();

// Helper validators
const isString = (val: unknown): val is string => typeof val === "string";
const isValidObjectId = (val: unknown): val is string => isString(val) && Types.ObjectId.isValid(val);

type CreateEventBody = Omit<CreateEventInput, "dateTime" | "endDateTime"> & {
  dateTime: string;
  endDateTime?: string;
};

type UpdateEventBody = Omit<UpdateEventInput, "dateTime" | "endDateTime"> & {
  dateTime?: string;
  endDateTime?: string;
};

/**
 * GET /events/feed
 * Returns the discovery feed based on location and user social graph.
 */
eventsRouter.get("/feed", asyncHandler(async (req, res) => {
  const { userId, lat, long, radius } = req.query;

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ error: "Valid userId is required" });
  }
  if (!isString(lat) || !isString(long)) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }

  const feed = await eventService.getDiscoveryFeed(
    userId,
    parseFloat(long),
    parseFloat(lat),
    radius ? parseFloat(radius as string) : 10
  );

  return res.json(feed);
}));

/**
 * POST /events
 * Creates a new event.
 */
eventsRouter.post("/", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  const body = req.body as CreateEventBody;
  if (!body.title || !body.description || !body.dateTime || !body.location || !body.createdBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (isNaN(Date.parse(body.dateTime))) {
    return res.status(400).json({ error: "Invalid dateTime format" });
  }

  // Basic payload construction (In production, use Zod/Joi for validation)
  const input: CreateEventInput = {
    title: body.title,
    description: body.description,
    dateTime: new Date(body.dateTime),
    endDateTime: body.endDateTime ? new Date(body.endDateTime) : undefined,
    location: body.location, // Expecting { address, latitude, longitude }
    createdBy: req.user!._id, // Enforce creator verification
    capacity: body.capacity,
    images: body.images,
  };

  const event = await eventService.createEvent(input);
  return res.status(201).json(event);
}));

/**
 * GET /events
 * Lists events with optional filters.
 */
eventsRouter.get("/", asyncHandler(async (req, res) => {
  const query = req.query;
  const pipeline: PipelineStage[] = [];

  // Basic implementation to convert query params to a $match stage.
  const match: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      if (key === "createdBy" && isValidObjectId(value)) {
        match[key] = new Types.ObjectId(value);
      } else {
        match[key] = value;
      }
    }
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const events = await eventService.listEvents(pipeline);
  return res.json(events);
}));

/**
 * GET /events/:id
 */
eventsRouter.get("/:id", asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  return res.json(event);
}));

/**
 * PATCH /events/:id
 */
eventsRouter.patch("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const body = req.body as UpdateEventBody;
    const { dateTime, endDateTime, ...rest } = body;

    if (dateTime && isNaN(Date.parse(dateTime))) {
      return res.status(400).json({ error: "Invalid dateTime format" });
    }
    if (endDateTime && isNaN(Date.parse(endDateTime))) {
      return res.status(400).json({ error: "Invalid endDateTime format" });
    }

    const updates: UpdateEventInput = { ...rest };
    if (dateTime) updates.dateTime = new Date(dateTime);
    if (endDateTime) updates.endDateTime = new Date(endDateTime);

    const event = await eventService.updateEvent(req.params.id, req.user!._id.toString(), updates);
    if (!event) return res.status(404).json({ error: "Event not found" });

    return res.json(event);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to modify this event" });
    }
    throw error;
  }
}));

/**
 * DELETE /events/:id
 */
eventsRouter.delete("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.id, req.user!._id.toString());
    if (!result) return res.status(404).json({ error: "Event not found" });
    return res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }
    throw error;
  }
}));

export default eventsRouter;