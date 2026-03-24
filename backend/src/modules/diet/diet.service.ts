import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { DietPlan, DietPlanDocument, DietPlanStatus } from './schemas/diet-plan.schema';

@Injectable()
export class DietService {
  constructor(
    @InjectModel(DietPlan.name)
    private readonly dietPlanModel: Model<DietPlanDocument>,
  ) {}

  async createPlan(userId: string, payload: CreateDietPlanDto) {
    const shouldActivate = payload.activateNow ?? true;
    if (shouldActivate) {
      await this.deactivateActivePlans(userId);
    }

    const plan = await this.dietPlanModel.create({
      userId: new Types.ObjectId(userId),
      title: payload.title,
      goal: payload.goal,
      preference: payload.preference,
      targetCalories: payload.targetCalories,
      days: payload.days
        .slice()
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => ({
          ...day,
          meals: day.meals.map((meal) => ({
            ...meal,
            completedAt: undefined,
          })),
        })),
      status: shouldActivate ? DietPlanStatus.ACTIVE : DietPlanStatus.DRAFT,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      isAiGenerated: payload.isAiGenerated ?? false,
      notes: payload.notes,
    });

    return this.serializePlan(plan);
  }

  async listPlans(userId: string) {
    const plans = await this.dietPlanModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean();

    return plans.map((plan) => this.serializeLeanPlan(plan));
  }

  async getActivePlan(userId: string) {
    const plan = await this.dietPlanModel.findOne({
      userId: new Types.ObjectId(userId),
      status: DietPlanStatus.ACTIVE,
    }).lean();

    if (!plan) {
      throw new NotFoundException('No active diet plan found.');
    }

    return this.serializeLeanPlan(plan);
  }

  async getPlanById(userId: string, planId: string) {
    const plan = await this.findOwnedPlan(userId, planId);
    return this.serializePlan(plan);
  }

  async activatePlan(userId: string, planId: string) {
    await this.deactivateActivePlans(userId);

    const plan = await this.findOwnedPlan(userId, planId);
    plan.status = DietPlanStatus.ACTIVE;
    await plan.save();

    return this.serializePlan(plan);
  }

  async completeMeal(userId: string, planId: string, dayNumber: number, mealType: string) {
    const plan = await this.findOwnedPlan(userId, planId);
    const dietDay = plan.days.find((day) => day.dayNumber === dayNumber);

    if (!dietDay) {
      throw new NotFoundException(`Diet day ${dayNumber} was not found in this plan.`);
    }

    const meal = dietDay.meals.find((entry) => entry.type === mealType);
    if (!meal) {
      throw new NotFoundException(`Meal "${mealType}" was not found on day ${dayNumber}.`);
    }

    meal.completedAt = new Date();
    if (plan.days.every((day) => day.meals.every((entry) => !!entry.completedAt))) {
      plan.status = DietPlanStatus.COMPLETED;
    }

    await plan.save();
    return this.serializePlan(plan);
  }

  private async findOwnedPlan(userId: string, planId: string) {
    const plan = await this.dietPlanModel.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    });

    if (!plan) {
      throw new NotFoundException('Diet plan not found.');
    }

    return plan;
  }

  private async deactivateActivePlans(userId: string) {
    await this.dietPlanModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: DietPlanStatus.ACTIVE,
      },
      { status: DietPlanStatus.ARCHIVED },
    );
  }

  private serializePlan(plan: DietPlanDocument) {
    return {
      id: plan.id,
      userId: plan.userId.toString(),
      title: plan.title,
      goal: plan.goal,
      preference: plan.preference,
      targetCalories: plan.targetCalories,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      isAiGenerated: plan.isAiGenerated,
      notes: plan.notes,
      progress: {
        completedMeals: plan.days.reduce(
          (sum, day) => sum + day.meals.filter((meal) => !!meal.completedAt).length,
          0,
        ),
        totalMeals: plan.days.reduce((sum, day) => sum + day.meals.length, 0),
      },
      days: plan.days,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private serializeLeanPlan(
    plan: DietPlan & {
      _id: Types.ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    return {
      id: plan._id.toString(),
      userId: plan.userId.toString(),
      title: plan.title,
      goal: plan.goal,
      preference: plan.preference,
      targetCalories: plan.targetCalories,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      isAiGenerated: plan.isAiGenerated,
      notes: plan.notes,
      progress: {
        completedMeals: plan.days.reduce(
          (sum, day) => sum + day.meals.filter((meal) => !!meal.completedAt).length,
          0,
        ),
        totalMeals: plan.days.reduce((sum, day) => sum + day.meals.length, 0),
      },
      days: plan.days,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
