import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../auth/schemas/user.schema';
import { DietPlan } from '../diet/schemas/diet-plan.schema';
import { ProgressCheckIn } from '../progress/schemas/progress-check-in.schema';
import { WorkoutPlan } from '../workouts/schemas/workout-plan.schema';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockWorkoutPlanModel: any;
  let mockDietPlanModel: any;
  let mockProgressCheckInModel: any;

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
    };
    mockWorkoutPlanModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockDietPlanModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockProgressCheckInModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(WorkoutPlan.name),
          useValue: mockWorkoutPlanModel,
        },
        {
          provide: getModelToken(DietPlan.name),
          useValue: mockDietPlanModel,
        },
        {
          provide: getModelToken(ProgressCheckIn.name),
          useValue: mockProgressCheckInModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('returns the current user profile payload', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: { toString: () => userId },
        email: 'test@example.com',
        roles: ['user'],
        profile: {
          fullName: 'Test User',
          heightCm: 180,
          weightKg: 80,
        },
        lastLoginAt: new Date('2026-03-20T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      };

      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.getCurrentUser(userId);

      expect(result).toEqual({
        id: userId,
        email: mockUser.email,
        roles: mockUser.roles,
        profile: mockUser.profile,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('throws when the user is missing', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getCurrentUser('507f1f77bcf86cd799439011')).rejects.toThrow('User not found.');
    });
  });

  describe('updateCurrentUser', () => {
    it('updates profile fields and returns the refreshed user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const payload: UpdateUserProfileDto = {
        fullName: 'Updated User',
        heightCm: 185,
        weightKg: 85,
      };

      const save = jest.fn().mockResolvedValue(undefined);
      const existingUser = {
        profile: {
          fullName: 'Original User',
          goal: 'fat loss',
        },
        save,
      };

      mockUserModel.findById
        .mockResolvedValueOnce(existingUser)
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue({
            _id: { toString: () => userId },
            email: 'test@example.com',
            roles: ['user'],
            profile: {
              fullName: 'Updated User',
              goal: 'fat loss',
              heightCm: 185,
              weightKg: 85,
            },
            lastLoginAt: null,
            createdAt: undefined,
            updatedAt: undefined,
          }),
        });

      const result = await service.updateCurrentUser(userId, payload);

      expect(existingUser.profile).toEqual({
        fullName: 'Updated User',
        goal: 'fat loss',
        heightCm: 185,
        weightKg: 85,
      });
      expect(save).toHaveBeenCalled();
      expect(result.profile).toEqual(existingUser.profile);
    });
  });

  describe('getDashboardSnapshot', () => {
    it('returns a dashboard summary from related plan and progress data', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = {
        _id: { toString: () => userId },
        email: 'test@example.com',
        profile: {
          fullName: 'Test User',
          weightKg: 80,
          goal: 'fat loss',
          activityLevel: 'moderate',
        },
      };

      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(user),
      });

      mockWorkoutPlanModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'workout-plan-id' },
          title: 'Spring Cut',
          status: 'active',
        }),
      });
      mockDietPlanModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'diet-plan-id' },
          title: 'High Protein Plan',
          status: 'active',
          targetCalories: 2100,
        }),
      });
      mockWorkoutPlanModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            days: [
              { completedAt: new Date('2026-03-22T00:00:00.000Z') },
              { completedAt: null },
            ],
          },
        ]),
      });
      mockDietPlanModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            days: [
              {
                meals: [
                  { completedAt: new Date('2026-03-22T00:00:00.000Z') },
                  { completedAt: null },
                ],
              },
            ],
          },
        ]),
      });
      mockProgressCheckInModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              weightKg: 79,
              energyLevel: 8,
              moodScore: 7,
              sleepQuality: 6,
            },
            {
              weightKg: 82,
            },
          ]),
        }),
      });

      const result = await service.getDashboardSnapshot(userId);

      expect(result.greeting).toBe('Welcome back, Test');
      expect(result.currentWeight).toBe(79);
      expect(result.targetWeight).toBe(73);
      expect(result.completedWorkoutsThisWeek).toBe(1);
      expect(result.completedMeals).toBe(1);
      expect(result.totalMeals).toBe(2);
      expect(result.activeWorkoutPlan).toEqual({
        id: 'workout-plan-id',
        title: 'Spring Cut',
        status: 'active',
      });
      expect(result.activeDietPlan).toEqual({
        id: 'diet-plan-id',
        title: 'High Protein Plan',
        status: 'active',
      });
    });
  });
});
