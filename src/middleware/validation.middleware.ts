import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import { HttpException } from '../exceptions/http.exception';

export function validationMiddleware<T>(type: any): RequestHandler {
  return (req, res, next) => {
    validate(plainToInstance(type, req.body)).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors
          .map((error: ValidationError) =>
            error.constraints ? Object.values(error.constraints).join(', ') : '',
          )
          .filter((msg) => msg !== '')
          .join(', ');
        next(new HttpException(400, message));
      } else {
        next();
      }
    });
  };
}
