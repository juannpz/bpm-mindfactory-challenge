"use client";

import { useState, useCallback } from "react";
import api from "@/services/api";

export type WorkflowAction =
  | "ingresar"
  | "tomar"
  | "asignar"
  | "derivar"
  | "observar"
  | "responder-observacion"
  | "solicitar-intervencion-externa"
  | "responder-intervencion-externa"
  | "aprobar"
  | "rechazar"
  | "cerrar"
  | "cancelar";

export function useWorkflowAction(tramiteId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (action: WorkflowAction, payload?: Record<string, unknown>) => {
      if (!tramiteId) return null;
      setLoading(true);
      setError(null);
      try {
        const res = await api.post(`/tramites/${tramiteId}/${action}`, payload || {});
        return res.data;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          `Error en acción ${action}`;
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [tramiteId],
  );

  return { execute, loading, error };
}
