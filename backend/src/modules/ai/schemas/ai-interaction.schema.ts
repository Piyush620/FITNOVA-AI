import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiInteractionDocument = HydratedDocument<AiInteraction>;

export enum AiInteractionType {
  WORKOUT_PLAN = 'workout-plan',
  DIET_PLAN = 'diet-plan',
  COACH_CHAT = 'coach-chat',
}

@Schema({ timestamps: true, collection: 'ai_interactions' })
export class AiInteraction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: Object.values(AiInteractionType), required: true })
  type!: AiInteractionType;

  @Prop({ required: true })
  provider!: string;

  @Prop({ required: true })
  model!: string;

  @Prop({ type: Object, required: true })
  promptPayload!: Record<string, unknown>;

  @Prop({ required: true })
  outputText!: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const AiInteractionSchema = SchemaFactory.createForClass(AiInteraction);
