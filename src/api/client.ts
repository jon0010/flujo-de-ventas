const API_BASE = "/api";

const RETRY_STATUSES = new Set([502, 503, 504]);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 350;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function friendlyMessage(status: number, raw: string) {
  if (status === 502 || status === 503 || status === 504) {
    return "El servidor está ocupado guardando. Se reintentará automáticamente.";
  }
  if (raw && !raw.startsWith("<")) return raw;
  return status === 404 ? "No encontrado" : "Error del servidor";
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new ApiError(
          friendlyMessage(res.status, text || res.statusText),
          res.status,
        );
        if (RETRY_STATUSES.has(res.status) && attempt < RETRY_ATTEMPTS - 1) {
          lastError = err;
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw err;
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } catch (e) {
      if (e instanceof ApiError) {
        if (RETRY_STATUSES.has(e.status) && attempt < RETRY_ATTEMPTS - 1) {
          lastError = e;
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw e;
      }
      const networkErr = new ApiError(
        "No se pudo conectar con el servidor.",
        0,
      );
      if (attempt < RETRY_ATTEMPTS - 1) {
        lastError = networkErr;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw networkErr;
    }
  }

  throw lastError ?? new ApiError("Error del servidor", 500);
}
