import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Role } from 'src/common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserProfile {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  age?: number;

  @Prop()
  gender?: string;

  @Prop()
  heightCm?: number;

  @Prop()
  weightKg?: number;

  @Prop()
  goal?: string;

  @Prop()
  activityLevel?: string;
}

const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: [String], enum: Object.values(Role), default: [Role.USER] })
  roles!: Role[];

  @Prop({ type: UserProfileSchema, required: true })
  profile!: UserProfile;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ select: false })
  emailVerificationOtpHash?: string;

  @Prop({ select: false })
  emailVerificationOtpExpiresAt?: Date;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop()
  emailVerificationSentAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
