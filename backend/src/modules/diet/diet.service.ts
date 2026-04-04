import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CalorieLog, CalorieLogDocument } from 'src/modules/calorie-logs/schemas/calorie-log.schema';
import { resolvePlanDayByDate, resolveTargetDate } from 'src/common/utils/plan-schedule';

import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { DietPlan, DietPlanDocument, DietPlanStatus, MealEntry } from './schemas/diet-plan.schema';

@Injectable()
export class DietService {
  constructor(
    @InjectModel(DietPlan.name)
    private readonly dietPlanModel: Model<DietPlanDocument>,
    @InjectModel(CalorieLog.name)
    private readonly calorieLogModel: Model<CalorieLogDocument>,
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

  async listPlans(userId: string, pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [plans, total] = await Promise.all([
      this.dietPlanModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.dietPlanModel.countDocuments(filter),
    ]);

    return {
      items: plans.map((plan) => this.serializeLeanPlan(plan)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
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
    const hasProgress = plan.days.some((day) => day.meals.some((meal) => !!meal.completedAt));

    if (hasProgress) {
      plan.days.forEach((day) => {
        day.meals.forEach((meal) => {
          meal.completedAt = undefined;
        });
      });
      plan.startDate = new Date();
      plan.endDate = undefined;
    }

    plan.status = DietPlanStatus.ACTIVE;
    await plan.save();

    return this.serializePlan(plan);
  }

  async restartPlan(userId: string, planId: string) {
    const sourcePlan = await this.findOwnedPlan(userId, planId);
    await this.deactivateActivePlans(userId);

    sourcePlan.status = DietPlanStatus.ARCHIVED;
    await sourcePlan.save();

    const restartedPlan = await this.dietPlanModel.create({
      userId: sourcePlan.userId,
      title: `${sourcePlan.title} Restart`,
      goal: sourcePlan.goal,
      preference: sourcePlan.preference,
      targetCalories: sourcePlan.targetCalories,
      days: sourcePlan.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        theme: day.theme,
        targetCalories: day.targetCalories,
        meals: day.meals.map((meal) => ({
          type: meal.type,
          title: meal.title,
          description: meal.description,
          items: meal.items,
          calories: meal.calories,
          proteinGrams: meal.proteinGrams,
          carbsGrams: meal.carbsGrams,
          fatsGrams: meal.fatsGrams,
          completedAt: undefined,
        })),
      })),
      status: DietPlanStatus.ACTIVE,
      startDate: new Date(),
      endDate: undefined,
      isAiGenerated: sourcePlan.isAiGenerated,
      notes: sourcePlan.notes,
    });

    return this.serializePlan(restartedPlan);
  }

  async deletePlan(userId: string, planId: string) {
    const plan = await this.findOwnedPlan(userId, planId);
    await plan.deleteOne();

    return {
      deleted: true,
      id: planId,
    };
  }

  async completeMeal(
    userId: string,
    planId: string,
    dayNumber: number,
    mealType: string,
    completedDate?: string,
  ) {
    const plan = await this.findOwnedPlan(userId, planId);
    const targetDate = resolveTargetDate(completedDate);
    const scheduledDay = resolvePlanDayByDate(plan, targetDate);

    if (!scheduledDay || scheduledDay.dayNumber !== dayNumber) {
      throw new BadRequestException('The selected calendar date does not match this diet day.');
    }

    const dietDay = plan.days.find((day) => day.dayNumber === dayNumber);

    if (!dietDay) {
      throw new NotFoundException(`Diet day ${dayNumber} was not found in this plan.`);
    }

    const meal = dietDay.meals.find((entry) => entry.type === mealType);
    if (!meal) {
      throw new NotFoundException(`Meal "${mealType}" was not found on day ${dayNumber}.`);
    }

    meal.completedAt = targetDate;
    await this.syncCompletedMealToCalories(userId, meal, meal.completedAt);

    if (plan.days.every((day) => day.meals.every((entry) => !!entry.completedAt))) {
      plan.status = DietPlanStatus.COMPLETED;
    }

    await plan.save();
    return this.serializePlan(plan);
  }

  private async syncCompletedMealToCalories(
    userId: string,
    meal: MealEntry,
    completedAt: Date,
  ) {
    const loggedDate = completedAt.toISOString().slice(0, 10);
    const filter = {
      userId: new Types.ObjectId(userId),
      loggedDate,
      mealType: meal.type,
      source: 'diet-plan',
    };

    const existingLog = await this.calorieLogModel.findOne(filter);

    if (existingLog) {
      existingLog.title = meal.title;
      existingLog.calories = meal.calories ?? 0;
      existingLog.proteinGrams = meal.proteinGrams;
      existingLog.carbsGrams = meal.carbsGrams;
      existingLog.fatsGrams = meal.fatsGrams;
      existingLog.notes = meal.description;
      existingLog.rawInput = meal.items?.join(', ');
      await existingLog.save();
      return;
    }

    await this.calorieLogModel.create({
      ...filter,
      title: meal.title,
      calories: meal.calories ?? 0,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatsGrams: meal.fatsGrams,
      notes: meal.description,
      rawInput: meal.items?.join(', '),
    });
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
