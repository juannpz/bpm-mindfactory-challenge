"use client";

import { useState, useEffect, useCallback } from "react";
import type { Movimiento } from "@/lib/types";
import api from "@/services/api";
import { getErrorMessage } from "@/lib/error-utils";

export function useMovimientos(tramiteId: string | undefined) {
  const [data, setData] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!tramiteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tramites/${tramiteId}/historial`);
      setData(res.data || []);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "&"));
    } finally {
      setLoading(false);
    }
  }, [tramiteId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
