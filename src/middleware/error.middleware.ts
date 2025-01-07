import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../exceptions/http.exception';

export function errorMiddleware(err: HttpException, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Неизвестная ошибка!';
  res.status(status).send({ status, message });
}
