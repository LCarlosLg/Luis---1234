// Ruta de cobros de SnailPay, que recibe la petición del frontend y llama al controlador para procesarla. Si hay un error, lo pasa al middleware de errores para que lo maneje.

import {Router} from "express";
import {createCharge} from "../controllers/snailpay.controller";

export const snailpayRouter = Router();
snailpayRouter.post("/charges", createCharge);