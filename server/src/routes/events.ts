import { Router } from "express";
import { Types } from "mongoose";
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