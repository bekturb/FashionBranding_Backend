import { HttpException } from './http.exception';

export class  UserWithThatEmailAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(400, `Пользователь с адресом электронной почты ${email} уже существует.`);
  }
}