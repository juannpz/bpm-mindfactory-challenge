"use client";

import { useState, useEffect, useCallback } from "react";
import type { TipoTramite } from "@/lib/types";
import api from "@/services/api";
import { getErrorMessage } from "@/lib/error-utils";

export function useTiposTramite() {
  const [data, setData] = useState<TipoTramite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tipos-tramite");
      setData(res.data || []);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "&"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
