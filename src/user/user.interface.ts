import { UserRole } from './enum/role.enum';

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}
