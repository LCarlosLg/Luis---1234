//El controlador de SnailPay. Recibe la petición del frontend, llama al servicio y devuelve la respuesta. Si hay un error, lo pasa al middleware de errores para que lo maneje.

import {NextFunction, Request, Response} from "express";
import {charge} from "../services/snailpay.service";

//POST /charge
export async function createCharge(req: Request, res: Response, next: NextFunction) {
    try{ 
        const {amount, simulate} = req.body;
        //'simulate' solo se puede usar en desarrollo para forzar un resultado; de otra forma en produccion se ignora y el resultado es aleatorio.
        const result = await charge({amount, simulate: process.env.NODE_ENV === "production" ?  undefined : simulate,});
        res.status(201).json(result);
    } catch (err) {
        next(err); // El errorHandler se encarga de convertirlo en respuesta.
    }
}