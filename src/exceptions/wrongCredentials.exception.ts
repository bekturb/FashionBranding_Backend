import { HttpException } from './http.exception';

export class WrongCredentialsException extends HttpException {
  constructor() {
    super(401, 'Проверьте корректность введенных данных');
  }
}