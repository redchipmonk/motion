import { Types } from "mongoose";

export const isString = (value: unknown): value is string => typeof value === "string";

export const isValidObjectId = (value: unknown): value is string =>
  isString(value) && Types.ObjectId.isValid(value);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => isString(item));
