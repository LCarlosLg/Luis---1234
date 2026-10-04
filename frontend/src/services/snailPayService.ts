// Pide al backend que cargue saldo a través de SnailPay.
import { ApiError, requestRaw } from "./apiClient";

// Lo que enviamos: tarjeta, monto y el usuario que recarga.
export interface ChargeRequest {
  payer_id: string;
  payer_email: string;
  card_number: string;
  expiration_date: string;
  cvv: string;
  card_holder: string;
  transaction_amount: number;
}

export type SnailPayStatus = "approved" | "rejected" | "error";

// Respuesta de SnailPay, es la misma forma para aprobado, rechazo y error.
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
  errors?: { field: string; message: string }[];
}

function isSnailPayResponse(b: unknown): b is SnailPayResponse {
  return typeof b === "object" && b !== null && "id" in b && "status" in b && "status_detail" in b;
}

// Devuelve la respuesta de SnailPay sea cual sea el resultado. Solo lanza ApiError si no hubo respuesta (sin conexión o timeout) o si llegó algo que no reconocemos. Así nunca damos por buena una operación que no lo es.
export async function chargeSnailPay(
  data: ChargeRequest,
  options: { simulateSystemError?: boolean } = {}
): Promise<SnailPayResponse> {
  const res = await requestRaw("/snailpay/charges", {
    method: "POST",
    body: JSON.stringify(data),
    // Header que le pide al backend simular que SnailPay está caído.
    headers: options.simulateSystemError ? { "X-SnailPay-Simulate": "system_error" } : {},
  });

  if (!isSnailPayResponse(res.body)) {
    throw new ApiError("server", "SnailPay respondió algo inesperado. Tu saldo no se modificó.", res.status);
  }
  // Un "aprobado" solo vale si además el HTTP fue exitoso.
  if (res.body.status === "approved" && !res.ok) {
    throw new ApiError("server", "Respuesta inconsistente de SnailPay. Tu saldo no se modificó.", res.status);
  }
  return res.body;
}