// Servicio para simular la api de snailpay, no hace ningun cargo real, solo devuelve respuestas simuladas para poder testear el frontend y el backend sin depender de la api real de snailpay.

import { randomInt, randomUUID } from "node:crypto";

const TEST_CARD = { number: "1234123412341234", expiry: "12/26", cvv: "543" };
const DECLINED_CARD = "4000000000000002";
const MAX_AMOUNT = 1_000_000; // tope mío para protegernos de montos absurdos
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type SnailPayStatus = "approved" | "rejected" | "error";

export interface FieldError {
  field: string;
  message: string;
}

// Respuesta de la api snailpay con campos definidos.
export interface SnailPayResponse {
  id: string;
  status: SnailPayStatus;
  status_detail: string;
  transaction_amount: number | null;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string | null;
  payer_email: string | null;
  card_number: string | null;
  cvv: string | null;
  errors?: FieldError[]; // solo cuando status_detail es "invalid_data"
}

export interface ChargeOutcome {
  httpStatus: number;
  body: SnailPayResponse;
}

type Raw = Record<string, unknown>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

// Valida los campos de la peticion, devolviendo un arreglo de errores si no hay nunguno, o un arreglo vacío si todo está bien.
function validate(b: Raw): FieldError[] {
  const errors: FieldError[] = [];
  const add = (field: string, message: string) => errors.push({ field, message });

  if (!isText(b.payer_id)) add("payer_id", "Falta el identificador del usuario");
  if (!isText(b.payer_email) || !EMAIL_RE.test(b.payer_email.trim())) {
    add("payer_email", "El correo del usuario no es válido");
  }
  if (typeof b.card_number !== "string" || !/^\d{16}$/.test(b.card_number)) {
    add("card_number", "El número de tarjeta debe tener 16 dígitos");
  }
  if (typeof b.expiration_date !== "string" || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(b.expiration_date)) {
    add("expiration_date", "La fecha debe tener el formato MM/AA");
  }
  if (typeof b.cvv !== "string" || !/^\d{3}$/.test(b.cvv)) add("cvv", "El CVV debe tener 3 dígitos");
  if (!isText(b.card_holder)) add("card_holder", "Ingresa el nombre del titular");

  const n = b.transaction_amount;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    add("transaction_amount", "El monto debe ser mayor que cero");
  } else if (n > MAX_AMOUNT) {
    add("transaction_amount", "El monto es demasiado alto");
  } else if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
    add("transaction_amount", "Usa como máximo dos decimales");
  }
  return errors;
}

// Esta función simula el procesamiento de un cargo en la API de SnailPay. Devuelve un objeto con el estado del cargo y los detalles correspondientes.
export async function processCharge(
  raw: unknown,
  options: { forceSystemError: boolean }
): Promise<ChargeOutcome> {
  const b: Raw = raw && typeof raw === "object" ? (raw as Raw) : {};
  const text = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : null);

  // Se hace un "echo" de los campos que nos interesan para poder devolverlos en la respuesta, aunque estén mal.
  const echo = {
    transaction_amount: typeof b.transaction_amount === "number" ? b.transaction_amount : null,
    payer_id: text("payer_id"),
    payer_email: text("payer_email"),
    card_number: text("card_number"),
    cvv: text("cvv"),
  };

  const respond = (
    httpStatus: number,
    status: SnailPayStatus,
    status_detail: string,
    extra: Partial<SnailPayResponse> = {}
  ): ChargeOutcome => ({
    httpStatus,
    body: {
      id: randomUUID(),
      status,
      status_detail,
      transaction_amount: echo.transaction_amount,
      date_created: new Date().toISOString(),
      authorization_code: null,
      reference: `SNL-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 10000)}`,
      payer_id: echo.payer_id,
      payer_email: echo.payer_email,
      card_number: echo.card_number,
      cvv: echo.cvv,
      ...extra,
    },
  });

  // Una pausa corta para que se alcance a ver el estado "Procesando...".
  await sleep(600);

  // Sistema caído: manda sobre todo lo demás y no se aprueba nada.
  if (options.forceSystemError) return respond(503, "error", "system_error");

  const errors = validate(b);
  if (errors.length > 0) return respond(400, "rejected", "invalid_data", { errors });

  if (b.card_number === DECLINED_CARD) return respond(402, "rejected", "card_declined");
  if (b.card_number !== TEST_CARD.number) return respond(402, "rejected", "card_not_supported");
  if (b.expiration_date !== TEST_CARD.expiry) return respond(402, "rejected", "invalid_expiry_date");
  if (b.cvv !== TEST_CARD.cvv) return respond(402, "rejected", "invalid_security_code");

  return respond(201, "approved", "accredited", {
    authorization_code: String(randomInt(100000, 1000000)),
  });
}