export function getErrorMessage(e: unknown, fallback = "Error inesperado"): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  const axiosErr = e as { response?: { data?: { message?: string | string[] } } };
  if (axiosErr?.response?.data?.message) {
    const msg = axiosErr.response.data.message;
    return Array.isArray(msg) ? msg.join(", ") : msg;
  }
  return fallback;
}
