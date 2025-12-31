import { QueryFilter } from "mongoose";
import { User, UserDocument, UserModel } from "../models/user";
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
  constructor(private readonly userModel: UserModel = User) { }

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
}

export const userService = new UserService();
