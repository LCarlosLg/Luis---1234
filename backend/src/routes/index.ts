// Aquí se definen las rutas de la API. Se separa de app.ts para que sea más fácil de testear y mantener.

//GET api/health -> Este comprueba de que el backend esta vivo
// POST api/snailpay/charge -> Este recibe la petición del frontend para cargar un monto

import {Router} from "express";
import {snailpayRouter} from "./snailpay.routes";

export const apiRouter = Router();  

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
apiRouter.use("/snailpay", snailpayRouter);  