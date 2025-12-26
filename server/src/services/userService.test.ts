import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserModel } from "../models/user";
import { UserService, CreateUserInput, UpdateUserInput } from "./userService";

type UserModelLike = {
  new(doc: Record<string, unknown>): { save: () => Promise<Record<string, unknown>> };
  findById(id: string): { exec: () => Promise<Record<string, unknown> | null> };
  findOne(filter: Record<string, unknown>): { exec: () => Promise<Record<string, unknown> | null> };
  find(filter?: Record<string, unknown>): {
    sort: (order: Record<string, number>) => { exec: () => Promise<Record<string, unknown>[]> };
  };
  findByIdAndUpdate(
    id: string,
    updates: Record<string, unknown>,
    options: Record<string, unknown>
  ): { exec: () => Promise<Record<string, unknown> | null> };
  findByIdAndDelete(id: string): { exec: () => Promise<Record<string, unknown> | null> };
};

type UserModelMock = {
  model: UserModelLike;
  saveSpy: ReturnType<typeof vi.fn>;
  findByIdSpy: ReturnType<typeof vi.fn>;
  findOneSpy: ReturnType<typeof vi.fn>;
  findSpy: ReturnType<typeof vi.fn>;
  updateSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
};

const createUserModelMock = (): UserModelMock => {
  const saveSpy = vi.fn((doc: Record<string, unknown>) => Promise.resolve(doc));
  const findByIdSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
  const findOneSpy = vi.fn<(filter: Record<string, unknown>) => Promise<Record<string, unknown> | null>>();
  const findSpy = vi.fn<(filter?: Record<string, unknown>) => Promise<Record<string, unknown>[]>>();
  const updateSpy = vi.fn<
    (id: string, updates: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  >();
  const deleteSpy = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();

  const Constructor = function (this: unknown, doc: Record<string, unknown>) {
    return {
      ...doc,
      save: () => saveSpy({ ...doc, _id: "user-id" }),
    };
  };

  const model = Constructor as unknown as UserModelLike;
  model.findById = (id: string) => ({ exec: () => findByIdSpy(id) });
  model.findOne = (filter: Record<string, unknown>) => ({ exec: () => findOneSpy(filter) });
  model.find = (filter?: Record<string, unknown>) => ({
    sort: () => ({ exec: () => findSpy(filter) }),
  });
  model.findByIdAndUpdate = (
    id: string,
    updates: Record<string, unknown>,
    options: Record<string, unknown>
  ) => {
    void options;
    return {
      exec: () => updateSpy(id, updates),
    };
  };
  model.findByIdAndDelete = (id: string) => ({
    exec: () => deleteSpy(id),
  });

  return { model, saveSpy, findByIdSpy, findOneSpy, findSpy, updateSpy, deleteSpy };
};

describe("UserService", () => {
  let service: UserService;
  let mocks: UserModelMock;

  beforeEach(() => {
    mocks = createUserModelMock();
    service = new UserService(mocks.model as unknown as UserModel);
  });

  it("creates a user with defaults", async () => {
    const payload: CreateUserInput = {
      name: "Test User",
      email: "test@example.com",
    };

    const user = await service.createUser(payload);
    expect(user._id).toBe("user-id");
    expect(mocks.saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ organizations: [] })
    );
  });

  it("gets user by id", async () => {
    mocks.findByIdSpy.mockResolvedValueOnce({ _id: "123" });
    const user = await service.getUserById("123");
    expect(user?._id).toBe("123");
  });

  it("gets user by email", async () => {
    mocks.findOneSpy.mockResolvedValueOnce({ email: "test@example.com" });
    const user = await service.getUserByEmail("test@example.com");
    expect(user?.email).toBe("test@example.com");
  });

  it("lists users", async () => {
    mocks.findSpy.mockResolvedValueOnce([{ _id: "1" }]);
    const users = await service.listUsers();
    expect(users).toHaveLength(1);
  });

  it("updates a user", async () => {
    const updates: UpdateUserInput = { bio: "Updated bio" };
    mocks.updateSpy.mockResolvedValueOnce({ _id: "1", bio: "Updated bio" });
    const updated = await service.updateUser("1", "1", updates);
    expect(updated?.bio).toBe("Updated bio");
  });

  it("deletes a user", async () => {
    mocks.deleteSpy.mockResolvedValueOnce({ acknowledged: true });
    const deleted = await service.deleteUser("1", "1");
    expect(deleted).toEqual({ acknowledged: true });
  });
});
