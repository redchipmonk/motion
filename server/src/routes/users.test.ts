import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type { UserDocument } from "../models/user";
import usersRouter from "./users";
import { userService } from "../services/userService";

vi.mock("../services/userService", () => {
  const mockFn = () => vi.fn();
  return {
    userService: {
      createUser: mockFn(),
      listUsers: mockFn(),
      getUserById: mockFn(),
      updateUser: mockFn(),
      deleteUser: mockFn(),
    },
  };
});

type UserServiceMock = {
  createUser: ReturnType<typeof vi.fn>;
  listUsers: ReturnType<typeof vi.fn>;
  getUserById: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  deleteUser: ReturnType<typeof vi.fn>;
};

const mockedUserService = userService as unknown as UserServiceMock;

const app = express();
app.use(express.json());
app.use("/users", usersRouter);

const buildUser = (overrides: Partial<UserDocument> = {}): UserDocument =>
  ({
    _id: new Types.ObjectId(),
    name: "Test User",
    email: "user@example.com",
    bio: "",
    organizations: [],
    profileImage: undefined,
    ...overrides,
  } as UserDocument);

describe("users router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user", async () => {
    mockedUserService.createUser.mockResolvedValueOnce(buildUser());
    const response = await request(app).post("/users").send({ name: "Test", email: "t@u.w" });
    expect(response.status).toBe(201);
    expect(mockedUserService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test", email: "t@u.w" })
    );
  });

  it("rejects invalid create payload", async () => {
    const response = await request(app).post("/users").send({ name: "Missing email" });
    expect(response.status).toBe(400);
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
  });

  it("lists users with email filter", async () => {
    mockedUserService.listUsers.mockResolvedValueOnce([buildUser()]);
    const response = await request(app).get("/users").query({ email: "user@example.com" });
    expect(response.status).toBe(200);
    expect(mockedUserService.listUsers).toHaveBeenCalledWith({ email: "user@example.com" });
  });

  it("fetches a user by id", async () => {
    mockedUserService.getUserById.mockResolvedValueOnce(buildUser());
    const response = await request(app).get("/users/123");
    expect(response.status).toBe(200);
  });

  it("returns 404 when user missing", async () => {
    mockedUserService.getUserById.mockResolvedValueOnce(null);
    const response = await request(app).get("/users/unknown");
    expect(response.status).toBe(404);
  });

  it("updates a user", async () => {
    mockedUserService.updateUser.mockResolvedValueOnce(buildUser({ bio: "updated" }));
    const response = await request(app).patch("/users/123").send({ bio: "updated" });
    expect(response.status).toBe(200);
    expect(mockedUserService.updateUser).toHaveBeenCalledWith("123", { bio: "updated" });
  });

  it("rejects invalid updates", async () => {
    const response = await request(app).patch("/users/123").send({ organizations: "club" });
    expect(response.status).toBe(400);
    expect(mockedUserService.updateUser).not.toHaveBeenCalled();
  });

  it("returns 404 on missing user update", async () => {
    mockedUserService.updateUser.mockResolvedValueOnce(null);
    const response = await request(app).patch("/users/unknown").send({ name: "x" });
    expect(response.status).toBe(404);
  });

  it("deletes a user", async () => {
    mockedUserService.deleteUser.mockResolvedValueOnce(buildUser());
    const response = await request(app).delete("/users/123");
    expect(response.status).toBe(204);
  });

  it("returns 404 when deleting missing user", async () => {
    mockedUserService.deleteUser.mockResolvedValueOnce(null);
    const response = await request(app).delete("/users/unknown");
    expect(response.status).toBe(404);
  });
});
