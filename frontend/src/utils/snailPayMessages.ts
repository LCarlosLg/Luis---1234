// Convierte la respuesta técnica de SnailPay en un mensaje que se entienda.
import type { SnailPayResponse } from "../services/snailPayService";

const money = (n: number | null) =>
  (n ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

// Un texto por cada status_detail que puede devolver SnailPay.
const REJECTIONS: Record<string, string> = {
  invalid_data: "Hay datos del formulario que no son válidos. Revísalos e inténtalo de nuevo.",
  card_declined: "El banco emisor rechazó la tarjeta. Prueba con otra.",
  card_not_supported: "SnailPay no reconoce esta tarjeta. Revisa el número.",
  invalid_expiry_date: "La fecha de vencimiento no coincide con la tarjeta.",
  invalid_security_code: "El código de seguridad (CVV) es incorrecto.",
  system_error: "SnailPay tiene un problema interno y no puede procesar pagos ahora. No se hizo ningún cobro; inténtalo más tarde.",
};

export function describeResult(r: SnailPayResponse): string {
  if (r.status === "approved") {
    return `Operación aprobada: se cargaron ${money(r.transaction_amount)}. Código de autorización ${r.authorization_code}. Referencia ${r.reference}.`;
  }
  const reason = REJECTIONS[r.status_detail] ?? "SnailPay no pudo completar la operación.";
  return `${reason} Tu saldo no se modificó.`;
}