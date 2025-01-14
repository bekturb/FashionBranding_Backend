import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import { HttpException } from '../exceptions/http.exception';

export function validationMiddleware<T>(type: any, fileFields: string[] = []): RequestHandler {
  return (req, res, next) => {

    const dtoInstance = plainToInstance(type, {
      ...req.body,
      ...fileFields.reduce((acc, field) => {
        acc[field] = req.files?.[field];
        return acc;
      }, {}),
    });

    validate(plainToInstance(type, dtoInstance)).then((errors: ValidationError[]) => {
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
