import { Router } from "express";
import { protectedRoute, AuthRequest } from "../middleware/auth";
import { userService, CreateUserInput, UpdateUserInput } from "../services/userService";
import { asyncHandler } from "../middleware/asyncHandler";
import { isString, isStringArray } from "../utils/validation";

const usersRouter = Router();

const isCreateUserBody = (body: Partial<CreateUserInput> | undefined): body is CreateUserInput =>
  !!body && isString(body.name) && isString(body.email);

const sanitizeUpdateBody = (payload: unknown): UpdateUserInput | null => {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as UpdateUserInput;
  const result: UpdateUserInput = {};

  if (body.name !== undefined) {
    if (!isString(body.name)) return null;
    result.name = body.name;
  }

  if (body.email !== undefined) {
    if (!isString(body.email)) return null;
    result.email = body.email;
  }

  if (body.bio !== undefined) {
    if (!isString(body.bio)) return null;
    result.bio = body.bio;
  }

  if (body.organizations !== undefined) {
    if (!isStringArray(body.organizations)) return null;
    result.organizations = body.organizations;
  }

  if (body.profileImage !== undefined) {
    if (!isString(body.profileImage)) return null;
    result.profileImage = body.profileImage;
  }

  return Object.keys(result).length ? result : {};
};

usersRouter.post("/", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  const body = req.body as Partial<CreateUserInput> | undefined;
  if (!isCreateUserBody(body)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const user = await userService.createUser({
    name: body.name,
    email: body.email,
    bio: body.bio,
    organizations: body.organizations,
    profileImage: body.profileImage,
  });

  return res.status(201).json(user);
}));

usersRouter.get("/", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.email === "string") {
    filter.email = req.query.email;
  }

  const users = await userService.listUsers(filter);
  return res.json(users);
}));

usersRouter.get("/:id", asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
}));

usersRouter.patch("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const updates = sanitizeUpdateBody(req.body);
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const user = await userService.updateUser(req.params.id, req.user!._id.toString(), updates);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to modify this profile" });
    }
    throw error;
  }
}));

usersRouter.delete("/:id", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id, req.user!._id.toString());
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return res.status(403).json({ error: "Not authorized to delete this profile" });
    }
    throw error;
  }
}));

usersRouter.post("/request-connection", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { recipientId } = req.body;
  if (!isString(recipientId)) {
    return res.status(400).json({ error: "Missing recipientId" });
  }

  await userService.requestConnection(req.user!._id.toString(), recipientId);
  return res.status(200).json({ message: "Connection requested" });
}));

usersRouter.post("/accept-connection", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { requesterId } = req.body;
  if (!isString(requesterId)) {
    return res.status(400).json({ error: "Missing requesterId" });
  }

  await userService.acceptConnection(requesterId, req.user!._id.toString());
  return res.status(200).json({ message: "Connection accepted" });
}));

usersRouter.post("/follow-rso", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { rsoId } = req.body;
  if (!isString(rsoId)) {
    return res.status(400).json({ error: "Missing rsoId" });
  }

  await userService.followRSO(req.user!._id.toString(), rsoId);
  return res.status(200).json({ message: "RSO followed" });
}));

usersRouter.post("/unfollow-rso", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { rsoId } = req.body;
  if (!isString(rsoId)) {
    return res.status(400).json({ error: "Missing rsoId" });
  }

  await userService.unfollowRSO(req.user!._id.toString(), rsoId);
  return res.status(200).json({ message: "RSO unfollowed" });
}));

// list connections for a user
usersRouter.get("/:id/connections", asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Populate connections
  const populatedUser = await user.populate("connections");
  return res.json(populatedUser.connections);
}));

usersRouter.get("/managed-rsos", protectedRoute, asyncHandler(async (req: AuthRequest, res) => {
  const rsos = await userService.getManagedRSOs(req.user!._id.toString());
  return res.json(rsos);
}));

export default usersRouter;
