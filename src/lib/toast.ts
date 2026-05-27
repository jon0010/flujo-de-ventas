import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

export function toastApiError(error: unknown, fallback = "Ocurrió un error") {
  const message =
    error instanceof Error ? error.message : fallback;
  toast.error(message);
}
