import { Router } from "express";
import { Types } from "mongoose";
import { protectedRoute, AuthRequest } from "../middleware/auth";
import { rsvpService, UpdateRsvpInput, CreateRsvpInput } from "../services/rsvpService";
import { asyncHandler } from "../middleware/asyncHandler";
import { isString, isValidObjectId } from "../utils/validation";

const rsvpsRouter = Router();

type CreateRsvpBody = Omit<CreateRsvpInput, "event" | "user"> & {
  event: string;
  user: string;
};
type UpdateRsvpBody = UpdateRsvpInput;

const allowedStatuses: ReadonlySet<string> = new Set(["going", "interested", "waitlist"]);

const isValidStatus = (value: unknown): value is CreateRsvpBody["status"] =>
  isString(value) && allowedStatuses.has(value);

const isCreateBody = (body: Partial<CreateRsvpBody> | undefined): body is CreateRsvpBody =>
  !!body &&
  isValidObjectId(body.event) &&
  isValidObjectId(body.user) &&
  (!body.status || isValidStatus(body.status));

const sanitizeUpdate = (payload: unknown): UpdateRsvpBody | null => {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as UpdateRsvpBody;
  const result: UpdateRsvpBody = {};

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return null;
    }
    result.status = body.status;
  }

  if (body.notes !== undefined) {
    if (!isString(body.notes)) {
      return null;
    }
    result.notes = body.notes;
  }

  return Object.keys(result).length ? result : {};
};

rsvpsRouter.post("/", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  const body = req.body as Partial<CreateRsvpBody> | undefined;
  if (!isCreateBody(body)) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const rsvp = await rsvpService.createRsvp({
    event: new Types.ObjectId(body.event),
    user: req.user!._id,
    status: body.status,
    notes: body.notes,
  });

  return res.status(201).json(rsvp);
}));

rsvpsRouter.get("/", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (isValidObjectId(req.query.event)) {
    filter.event = req.query.event;
  }
  if (isValidObjectId(req.query.user)) {
    filter.user = req.query.user;
  }
  if (isString(req.query.status) && allowedStatuses.has(req.query.status)) {
    filter.status = req.query.status;
  }

  const rsvps = await rsvpService.listRsvps(filter);
  return res.json(rsvps);
}));

rsvpsRouter.get("/:id", asyncHandler(async (req, res) => {
  const rsvp = await rsvpService.getRsvpById(req.params.id);
  if (!rsvp) {
    return res.status(404).json({ error: "RSVP not found" });
  }
  return res.json(rsvp);
}));

rsvpsRouter.patch("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const updates = sanitizeUpdate(req.body);
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const rsvp = await rsvpService.updateRsvp(req.params.id, req.user!._id.toString(), updates);
    if (!rsvp) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    return res.json(rsvp);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to modify this RSVP" });
    }
    throw error;
  }
}));

rsvpsRouter.delete("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const deleted = await rsvpService.deleteRsvp(req.params.id, req.user!._id.toString());
    if (!deleted) {
      return res.status(404).json({ error: "RSVP not found" });
    }
    return res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to delete this RSVP" });
    }
    throw error;
  }
}));

export default rsvpsRouter;
