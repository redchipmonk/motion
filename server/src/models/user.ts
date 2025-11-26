import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  bio?: string;
  organizations: string[];  // placeholder maybe separate org schema in the future
  profileImage?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    bio: { type: String, default: "" },
    organizations: { type: [String], default: [] },
    profileImage: { type: String },
  },
  { timestamps: true }
);

export type UserModel = Model<UserDocument>;
export const User: UserModel =
  (mongoose.models.User as UserModel) || mongoose.model<UserDocument>("User", userSchema);
