//Revisa que el body de la request cumpla con el esquema definido en el schema. Si no cumple, lanza un error de validación.

import {NextFunction, Request, Response} from "express";
import {ZodType} from "zod";
import {AppError} from "../errors/AppError";

export const validateBody =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new AppError(400, "VALIDATION_ERROR", "Datos de entrada inválidos", details));
    }
    req.body = parsed.data;
    next();
  };