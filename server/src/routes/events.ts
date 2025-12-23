import { Router } from "express";
import { PipelineStage, Types } from "mongoose";
import { eventService, CreateEventInput, UpdateEventInput } from "../services/eventService";

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
eventsRouter.get("/feed", async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /events
 * Creates a new event.
 */
eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body as CreateEventBody;
    if (!body.title || !body.description || !body.dateTime || !body.location || !body.visibility || !body.createdBy) {
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
      visibility: body.visibility,
      createdBy: body.createdBy,
      capacity: body.capacity,
      images: body.images,
      tags: body.tags,
    };

    const event = await eventService.createEvent(input);
    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /events
 * Lists events with optional filters.
 */
eventsRouter.get("/", async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /events/:id
 */
eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /events/:id
 */
eventsRouter.patch("/:id", async (req, res, next) => {
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

    const event = await eventService.updateEvent(req.params.id, updates);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /events/:id
 */
eventsRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(req.params.id);
    if (!result) return res.status(404).json({ error: "Event not found" });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default eventsRouter;