"use client";

import React, { useState, useCallback } from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTramites } from "@/hooks/useTramites";
import { TramiteTable } from "@/components/TramiteTable";
import { FiltrosBar } from "@/components/FiltrosBar";
import { LoadingState, ErrorState, EmptyState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";

export default function MisTramitesPage() {
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
        title="Mis Trámites"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/externo/crear-tramite")}
          >
            Nuevo Trámite
          </Button>
        }
      />

      <FiltrosBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        showArea={false}
      />

      {loading ? (
        <LoadingState message="Cargando trámites..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || !data.data || data.data.length === 0 ? (
        <EmptyState message="No tienes trámites registrados" />
      ) : (
        <TramiteTable
          tramites={data.data}
          total={data.meta?.total ?? data.data.length}
          page={Math.max(0, (data.meta?.page ?? 1) - 1)}
          limit={data.meta?.limit ?? 10}
          onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
          onLimitChange={(l) => setFilters((prev) => ({ ...prev, limit: l, page: 0 }))}
          interno={false}
        />
      )}
    </Box>
  );
}
