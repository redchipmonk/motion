import mongoose, { Schema, Document, Model } from 'mongoose';

export interface FriendshipDocument extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
}

const friendshipSchema = new Schema<FriendshipDocument>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user cannot send a duplicate friend request
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index to quickly find all friends of a user (for both sides of the relationship)
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });


export type FriendshipModel = Model<FriendshipDocument>;
export const Friendship: FriendshipModel =
  (mongoose.models.Friendship as FriendshipModel) ||
  mongoose.model<FriendshipDocument>('Friendship', friendshipSchema);
