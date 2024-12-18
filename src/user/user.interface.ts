import { UserRole } from './enum/role.enum';

export interface IAdminPosition {
  password: string;
  role: UserRole;
}

export interface IUser extends IAdminPosition {
  _id: string;
  username: string;
  email: string;
  image: string;
  password: string;
  isEmailConfirmed: boolean;
  role: UserRole;
}
