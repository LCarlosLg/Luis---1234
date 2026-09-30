// Ruta de cobros de SnailPay, que recibe la petición del frontend, valida el body y llama al controlador, el monto se debe de ingresar en entero entre 50 y 10000, estos limites los coloque a mi gusto.

import {Router} from "express";
import {z} from "zod";
import {validateBody} from "../middlewares/validate";
import {createCharge} from "../controllers/snailpay.controller";    

const chargeSchema = z.object({
    amount: z.number().int().min(50).max(10000),
    simulate: z.enum(["approved", "declined", "unavailable", "timeout"]).optional(),
});

export const snailpayRouter = Router();
snailpayRouter.post("/charges", validateBody(chargeSchema), createCharge);