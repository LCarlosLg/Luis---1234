import {NextFunction, Request, Response} from "express";
import {AppError} from "../errors/AppError";

// Las rutas que no existen caen en este middleware, que lanza un error 404. Luego el middleware de errores lo maneja y devuelve un mensaje al cliente.
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {

  // Errores que lanzamos nosotros mismos desde cualquier parte de la app.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Llegó un JSON roto en el body.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "El cuerpo de la petición no es JSON válido" },
    });
  }

  // Cualquier otra cosa es un error interno del servidor. Lo logueamos y devolvemos un mensaje genérico al cliente.
  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
  });
}