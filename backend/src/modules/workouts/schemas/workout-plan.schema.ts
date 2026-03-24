import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkoutPlanDocument = HydratedDocument<WorkoutPlan>;

export enum WorkoutPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
export class WorkoutExercise {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  muscleGroup?: string;

  @Prop({ required: true })
  sets!: number;

  @Prop({ required: true })
  reps!: string;

  @Prop()
  restSeconds?: number;

  @Prop()
  equipment?: string;

  @Prop()
  notes?: string;
}

const WorkoutExerciseSchema = SchemaFactory.createForClass(WorkoutExercise);

@Schema({ _id: false })
export class WorkoutDay {
  @Prop({ required: true })
  dayNumber!: number;

  @Prop({ required: true })
  dayLabel!: string;

  @Prop({ required: true })
  focus!: string;

  @Prop()
  durationMinutes?: number;

  @Prop({ type: [WorkoutExerciseSchema], required: true })
  exercises!: WorkoutExercise[];

  @Prop()
  completedAt?: Date;
}

const WorkoutDaySchema = SchemaFactory.createForClass(WorkoutDay);

@Schema({ timestamps: true, collection: 'workout_plans' })
export class WorkoutPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  goal!: string;

  @Prop({ required: true })
  level!: string;

  @Prop({ type: [String], default: [] })
  equipment!: string[];

  @Prop({ type: [WorkoutDaySchema], required: true })
  days!: WorkoutDay[];

  @Prop({ enum: Object.values(WorkoutPlanStatus), default: WorkoutPlanStatus.DRAFT })
  status!: WorkoutPlanStatus;

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

export const WorkoutPlanSchema = SchemaFactory.createForClass(WorkoutPlan);
