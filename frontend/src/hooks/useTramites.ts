"use client";

import { useState, useEffect, useCallback } from "react";
import type { TramiteListItem, TramiteFilters, PaginatedResponse } from "@/lib/types";
import api from "@/services/api";
import { getErrorMessage } from "@/lib/error-utils";

export function useTramites(filters: TramiteFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<TramiteListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.area) params.areaId = filters.area;
      if (filters.prioridad) params.prioridad = filters.prioridad;
      if (filters.origen) params.origen = filters.origen;
      if (filters.search) params.search = filters.search;
      if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
      if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
      if (filters.page !== undefined) params.page = String(filters.page + 1);
      if (filters.limit) params.limit = String(filters.limit);

      const res = await api.get("/tramites", { params });
      setData(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "&"));
    } finally {
      setLoading(false);
    }
  }, [
    filters.estado,
    filters.area,
    filters.prioridad,
    filters.origen,
    filters.search,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
