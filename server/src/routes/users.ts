import { Router } from "express";
import { userService, CreateUserInput, UpdateUserInput } from "../services/userService";

const usersRouter = Router();

const isString = (value: unknown): value is string => typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => isString(item));

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

usersRouter.post("/", async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/", async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.email === "string") {
      filter.email = req.query.email;
    }

    const users = await userService.listUsers(filter);
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const updates = sanitizeUpdateBody(req.body);
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const user = await userService.updateUser(req.params.id, updates);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default usersRouter;
