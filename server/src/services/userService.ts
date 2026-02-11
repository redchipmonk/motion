import { QueryFilter } from "mongoose";
import { User, UserDocument, UserModel } from "../models/user";
import { ConnectionRequest, ConnectionRequestModel } from "../models/ConnectionRequest";
import { RSOManager, RSOManagerModel } from "../models/RSOManager";
import { ERROR_FORBIDDEN } from "../constants";

export interface CreateUserInput {
  name: string;
  email: string;
  bio?: string;
  organizations?: string[];
  profileImage?: string;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export class UserService {
  constructor(
    private readonly userModel: UserModel = User,
    private readonly connectionRequestModel: ConnectionRequestModel = ConnectionRequest,
    private readonly rsoManagerModel: RSOManagerModel = RSOManager
  ) { }

  async createUser(payload: CreateUserInput) {
    const user = new this.userModel({
      ...payload,
      organizations: payload.organizations ?? [],
    });
    return user.save();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async listUsers(filter: QueryFilter<UserDocument> = {}) {
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateUser(id: string, authorizedUserId: string, updates: UpdateUserInput) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }

    if (user._id.toString() !== authorizedUserId.toString()) {
      throw new Error(ERROR_FORBIDDEN);
    }

    return this.userModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
  }

  async deleteUser(id: string, authorizedUserId: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }

    if (user._id.toString() !== authorizedUserId.toString()) {
      throw new Error(ERROR_FORBIDDEN);
    }

    return this.userModel.findByIdAndDelete(id).exec();
  }

  // --- Social Graph Methods ---

  async requestConnection(requesterId: string, recipientId: string) {
    if (requesterId === recipientId) throw new Error("Cannot connect with yourself");

    // Check if already connected
    const requester = await this.userModel.findById(requesterId);
    if (requester?.connections.some(c => c.toString() === recipientId)) {
      throw new Error("Already connected");
    }

    // Check if request already exists
    const existingRequest = await this.connectionRequestModel.findOne({
      requester: requesterId,
      recipient: recipientId,
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") throw new Error("Connection request already pending");
      if (existingRequest.status === "accepted") throw new Error("Already connected");
    }

    // Check if reverse request exists (if so, auto-accept)
    const reverseRequest = await this.connectionRequestModel.findOne({
      requester: recipientId,
      recipient: requesterId,
      status: "pending",
    });

    if (reverseRequest) {
      return this.acceptConnection(recipientId, requesterId); // Original requester becomes "requester" here for acceptance
    }

    // Create new request
    const request = new this.connectionRequestModel({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });
    return request.save();
  }

  async acceptConnection(requesterId: string, recipientId: string) {
    // requesterId is the one who SENT the request
    // recipientId is the one ACCEPTING it (current user)

    const request = await this.connectionRequestModel.findOne({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    if (!request) throw new Error("No pending connection request found");

    request.status = "accepted";
    await request.save();

    // Add to both users' connections
    await this.userModel.findByIdAndUpdate(requesterId, { $addToSet: { connections: recipientId } });
    await this.userModel.findByIdAndUpdate(recipientId, { $addToSet: { connections: requesterId } });
  }

  async followRSO(userId: string, rsoId: string) {
    const rso = await this.userModel.findById(rsoId);
    if (!rso || rso.userType !== "organization") {
      throw new Error("Target is not an RSO");
    }

    await this.userModel.findByIdAndUpdate(userId, { $addToSet: { following: rsoId } });
    await this.userModel.findByIdAndUpdate(rsoId, { $addToSet: { followers: userId } });
  }

  async unfollowRSO(userId: string, rsoId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $pull: { following: rsoId } });
    await this.userModel.findByIdAndUpdate(rsoId, { $pull: { followers: userId } });
  }

  async getManagedRSOs(userId: string) {
    const managements = await this.rsoManagerModel.find({ user: userId }).populate("rso");
    return managements.map(m => m.rso);
  }
}

export const userService = new UserService();
