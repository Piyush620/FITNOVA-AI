import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PREMIUM_KEY = 'requiresPremium';
export const Premium = () => SetMetadata(REQUIRES_PREMIUM_KEY, true);
