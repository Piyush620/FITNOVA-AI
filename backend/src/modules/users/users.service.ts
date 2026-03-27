import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { estimateGoalCalories } from 'src/common/utils/calorie-target';
import { User, UserDocument } from 'src/modules/auth/schemas/user.schema';
import {
  CalorieLog,
  CalorieLogDocument,
} from 'src/modules/calorie-logs/schemas/calorie-log.schema';
import { DietPlan, DietPlanDocument } from 'src/modules/diet/schemas/diet-plan.schema';
import {
  ProgressCheckIn,
  ProgressCheckInDocument,
} from 'src/modules/progress/schemas/progress-check-in.schema';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from 'src/modules/workouts/schemas/workout-plan.schema';

import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(WorkoutPlan.name)
    private readonly workoutPlanModel: Model<WorkoutPlanDocument>,
    @InjectModel(DietPlan.name)
    private readonly dietPlanModel: Model<DietPlanDocument>,
    @InjectModel(CalorieLog.name)
    private readonly calorieLogModel: Model<CalorieLogDocument>,
    @InjectModel(ProgressCheckIn.name)
    private readonly progressCheckInModel: Model<ProgressCheckInDocument>,
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
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);

    const [activeWorkoutPlan, activeDietPlan, allWorkoutPlans, allDietPlans, progressHistory, todaysLogs, monthlyLogs] =
      await Promise.all([
        this.workoutPlanModel.findOne({ userId: objectId, status: 'active' }).lean(),
        this.dietPlanModel.findOne({ userId: objectId, status: 'active' }).lean(),
        this.workoutPlanModel.find({ userId: objectId }).lean(),
        this.dietPlanModel.find({ userId: objectId }).lean(),
        this.progressCheckInModel.find({ userId: objectId }).sort({ createdAt: -1 }).lean(),
        this.calorieLogModel.find({ userId: objectId, loggedDate: today }).lean(),
        this.calorieLogModel
          .find({
            userId: objectId,
            loggedDate: {
              $gte: `${currentMonth}-01`,
              $lte: `${currentMonth}-31`,
            },
          })
          .lean(),
      ]);

    const currentWeight = progressHistory[0]?.weightKg ?? user.profile.weightKg ?? null;
    const startingWeight =
      progressHistory.length > 0
        ? progressHistory[progressHistory.length - 1].weightKg ?? currentWeight
        : user.profile.weightKg ?? null;
    const targetWeight = this.calculateTargetWeight(currentWeight, user.profile.goal);
    const workoutStats = this.calculateWorkoutStats(allWorkoutPlans);
    const dietStats = this.calculateDietStats(allDietPlans);
    const todaysCalories = todaysLogs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
    const monthlyCalories = monthlyLogs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
    const monthlyLoggedDays = new Set(monthlyLogs.map((log) => log.loggedDate)).size;
    const averageLoggedDayCalories =
      monthlyLoggedDays > 0 ? Math.round(monthlyCalories / monthlyLoggedDays) : 0;
    const calorieTarget =
      activeDietPlan?.targetCalories ??
      activeDietPlan?.days?.find((day) => typeof day.targetCalories === 'number')?.targetCalories ??
      estimateGoalCalories({
        age: user.profile.age,
        gender: user.profile.gender,
        heightCm: user.profile.heightCm,
        weightKg: user.profile.weightKg,
        activityLevel: user.profile.activityLevel,
        goal: user.profile.goal,
      });

    return {
      greeting: `Welcome back, ${user.profile.fullName.split(' ')[0]}`,
      currentWeight,
      startingWeight,
      targetWeight,
      goal: user.profile.goal ?? 'general fitness',
      activityLevel: user.profile.activityLevel ?? 'moderate',
      weeklyConsistency: this.calculateWeeklyConsistency(workoutStats.completionRate, dietStats.completionRate),
      caloriesTarget: calorieTarget,
      todaysCalories,
      remainingCalories: calorieTarget - todaysCalories,
      monthlyAverageCalories: averageLoggedDayCalories,
      monthlyLoggedDays,
      completedWorkoutsThisWeek: workoutStats.completedDays,
      completedMeals: dietStats.completedMeals,
      totalMeals: dietStats.totalMeals,
      activeWorkoutPlan: activeWorkoutPlan
        ? {
            id: activeWorkoutPlan._id.toString(),
            title: activeWorkoutPlan.title,
            status: activeWorkoutPlan.status,
          }
        : null,
      activeDietPlan: activeDietPlan
        ? {
            id: activeDietPlan._id.toString(),
            title: activeDietPlan.title,
            status: activeDietPlan.status,
          }
        : null,
      progressSummary: {
        totalCheckIns: progressHistory.length,
        latestEnergyLevel: progressHistory[0]?.energyLevel ?? null,
        latestMoodScore: progressHistory[0]?.moodScore ?? null,
        latestSleepQuality: progressHistory[0]?.sleepQuality ?? null,
        weightChangeKg:
          currentWeight !== null && startingWeight !== null
            ? Number((currentWeight - startingWeight).toFixed(1))
            : null,
      },
      nextCheckIn: this.getNextCheckInDate(),
    };
  }

  private calculateTargetWeight(currentWeight: number | null, goal?: string) {
    if (!currentWeight) {
      return null;
    }

    const normalizedGoal = goal?.toLowerCase() ?? '';
    if (normalizedGoal.includes('fat') || normalizedGoal.includes('loss')) {
      return Math.max(currentWeight - 6, 0);
    }

    if (normalizedGoal.includes('muscle') || normalizedGoal.includes('gain')) {
      return currentWeight + 3;
    }

    return currentWeight;
  }

  private calculateWorkoutStats(plans: Array<WorkoutPlan & { _id: Types.ObjectId }>) {
    const totalDays = plans.reduce((sum, plan) => sum + plan.days.length, 0);
    const completedDays = plans.reduce(
      (sum, plan) => sum + plan.days.filter((day) => !!day.completedAt).length,
      0,
    );

    return {
      totalDays,
      completedDays,
      completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
    };
  }

  private calculateDietStats(plans: Array<DietPlan & { _id: Types.ObjectId }>) {
    const totalMeals = plans.reduce(
      (sum, plan) => sum + plan.days.reduce((daySum, day) => daySum + day.meals.length, 0),
      0,
    );
    const completedMeals = plans.reduce(
      (sum, plan) =>
        sum + plan.days.reduce((daySum, day) => daySum + day.meals.filter((meal) => !!meal.completedAt).length, 0),
      0,
    );

    return {
      totalMeals,
      completedMeals,
      completionRate: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
  }

  private calculateWeeklyConsistency(workoutCompletionRate: number, dietCompletionRate: number) {
    return Math.round((workoutCompletionRate + dietCompletionRate) / 2);
  }

  private getNextCheckInDate() {
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + 7);
    return nextCheckIn.toISOString();
  }
}
