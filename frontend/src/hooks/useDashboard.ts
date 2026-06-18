"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardData } from "@/lib/types";
import api from "@/services/api";
import { getErrorMessage } from "@/lib/error-utils";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
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
