//Historial de operaciones de pago de SnailPay, se guarda en localStorage para poder mostrarle al usuario sus últimos pagos, aunque no haya conexión a internet, (solo se guardan los últimos 20).

import { readJSON, writeJSON } from "../utils/storage";
import type { SnailPayResponse } from "./snailPayService";

const MAX_ITEMS = 20;
const keyFor = (userId: string) => `caracoles:payments:${userId}`;

export function getPayments(userId: string): SnailPayResponse[] {
  return readJSON<SnailPayResponse[]>(keyFor(userId), []);
}

// Agrega la operación al inicio, recorta a las últimas 20 y devuelve la lista.
export function savePayment(userId: string, payment: SnailPayResponse): SnailPayResponse[] {
  const next = [payment, ...getPayments(userId)].slice(0, MAX_ITEMS);
  writeJSON(keyFor(userId), next);
  return next;
}