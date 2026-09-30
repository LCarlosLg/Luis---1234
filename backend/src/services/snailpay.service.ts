// Simulación de SnailPay, un servicio de pagos externo. Se usa para probar la integración con el frontend sin tener que depender de un servicio real.
import { randomUUID } from "node:crypto";
import { AppError } from "../errors/AppError";

export type Simulate = "approved" | "declined" | "unavailable" | "timeout";
type Rng = () => number;

export interface ChargeInput {
  amount: number;
  // Sirve para forzar un resultado concreto al probar con curl.
  simulate?: Simulate;
}

export interface ChargeResult {
  transactionId: string;
  amount: number;
  status: "approved";
  processedAt: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Elegira un resultado según los porcentajes. Recibe el generador aleatorio para poder forzar resultados en pruebas.
function pickOutcome(rng: Rng): Simulate {
  const r = rng();
  if (r < 0.7) return "approved";
  if (r < 0.85) return "declined";
  if (r < 0.95) return "unavailable";
  return "timeout";
}

// Procesa un cobro. Si sale aprobado devuelve la transacción; si no, lanza un AppError (402, 503 o 504) que el errorHandler convierte en respuesta.
export async function charge(
  input: ChargeInput,
  rng: Rng = Math.random,
  timeoutDelayMs = 8000
): Promise<ChargeResult> {
  const outcome = input.simulate ?? pickOutcome(rng);

  if (outcome === "declined") {
    throw new AppError(402, "PAYMENT_DECLINED", "SnailPay rechazó el pago. Inténtalo de nuevo más tarde.");
  }
  if (outcome === "unavailable") {
    throw new AppError(503, "SNAILPAY_UNAVAILABLE", "SnailPay no está disponible en este momento. Inténtalo en unos minutos.");
  }
  if (outcome === "timeout") {
    // Esperamos más de lo que aguanta el frontend (5 s) para que se corte allá.
    await sleep(timeoutDelayMs);
    throw new AppError(504, "GATEWAY_TIMEOUT", "SnailPay tardó demasiado en responder.");
  }

  // Una pausa corta para que se alcance a ver el estado "Procesando".
  await sleep(600);
  return {
    transactionId: randomUUID(),
    amount: input.amount,
    status: "approved",
    processedAt: new Date().toISOString(),
  };
}