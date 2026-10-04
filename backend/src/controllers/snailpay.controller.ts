//El controlador de SnailPay. Recibe la petición del frontend, llama al servicio y devuelve la respuesta. Si hay un error, lo pasa al middleware de errores para que lo maneje.

import {NextFunction, Request, Response} from "express";
import {processCharge} from "../services/snailpay.service";

// POST api/snailpay/charge -> Este recibe la petición del frontend para cargar un monto
export async function createCharge(req: Request, res: Response, next: NextFunction) {
  try {
    // Dos formas de simular que SnailPay tiene un problema interno: por la cabecera x-snailpay-simulate o por la variable de entorno SNAILPAY_DOWN. Esto es para poder testear el manejo de errores del frontend y del backend.
    const forceSystemError =
      req.header("x-snailpay-simulate") === "system_error" || process.env.SNAILPAY_DOWN === "true";

    const { httpStatus, body } = await processCharge(req.body, { forceSystemError });
    res.status(httpStatus).json(body);
  } catch (err) {
    next(err); // un fallo inesperado lo maneja el errorHandler
  }
}