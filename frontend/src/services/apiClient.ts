// Único punto por donde el frontend habla con el backend.
// Su trabajo es traducir cada tipo de respuesta a un ApiError con un `kind`, para que la pantalla pueda mostrar un mensaje distinto según lo que pasó (pago rechazado, servicio caído, timeout, sin conexión, etc.).

export type ApiErrorKind =
  | "validation"
  | "payment_declined"
  | "unavailable"
  | "timeout"
  | "network"
  | "server";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  details?: unknown;

  constructor(kind: ApiErrorKind, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// Decide qué tipo de error es, mirando primero el código que manda el backend y, si no hay uno conocido, el status HTTP.
function kindFrom(status: number, code?: string): ApiErrorKind {
  if (code === "PAYMENT_DECLINED") return "payment_declined";
  if (code === "SNAILPAY_UNAVAILABLE") return "unavailable";
  if (code === "GATEWAY_TIMEOUT") return "timeout";
  if (status === 400) return "validation";
  return "server";
}

// Hace la petición y devuelve el JSON. Si el servidor tarda más de 5 s, la cortamos nosotros, para que la persona no se quede esperando.
export async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (err) {
    // Se acabó el tiempo. No sabemos si el pago se procesó, así que avisamos que el saldo no se tocó.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "timeout",
        "No pudimos confirmar el resultado a tiempo. Tu saldo no se modificó; inténtalo de nuevo."
      );
    }
    // Ni siquiera llegó al servidor (apagado, sin internet, etc.).
    throw new ApiError("network", "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  } finally {
    clearTimeout(timer);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const err = body?.error;
    throw new ApiError(
      kindFrom(response.status, err?.code),
      err?.message ?? "Ocurrió un error inesperado en el servidor.",
      response.status,
      err?.details
    );
  }
  return body as T;
}