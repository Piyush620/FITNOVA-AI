import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { CreateCheckInDto } from './dto/create-check-in.dto';
import {
  ProgressCheckIn,
  ProgressCheckInDocument,
} from './schemas/progress-check-in.schema';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(ProgressCheckIn.name)
    private readonly progressCheckInModel: Model<ProgressCheckInDocument>,
  ) {}

  async createCheckIn(userId: string, payload: CreateCheckInDto) {
    const checkIn = await this.progressCheckInModel.create({
      userId: new Types.ObjectId(userId),
      ...payload,
    });

    return this.serializeCheckIn(checkIn);
  }

  async getHistory(userId: string, pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [history, total] = await Promise.all([
      this.progressCheckInModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.progressCheckInModel.countDocuments(filter),
    ]);

    return {
      items: history.map((entry) => this.serializeLeanCheckIn(entry)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getSummary(userId: string) {
    const history = await this.progressCheckInModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    if (history.length === 0) {
      throw new NotFoundException('No progress check-ins found for this user.');
    }

    const latest = history[0];
    const earliest = history[history.length - 1];

    return {
      totalCheckIns: history.length,
      latestCheckInDate: latest.createdAt,
      latestWeightKg: latest.weightKg ?? null,
      startingWeightKg: earliest.weightKg ?? null,
      weightChangeKg:
        latest.weightKg !== undefined && earliest.weightKg !== undefined
          ? Number((latest.weightKg - earliest.weightKg).toFixed(1))
          : null,
      latestMeasurements: {
        waistCm: latest.waistCm ?? null,
        chestCm: latest.chestCm ?? null,
        armCm: latest.armCm ?? null,
        thighCm: latest.thighCm ?? null,
      },
      averages: {
        energyLevel: this.average(history.map((entry) => entry.energyLevel)),
        sleepQuality: this.average(history.map((entry) => entry.sleepQuality)),
        moodScore: this.average(history.map((entry) => entry.moodScore)),
      },
    };
  }

  private average(values: Array<number | undefined>) {
    const definedValues = values.filter((value): value is number => value !== undefined);
    if (definedValues.length === 0) {
      return null;
    }

    const sum = definedValues.reduce((accumulator, value) => accumulator + value, 0);
    return Number((sum / definedValues.length).toFixed(1));
  }

  private serializeCheckIn(checkIn: ProgressCheckInDocument) {
    return {
      id: checkIn.id,
      userId: checkIn.userId.toString(),
      weightKg: checkIn.weightKg,
      waistCm: checkIn.waistCm,
      chestCm: checkIn.chestCm,
      armCm: checkIn.armCm,
      thighCm: checkIn.thighCm,
      energyLevel: checkIn.energyLevel,
      sleepQuality: checkIn.sleepQuality,
      moodScore: checkIn.moodScore,
      notes: checkIn.notes,
      createdAt: checkIn.createdAt,
      updatedAt: checkIn.updatedAt,
    };
  }

  private serializeLeanCheckIn(
    checkIn: ProgressCheckIn & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date },
  ) {
    return {
      id: checkIn._id.toString(),
      userId: checkIn.userId.toString(),
      weightKg: checkIn.weightKg,
      waistCm: checkIn.waistCm,
      chestCm: checkIn.chestCm,
      armCm: checkIn.armCm,
      thighCm: checkIn.thighCm,
      energyLevel: checkIn.energyLevel,
      sleepQuality: checkIn.sleepQuality,
      moodScore: checkIn.moodScore,
      notes: checkIn.notes,
      createdAt: checkIn.createdAt,
      updatedAt: checkIn.updatedAt,
    };
  }
}
