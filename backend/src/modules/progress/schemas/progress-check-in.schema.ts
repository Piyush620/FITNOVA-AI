import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProgressCheckInDocument = HydratedDocument<ProgressCheckIn>;

@Schema({ timestamps: true, collection: 'progress_check_ins' })
export class ProgressCheckIn {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop()
  weightKg?: number;

  @Prop()
  waistCm?: number;

  @Prop()
  chestCm?: number;

  @Prop()
  armCm?: number;

  @Prop()
  thighCm?: number;

  @Prop()
  energyLevel?: number;

  @Prop()
  sleepQuality?: number;

  @Prop()
  moodScore?: number;

  @Prop()
  notes?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ProgressCheckInSchema = SchemaFactory.createForClass(ProgressCheckIn);
