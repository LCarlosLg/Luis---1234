//Aquí se agrega la configuración de Express y los middlewares que se van a usar en todas las rutas.

import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors()); // deja que el frontend (puerto 5173) nos llame
app.use(express.json()); // convierte el cuerpo JSON en req.body

app.use("/api", apiRouter);

app.use(notFound); // cualquier ruta que no exista termina aquí
app.use(errorHandler); // siempre al final