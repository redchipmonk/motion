import mongoose, { Schema, Document, Model } from "mongoose";
import type { EventModel } from "./event";
import type { RsvpModel } from "./rsvp";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  handle: string;
  userType: "individual" | "organization";
  bio?: string;
  organizations: string[];  // placeholder maybe separate org schema in the future
  profileImage?: string;
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
  };
  interests: string[];
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
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userType: {
      type: String,
      enum: ["individual", "organization"],
      default: "individual",
      required: true,
    },
    bio: { type: String, default: "" },
    organizations: { type: [String], default: [] },
    profileImage: { type: String },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    socialLinks: {
      website: String,
      instagram: String,
      twitter: String,
    },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Pre-save hook to capture the state of following/followers before the update
userSchema.pre("save", async function () {
  if ((this.isModified("following") || this.isModified("followers")) && !this.isNew) {
    try {
      const model = this.constructor as UserModel;
      const oldUser = await model.findById(this._id);
      if (oldUser) {
        (this as UserDocument & { _oldFollowing?: mongoose.Types.ObjectId[] })._oldFollowing = oldUser.following;
        (this as UserDocument & { _oldFollowers?: mongoose.Types.ObjectId[] })._oldFollowers = oldUser.followers;
      }
    } catch (error) {
      console.error("User pre-save hook error:", error);
    }
  }
});

// Post-save hook to clean up RSVPs when a connection is severed
userSchema.post("save", async function () {
  const doc = this as UserDocument & { _oldFollowers?: mongoose.Types.ObjectId[] };
  const oldFollowers: mongoose.Types.ObjectId[] = doc._oldFollowers || [];
  const newFollowers: mongoose.Types.ObjectId[] = this.followers || [];

  // If the host removes a follower, that follower loses access to the host's private events
  const removedFollowers = oldFollowers.filter(
    (oldId) => !newFollowers.some((newId) => newId.equals(oldId))
  );

  if (removedFollowers.length > 0) {
    try {
      const Event = mongoose.model("Event") as EventModel;
      const Rsvp = mongoose.model("Rsvp") as RsvpModel;

      // 1. Find all "friends-only" events created by this user
      const privateEvents = await Event.find({
        createdBy: this._id,
        visibility: "friends",
      }).select("_id");

      const eventIds = privateEvents.map((e) => e._id);

      // 2. Delete RSVPs for the removed friends for these specific events
      // We use deleteMany for performance, but note that this won't trigger 
      // the Rsvp 'deleteOne' hook. We'll need to handle participantCount manually 
      // or loop through and call .deleteOne() if we want to trigger hooks.
      await Rsvp.deleteMany({
        event: { $in: eventIds },
        user: { $in: removedFollowers },
      });

      // Note: In a production app, you'd also need to recalculate participantCount 
      // for these events since deleteMany bypasses the RSVP hooks.
    } catch (error) {
      console.error("User post-save friend cleanup error:", error);
    }
  }
});

// Indexes for social lookups
userSchema.index({ following: 1 });
userSchema.index({ followers: 1 });

export type UserModel = Model<UserDocument>;
export const User: UserModel =
  (mongoose.models.User as UserModel) || mongoose.model<UserDocument>("User", userSchema);
