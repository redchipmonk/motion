import { Router } from "express";
import { eventService, CreateEventInput, UpdateEventInput } from "../services/eventService";
import { UserDocument } from "../models/user";

const eventsRouter = Router();

type CreateEventBody = Omit<CreateEventInput, "dateTime"> & { dateTime: string };
type UpdateEventBody = Partial<Omit<CreateEventBody, "createdBy">>;

const isString = (value: unknown): value is string => typeof value === "string";

const isValidLocation = (location: unknown): location is CreateEventInput["location"] =>
  typeof location === "object" &&
  location !== null &&
  isString((location as { address?: unknown }).address) &&
  typeof (location as { latitude?: unknown }).latitude === "number" &&
  typeof (location as { longitude?: unknown }).longitude === "number";

const parseDate = (value: unknown): Date | null => {
  if (!isString(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getQueryString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const isCreateEventBody = (body: Partial<CreateEventBody> | undefined): body is CreateEventBody =>
  !!body &&
  isString(body.title) &&
  isString(body.description) &&
  isString(body.dateTime) &&
  isValidLocation(body.location) &&
  isString(body.visibility) &&
  //isString(body.createdBy) &&
  (!body.images || (Array.isArray(body.images) && body.images.every((img) => isString(img)))) &&
  (!body.tags || (Array.isArray(body.tags) && body.tags.every((tag) => isString(tag)))) &&
  (body.price === undefined || typeof body.price === "number");

const sanitizeUpdateBody = (payload: unknown): UpdateEventBody | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as UpdateEventBody;
  const result: UpdateEventBody = {};

  if (body.title !== undefined) {
    if (!isString(body.title)) return null;
    result.title = body.title;
  }
  if (body.description !== undefined) {
    if (!isString(body.description)) return null;
    result.description = body.description;
  }
  if (body.dateTime !== undefined) {
    if (!isString(body.dateTime)) return null;
    result.dateTime = body.dateTime;
  }
  if (body.location !== undefined) {
    if (!isValidLocation(body.location)) return null;
    result.location = body.location;
  }
  if (body.visibility !== undefined) {
    if (!isString(body.visibility)) return null;
    result.visibility = body.visibility;
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || !body.images.every((img) => isString(img))) return null;
    result.images = body.images;
  }
  if (body.price !== undefined) {
    if (typeof body.price !== "number") return null;
    result.price = body.price;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag) => isString(tag))) return null;
    result.tags = body.tags;
  }

  return Object.keys(result).length > 0 ? result : {};
};

eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body as Partial<CreateEventBody> | undefined;
    if (!isCreateEventBody(body)) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    const parsedDate = parseDate(body.dateTime);
    if (!parsedDate) {
      return res.status(400).json({ error: "Invalid dateTime value" });
    }

    // need to check that req.user exists
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const event = await eventService.createEvent({
      title: body.title,
      description: body.description,
      dateTime: parsedDate,
      location: body.location,
      visibility: body.visibility,
      images: body.images,
      price: body.price,
      tags: body.tags,
      createdBy: (req.user as UserDocument)._id
    });

    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
});

eventsRouter.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    const visibility = getQueryString(req.query.visibility);
    if (visibility) {
      filter.visibility = visibility;
    }
    const createdBy = getQueryString(req.query.createdBy);
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    const tag = getQueryString(req.query.tag);
    if (tag) {
      filter.tags = tag;
    }

    const events = await eventService.listEvents(filter);
    return res.json(events);
  } catch (error) {
    return next(error);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

eventsRouter.patch("/:id", async (req, res, next) => {
  try {
    const updates = sanitizeUpdateBody(req.body);
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const { dateTime, ...rest } = updates;
    const parsedUpdates: UpdateEventInput = { ...rest };
    if (dateTime) {
      const parsedDate = parseDate(dateTime);
      if (!parsedDate) {
        return res.status(400).json({ error: "Invalid dateTime value" });
      }
      parsedUpdates.dateTime = parsedDate;
    }

    const event = await eventService.updateEvent(req.params.id, parsedUpdates);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

eventsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await eventService.deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default eventsRouter;
