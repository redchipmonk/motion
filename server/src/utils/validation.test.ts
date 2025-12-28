import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { isString, isValidObjectId, isStringArray } from "./validation";

describe("validation utils", () => {
  describe("isString", () => {
    it("returns true for strings", () => {
      expect(isString("hello")).toBe(true);
      expect(isString("")).toBe(true);
    });

    it("returns false for non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe("isValidObjectId", () => {
    it("returns true for valid mongo ids", () => {
      expect(isValidObjectId(new Types.ObjectId().toHexString())).toBe(true);
      expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
    });

    it("returns false for invalid strings", () => {
      expect(isValidObjectId("invalid")).toBe(false);
      expect(isValidObjectId("123")).toBe(false);
    });

    it("returns false for non-strings", () => {
      expect(isValidObjectId(123)).toBe(false);
      expect(isValidObjectId(null)).toBe(false);
    });
  });

  describe("isStringArray", () => {
    it("returns true for array of strings", () => {
      expect(isStringArray(["a", "b"])).toBe(true);
      expect(isStringArray([])).toBe(true); // Empty array is valid array of strings technically
    });

    it("returns false for non-arrays or Mixed arrays", () => {
      expect(isStringArray("not array")).toBe(false);
      expect(isStringArray(["a", 1])).toBe(false);
      expect(isStringArray([null])).toBe(false);
    });
  });
});
