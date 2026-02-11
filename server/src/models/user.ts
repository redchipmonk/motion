/**
 * @file User Mongoose model with unified authentication support.
 * 
 * Supports both Google OAuth and local email/password authentication.
 * Password field is select:false by default for security.
 * 
 * @see GEMINI.md for authentication architecture details
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  handle?: string;
  userType: "individual" | "organization";
  bio?: string;
  organizations: string[];
  profileImage?: string;
  connections: mongoose.Types.ObjectId[]; // For students: mutual connections
  followers: mongoose.Types.ObjectId[];   // For RSOs: students following them
  following: mongoose.Types.ObjectId[];   // For students: RSOs they follow
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    handle: { type: String, required: false, unique: true, lowercase: true, trim: true, sparse: true },
    userType: {
      type: String,
      enum: ["individual", "organization"],
      default: "individual",
      required: true,
    },
    bio: { type: String, default: "" },
    organizations: { type: [String], default: [] },
    profileImage: { type: String },
    connections: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    following: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: true }
);

export type UserModel = Model<UserDocument>;
export const User: UserModel =
  (mongoose.models.User as UserModel) || mongoose.model<UserDocument>("User", userSchema);

