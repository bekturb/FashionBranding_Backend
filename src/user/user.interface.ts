import { UserRole } from './enum/role.enum';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  isEmailConfirmed: boolean,
  role: UserRole;
}
