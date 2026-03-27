import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { resolveGoalCalorieTarget } from 'src/common/utils/calorie-target';
import { User, UserDocument } from 'src/modules/auth/schemas/user.schema';
import { DietPlan, DietPlanDocument } from 'src/modules/diet/schemas/diet-plan.schema';

import { CreateCalorieLogDto } from './dto/create-calorie-log.dto';
import { UpdateCalorieLogDto } from './dto/update-calorie-log.dto';
import {
  CalorieLog,
  CalorieLogDocument,
  type CalorieMealType,
} from './schemas/calorie-log.schema';

const mealOrder: Record<CalorieMealType, number> = {
  breakfast: 1,
  'mid-morning': 2,
  lunch: 3,
  'evening-snack': 4,
  dinner: 5,
  'post-workout': 6,
  other: 7,
};

@Injectable()
export class CalorieLogsService {
  constructor(
    @InjectModel(CalorieLog.name)
    private readonly calorieLogModel: Model<CalorieLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(DietPlan.name)
    private readonly dietPlanModel: Model<DietPlanDocument>,
  ) {}

  async createLog(userId: string, payload: CreateCalorieLogDto) {
    const log = await this.calorieLogModel.create({
      userId: new Types.ObjectId(userId),
      ...payload,
      source: payload.source ?? 'manual',
      loggedDate: this.normalizeDate(payload.loggedDate),
    });

    return this.serializeDocument(log);
  }

  async updateLog(userId: string, logId: string, payload: UpdateCalorieLogDto) {
    const log = await this.calorieLogModel.findOne({
      _id: new Types.ObjectId(logId),
      userId: new Types.ObjectId(userId),
    });

    if (!log) {
      throw new NotFoundException('Calorie log not found.');
    }

    if (payload.loggedDate) {
      log.loggedDate = this.normalizeDate(payload.loggedDate);
    }

    if (payload.mealType) {
      log.mealType = payload.mealType;
    }

    if (payload.title !== undefined) {
      log.title = payload.title;
    }

    if (payload.source) {
      log.source = payload.source;
    }

    if ('rawInput' in payload) {
      log.rawInput = payload.rawInput ?? undefined;
    }

    if (payload.calories !== undefined) {
      log.calories = payload.calories;
    }

    if ('proteinGrams' in payload) {
      log.proteinGrams = payload.proteinGrams ?? undefined;
    }

    if ('carbsGrams' in payload) {
      log.carbsGrams = payload.carbsGrams ?? undefined;
    }

    if ('fatsGrams' in payload) {
      log.fatsGrams = payload.fatsGrams ?? undefined;
    }

    if ('notes' in payload) {
      log.notes = payload.notes ?? undefined;
    }

    if ('confidence' in payload) {
      log.confidence = payload.confidence ?? undefined;
    }

    if ('parsedItems' in payload) {
      log.parsedItems = payload.parsedItems ?? undefined;
    }

    await log.save();
    return this.serializeDocument(log);
  }

  async deleteLog(userId: string, logId: string) {
    const result = await this.calorieLogModel.findOneAndDelete({
      _id: new Types.ObjectId(logId),
      userId: new Types.ObjectId(userId),
    });

    if (!result) {
      throw new NotFoundException('Calorie log not found.');
    }

    return { deleted: true, id: logId };
  }

  async getDailyLogs(userId: string, date?: string) {
    const normalizedDate = this.normalizeDate(date);
    const objectId = new Types.ObjectId(userId);
    const [logs, targetCalories] = await Promise.all([
      this.calorieLogModel.find({ userId: objectId, loggedDate: normalizedDate }).lean(),
      this.resolveTargetCalories(userId),
    ]);

    const sortedLogs = [...logs].sort(
      (a, b) =>
        mealOrder[a.mealType] - mealOrder[b.mealType] ||
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
    );

    const totals = this.calculateTotals(sortedLogs);

    return {
      date: normalizedDate,
      targetCalories,
      totals,
      entries: sortedLogs.map((entry) => this.serializeLean(entry)),
    };
  }

  async getMonthlySummary(userId: string, month?: string) {
    const normalizedMonth = this.normalizeMonth(month);
    const objectId = new Types.ObjectId(userId);
    const [user, targetCalories, logs] = await Promise.all([
      this.userModel.findById(userId).lean(),
      this.resolveTargetCalories(userId),
      this.calorieLogModel
        .find({
          userId: objectId,
          loggedDate: {
            $gte: `${normalizedMonth}-01`,
            $lte: `${normalizedMonth}-31`,
          },
        })
        .lean(),
    ]);

    const groupedByDate = new Map<string, Array<CalorieLog & { _id: Types.ObjectId }>>();
    for (const log of logs) {
      const existing = groupedByDate.get(log.loggedDate) ?? [];
      existing.push(log);
      groupedByDate.set(log.loggedDate, existing);
    }

    const dailyBreakdown = Array.from(groupedByDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([loggedDate, entries]) => {
        const totals = this.calculateTotals(entries);
        return {
          date: loggedDate,
          calories: totals.calories,
          proteinGrams: totals.proteinGrams,
          carbsGrams: totals.carbsGrams,
          fatsGrams: totals.fatsGrams,
          entryCount: entries.length,
        };
      });

    const totalCalories = dailyBreakdown.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = dailyBreakdown.reduce((sum, day) => sum + day.proteinGrams, 0);
    const totalCarbs = dailyBreakdown.reduce((sum, day) => sum + day.carbsGrams, 0);
    const totalFats = dailyBreakdown.reduce((sum, day) => sum + day.fatsGrams, 0);
    const daysLogged = dailyBreakdown.length;
    const daysInMonth = new Date(Number(`${normalizedMonth}-01`.slice(0, 4)), Number(normalizedMonth.slice(5, 7)), 0).getDate();
    const averageLoggedDayCalories =
      daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;
    const averageDailyCalories = Math.round(totalCalories / daysInMonth);
    const averageProteinGrams = daysLogged > 0 ? Number((totalProtein / daysLogged).toFixed(1)) : 0;
    const averageCarbsGrams = daysLogged > 0 ? Number((totalCarbs / daysLogged).toFixed(1)) : 0;
    const averageFatsGrams = daysLogged > 0 ? Number((totalFats / daysLogged).toFixed(1)) : 0;

    return {
      month: normalizedMonth,
      targetCalories,
      totalCalories,
      averageDailyCalories,
      averageLoggedDayCalories,
      averageProteinGrams,
      averageCarbsGrams,
      averageFatsGrams,
      daysLogged,
      daysInMonth,
      entriesCount: logs.length,
      dailyBreakdown,
      recommendations: this.buildRecommendations({
        goal: user?.profile?.goal,
        currentWeightKg: user?.profile?.weightKg,
        targetCalories,
        averageLoggedDayCalories,
        averageProteinGrams,
        daysLogged,
        daysInMonth,
      }),
    };
  }

  private calculateTotals(entries: Array<CalorieLog | (CalorieLog & { _id: Types.ObjectId })>) {
    return entries.reduce(
      (totals, entry) => ({
        calories: totals.calories + (entry.calories ?? 0),
        proteinGrams: totals.proteinGrams + (entry.proteinGrams ?? 0),
        carbsGrams: totals.carbsGrams + (entry.carbsGrams ?? 0),
        fatsGrams: totals.fatsGrams + (entry.fatsGrams ?? 0),
      }),
      {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatsGrams: 0,
      },
    );
  }

  private async resolveTargetCalories(userId: string) {
    const objectId = new Types.ObjectId(userId);
    const [user, activeDietPlan] = await Promise.all([
      this.userModel.findById(userId).lean(),
      this.dietPlanModel.findOne({ userId: objectId, status: 'active' }).lean(),
    ]);

    const dietTarget =
      activeDietPlan?.targetCalories ??
      activeDietPlan?.days?.find((day) => typeof day.targetCalories === 'number')?.targetCalories;

    return resolveGoalCalorieTarget(
      {
      age: user?.profile?.age,
      gender: user?.profile?.gender,
      heightCm: user?.profile?.heightCm,
      weightKg: user?.profile?.weightKg,
      activityLevel: user?.profile?.activityLevel,
      goal: user?.profile?.goal,
      },
      dietTarget,
    );
  }

  private buildRecommendations(input: {
    goal?: string;
    currentWeightKg?: number;
    targetCalories: number;
    averageLoggedDayCalories: number;
    averageProteinGrams: number;
    daysLogged: number;
    daysInMonth: number;
  }) {
    const recommendations: string[] = [];
    const goal = input.goal?.toLowerCase() ?? '';
    const calorieDelta = input.averageLoggedDayCalories - input.targetCalories;
    const targetProtein =
      input.currentWeightKg && input.currentWeightKg > 0
        ? Number(
            (
              input.currentWeightKg *
              (goal.includes('muscle') || goal.includes('gain') ? 1.8 : 1.4)
            ).toFixed(1),
          )
        : null;

    if (input.daysLogged < Math.max(10, Math.round(input.daysInMonth * 0.45))) {
      recommendations.push(
        'Log meals more consistently next month so your calorie trend reflects your real routine.',
      );
    }

    if (input.averageLoggedDayCalories === 0) {
      recommendations.push(
        'Start by logging your main meals each day. Even partial logging is enough to spot calorie drift.',
      );
      return recommendations;
    }

    if (goal.includes('fat') || goal.includes('loss')) {
      if (calorieDelta > 180) {
        recommendations.push(
          `Your average logged intake is about ${calorieDelta} kcal above target. Trim liquid calories or one dense snack from most days.`,
        );
      } else if (calorieDelta < -250) {
        recommendations.push(
          'Your intake is well below target. Bring calories up slightly so recovery and adherence do not fall off.',
        );
      } else {
        recommendations.push(
          'Your calorie intake is close to your fat-loss target. Keep meal timing and weekends as consistent as possible.',
        );
      }
    } else if (goal.includes('muscle') || goal.includes('gain')) {
      if (calorieDelta < -150) {
        recommendations.push(
          'You are eating below your gain target. Add one reliable protein-carb meal or shake on training days.',
        );
      } else {
        recommendations.push(
          'Your intake is in a workable range for muscle gain. Keep daily calories steady instead of stacking them on a few days.',
        );
      }
    } else {
      recommendations.push(
        'Stay close to your daily target and use this log to catch repeated under-eating or overeating patterns early.',
      );
    }

    if (targetProtein && input.averageProteinGrams > 0 && input.averageProteinGrams < targetProtein) {
      recommendations.push(
        `Average protein is low for your goal. Aim for roughly ${targetProtein} g per day by anchoring 2 to 3 meals with protein.`,
      );
    } else if (input.averageProteinGrams === 0) {
      recommendations.push(
        'Start filling in protein, carbs, and fats when you can. Monthly recommendations get much better with macro data.',
      );
    }

    return recommendations.slice(0, 3);
  }

  private normalizeDate(value?: string) {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
  }

  private normalizeMonth(value?: string) {
    if (value) {
      return value;
    }

    return new Date().toISOString().slice(0, 7);
  }

  private serializeDocument(log: CalorieLogDocument) {
    return {
      id: log.id,
      userId: log.userId.toString(),
      loggedDate: log.loggedDate,
      mealType: log.mealType,
      title: log.title,
      source: log.source,
      rawInput: log.rawInput,
      calories: log.calories,
      proteinGrams: log.proteinGrams,
      carbsGrams: log.carbsGrams,
      fatsGrams: log.fatsGrams,
      notes: log.notes,
      confidence: log.confidence,
      parsedItems: log.parsedItems,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }

  private serializeLean(log: CalorieLog & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }) {
    return {
      id: log._id.toString(),
      userId: log.userId.toString(),
      loggedDate: log.loggedDate,
      mealType: log.mealType,
      title: log.title,
      source: log.source,
      rawInput: log.rawInput,
      calories: log.calories,
      proteinGrams: log.proteinGrams,
      carbsGrams: log.carbsGrams,
      fatsGrams: log.fatsGrams,
      notes: log.notes,
      confidence: log.confidence,
      parsedItems: log.parsedItems,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}
