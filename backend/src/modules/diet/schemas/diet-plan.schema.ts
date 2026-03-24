import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DietPlanDocument = HydratedDocument<DietPlan>;

export enum DietPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
export class MealEntry {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  items!: string[];

  @Prop()
  calories?: number;

  @Prop()
  proteinGrams?: number;

  @Prop()
  carbsGrams?: number;

  @Prop()
  fatsGrams?: number;

  @Prop()
  completedAt?: Date;
}

const MealEntrySchema = SchemaFactory.createForClass(MealEntry);

@Schema({ _id: false })
export class DietDay {
  @Prop({ required: true })
  dayNumber!: number;

  @Prop({ required: true })
  dayLabel!: string;

  @Prop()
  theme?: string;

  @Prop({ type: [MealEntrySchema], required: true })
  meals!: MealEntry[];

  @Prop()
  targetCalories?: number;
}

const DietDaySchema = SchemaFactory.createForClass(DietDay);

@Schema({ timestamps: true, collection: 'diet_plans' })
export class DietPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  goal!: string;

  @Prop({ required: true })
  preference!: string;

  @Prop()
  targetCalories?: number;

  @Prop({ type: [DietDaySchema], required: true })
  days!: DietDay[];

  @Prop({ enum: Object.values(DietPlanStatus), default: DietPlanStatus.DRAFT })
  status!: DietPlanStatus;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: false })
  isAiGenerated!: boolean;

  @Prop()
  notes?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const DietPlanSchema = SchemaFactory.createForClass(DietPlan);
