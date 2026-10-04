// Unico punto donde el forntend se comunica con el backend. Este cliente de API se encarga de hacer las peticiones y manejar los errores de red, timeout y de la API. Nunca lanza un error por un rechazo de la API, solo por problemas de red o timeout.

export type ApiErrorkind = "validation" | "timeout" | "network" | "server";

export class ApiError extends Error {
  kind: ApiErrorkind;
  status?: number;
  details?: unknown;

  constructor(kind: ApiErrorkind, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export interface RawResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

//Hace la peticiíon y devuelve el status y el body. Nunca lanza un error por un rechazo de la API, solo por problemas de red o timeout.
export async function requestRaw(
  path: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<RawResponse> {
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
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("timeout", "No pudimos confirmar la respuesta del servidor, intenta de nuevo más tarde");
    }
    throw new ApiError("network", "No pudimos comunicarnos con el servidor, intenta de nuevo más tarde");
  }finally{
    clearTimeout(timer);
  }

  const body = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, body };
}

// Endpoint de la API que devuelve un JSON con el status y el body. Lanza un ApiError si la respuesta es un rechazo (status >= 400). Nunca lanza un error por problemas de red o timeout, esos se manejan en requestRaw.
export async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 5000): Promise<T> {
  const res = await requestRaw(path, options, timeoutMs);
  if (!res.ok) {
    const err = (res.body as { error?: { message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(
      res.status === 400 ? "validation" : "server",
      err?.message ?? "Ocurrió un error inesperado en el servidor.",
      res.status,
      err?.details
    );
  }
  return res.body as T;
}