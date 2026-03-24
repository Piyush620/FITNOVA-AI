import { Role } from 'src/common/enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}
