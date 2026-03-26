import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import {
  WorkoutPlan,
  WorkoutPlanDocument,
  WorkoutPlanStatus,
} from './schemas/workout-plan.schema';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel(WorkoutPlan.name)
    private readonly workoutPlanModel: Model<WorkoutPlanDocument>,
  ) {}

  async createPlan(userId: string, payload: CreateWorkoutPlanDto) {
    const shouldActivate = payload.activateNow ?? true;
    if (shouldActivate) {
      await this.deactivateActivePlans(userId);
    }

    const plan = await this.workoutPlanModel.create({
      userId: new Types.ObjectId(userId),
      title: payload.title,
      goal: payload.goal,
      level: payload.level,
      equipment: payload.equipment ?? [],
      days: payload.days
        .slice()
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => ({
          ...day,
          completedAt: undefined,
        })),
      status: shouldActivate ? WorkoutPlanStatus.ACTIVE : WorkoutPlanStatus.DRAFT,
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
      this.workoutPlanModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.workoutPlanModel.countDocuments(filter),
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
    const plan = await this.workoutPlanModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: WorkoutPlanStatus.ACTIVE,
      })
      .lean();

    if (!plan) {
      throw new NotFoundException('No active workout plan found.');
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
    plan.status = WorkoutPlanStatus.ACTIVE;
    await plan.save();

    return this.serializePlan(plan);
  }

  async restartPlan(userId: string, planId: string) {
    const sourcePlan = await this.findOwnedPlan(userId, planId);
    await this.deactivateActivePlans(userId);

    sourcePlan.status = WorkoutPlanStatus.ARCHIVED;
    await sourcePlan.save();

    const restartedPlan = await this.workoutPlanModel.create({
      userId: sourcePlan.userId,
      title: `${sourcePlan.title} Restart`,
      goal: sourcePlan.goal,
      level: sourcePlan.level,
      equipment: sourcePlan.equipment,
      days: sourcePlan.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        focus: day.focus,
        durationMinutes: day.durationMinutes,
        exercises: day.exercises.map((exercise) => ({
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          equipment: exercise.equipment,
          notes: exercise.notes,
        })),
        completedAt: undefined,
      })),
      status: WorkoutPlanStatus.ACTIVE,
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

  async completeSession(userId: string, planId: string, dayNumber: number) {
    const plan = await this.findOwnedPlan(userId, planId);
    const workoutDay = plan.days.find((day) => day.dayNumber === dayNumber);

    if (!workoutDay) {
      throw new NotFoundException(`Workout day ${dayNumber} was not found in this plan.`);
    }

    workoutDay.completedAt = new Date();
    if (plan.days.every((day) => !!day.completedAt)) {
      plan.status = WorkoutPlanStatus.COMPLETED;
    }

    await plan.save();

    return this.serializePlan(plan);
  }

  private async findOwnedPlan(userId: string, planId: string) {
    const plan = await this.workoutPlanModel.findOne({
      _id: new Types.ObjectId(planId),
      userId: new Types.ObjectId(userId),
    });

    if (!plan) {
      throw new NotFoundException('Workout plan not found.');
    }

    return plan;
  }

  private async deactivateActivePlans(userId: string) {
    await this.workoutPlanModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: WorkoutPlanStatus.ACTIVE,
      },
      { status: WorkoutPlanStatus.ARCHIVED },
    );
  }

  private serializePlan(plan: WorkoutPlanDocument) {
    return {
      id: plan.id,
      userId: plan.userId.toString(),
      title: plan.title,
      goal: plan.goal,
      level: plan.level,
      equipment: plan.equipment,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      isAiGenerated: plan.isAiGenerated,
      notes: plan.notes,
      progress: {
        completedDays: plan.days.filter((day) => !!day.completedAt).length,
        totalDays: plan.days.length,
      },
      days: plan.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        focus: day.focus,
        durationMinutes: day.durationMinutes,
        completedAt: day.completedAt,
        exercises: day.exercises,
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private serializeLeanPlan(
    plan: WorkoutPlan & {
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
      level: plan.level,
      equipment: plan.equipment,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      isAiGenerated: plan.isAiGenerated,
      notes: plan.notes,
      progress: {
        completedDays: plan.days.filter((day) => !!day.completedAt).length,
        totalDays: plan.days.length,
      },
      days: plan.days,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
