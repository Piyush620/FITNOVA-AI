import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalorieLogDocument = HydratedDocument<CalorieLog>;

export const calorieMealTypes = [
  'breakfast',
  'mid-morning',
  'lunch',
  'evening-snack',
  'dinner',
  'post-workout',
  'other',
] as const;

export type CalorieMealType = (typeof calorieMealTypes)[number];
export const calorieLogSources = ['manual', 'ai'] as const;
export type CalorieLogSource = (typeof calorieLogSources)[number];

@Schema({ _id: false })
export class CalorieLogItem {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 120 })
  quantity?: string;

  @Prop({ min: 0 })
  estimatedCalories?: number;
}

const CalorieLogItemSchema = SchemaFactory.createForClass(CalorieLogItem);

@Schema({ timestamps: true, collection: 'calorie_logs' })
export class CalorieLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  loggedDate!: string;

  @Prop({ required: true, enum: calorieMealTypes })
  mealType!: CalorieMealType;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ enum: calorieLogSources, default: 'manual' })
  source!: CalorieLogSource;

  @Prop({ trim: true, maxlength: 1000 })
  rawInput?: string;

  @Prop({ required: true, min: 0 })
  calories!: number;

  @Prop({ min: 0 })
  proteinGrams?: number;

  @Prop({ min: 0 })
  carbsGrams?: number;

  @Prop({ min: 0 })
  fatsGrams?: number;

  @Prop({ trim: true, maxlength: 500 })
  notes?: string;

  @Prop({ min: 0, max: 1 })
  confidence?: number;

  @Prop({ type: [CalorieLogItemSchema], default: undefined })
  parsedItems?: CalorieLogItem[];

  createdAt?: Date;

  updatedAt?: Date;
}

export const CalorieLogSchema = SchemaFactory.createForClass(CalorieLog);
CalorieLogSchema.index({ userId: 1, loggedDate: -1 });
