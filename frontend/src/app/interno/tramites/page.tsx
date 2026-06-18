"use client";

import React, { useState, useCallback } from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTramites } from "@/hooks/useTramites";
import { useAreas } from "@/hooks/useAreas";
import { TramiteTable } from "@/components/TramiteTable";
import { FiltrosBar } from "@/components/FiltrosBar";
import { LoadingState, ErrorState, EmptyState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";

export default function TramitesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    estado: "",
    area: "",
    prioridad: "",
    origen: "",
    search: "",
    fechaDesde: "",
    fechaHasta: "",
    page: 0,
    limit: 10,
  });

  const { data, loading, error } = useTramites(filters);
  const { data: areas } = useAreas();

  const handleFilterChange = useCallback((name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 0 }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({
      estado: "",
      area: "",
      prioridad: "",
      origen: "",
      search: "",
      fechaDesde: "",
      fechaHasta: "",
      page: 0,
      limit: 10,
    });
  }, []);

  return (
    <Box>
      <PageHeader
        title="Bandeja de Trámites"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/interno/tramites/crear")}
            >
              Nuevo Interno
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => router.push("/interno/tramites/crear-externo")}
            >
              Interno → Externo
            </Button>
          </Box>
        }
      />

      <FiltrosBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        areas={areas || []}
      />

      {loading ? (
        <LoadingState message="Cargando trámites..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => {}} />
      ) : !data || !data.data || data.data.length === 0 ? (
        <EmptyState message="No hay trámites con los filtros seleccionados" />
      ) : (
        <TramiteTable
          tramites={data.data}
          total={data.meta?.total ?? data.data.length}
          page={Math.max(0, (data.meta?.page ?? 1) - 1)}
          limit={data.meta?.limit ?? 10}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
          onLimitChange={(l) => setFilters((prev) => ({ ...prev, limit: l, page: 0 }))}
        />
      )}
    </Box>
  );
}
