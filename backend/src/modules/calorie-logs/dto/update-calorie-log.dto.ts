import { PartialType } from '@nestjs/swagger';

import { CreateCalorieLogDto } from './create-calorie-log.dto';

export class UpdateCalorieLogDto extends PartialType(CreateCalorieLogDto) {}
