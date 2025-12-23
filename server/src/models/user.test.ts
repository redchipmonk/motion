import { describe, expect, it } from "vitest";
import { User } from "./user";

describe("User Model", () => {
  it("should fail validation for invalid email format", () => {
    const user = new User({
      name: "Test User",
      handle: "testuser",
      email: "invalid-email",
    });

    const error = user.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.email).toBeDefined();
    expect(error?.errors.email.message).toBe("Please use a valid email address");
  });

  it("should pass validation for valid email format", () => {
    const user = new User({
      name: "Test User",
      handle: "testuser",
      email: "test@example.com",
    });

    const error = user.validateSync();
    expect(error).toBeUndefined();
  });
});