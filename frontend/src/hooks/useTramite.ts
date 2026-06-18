"use client";

import { useState, useEffect, useCallback } from "react";
import type { TramiteDetail } from "@/lib/types";
import api from "@/services/api";
import { getErrorMessage } from "@/lib/error-utils";

export function useTramite(id: string | undefined) {
  const [data, setData] = useState<TramiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tramites/${id}`);
      setData(res.data);
    } catch (e: unknown) {
      const errStatus = (e as { response?: { status?: number } }).response?.status;
      if (errStatus === 404) setError("Trámite no encontrado");
      else if (errStatus === 403) setError("No autorizado");
      else
        setError(getErrorMessage(e, "Error al cargar el trámite") || "Error al cargar el trámite");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
