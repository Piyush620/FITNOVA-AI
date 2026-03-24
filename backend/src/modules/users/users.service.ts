import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from 'src/modules/auth/schemas/user.schema';

import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getCurrentUser(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      profile: user.profile,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateCurrentUser(userId: string, payload: UpdateUserProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.profile = {
      ...user.profile,
      ...payload,
    };
    await user.save();

    return this.getCurrentUser(userId);
  }

  async getDashboardSnapshot(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const currentWeight = user.profile.weightKg ?? null;
    const targetWeight =
      currentWeight && user.profile.goal?.toLowerCase().includes('fat')
        ? Math.max(currentWeight - 6, 0)
        : currentWeight
          ? currentWeight + 3
          : null;

    return {
      greeting: `Welcome back, ${user.profile.fullName.split(' ')[0]}`,
      currentWeight,
      targetWeight,
      goal: user.profile.goal ?? 'general fitness',
      activityLevel: user.profile.activityLevel ?? 'moderate',
      weeklyConsistency: 82,
      caloriesTarget: 2200,
      completedWorkoutsThisWeek: 4,
      nextCheckIn: this.getNextCheckInDate(),
    };
  }

  private getNextCheckInDate() {
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + 7);
    return nextCheckIn.toISOString();
  }
}
