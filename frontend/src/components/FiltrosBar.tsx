"use client";

import React from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Search, Clear } from "@mui/icons-material";
import type { SelectChangeEvent } from "@mui/material";

interface FiltrosBarProps {
  filters: {
    estado: string;
    area: string;
    prioridad: string;
    origen: string;
    search: string;
    fechaDesde?: string;
    fechaHasta?: string;
  };
  onFilterChange: (name: string, value: string) => void;
  onClear: () => void;
  areas?: { id: string; nombre: string }[];
  showOrigen?: boolean;
  showArea?: boolean;
}

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "INGRESADO", label: "Ingresado" },
  { value: "EN_REVISION", label: "En Revisión" },
  { value: "OBSERVADO", label: "Observado" },
  { value: "ESPERANDO_EXTERNO", label: "Esperando Externo" },
  { value: "ESPERANDO_INTERNO", label: "Esperando Interno" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "CERRADO", label: "Cerrado" },
];

const PRIORIDADES = [
  { value: "", label: "Todas" },
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const ORIGENES = [
  { value: "", label: "Todos" },
  { value: "INTERNO_INTERNO", label: "Interno → Interno" },
  { value: "INTERNO_EXTERNO", label: "Interno → Externo" },
  { value: "EXTERNO_INTERNO", label: "Externo → Interno" },
];

export function FiltrosBar({
  filters,
  onFilterChange,
  onClear,
  areas = [],
  showOrigen = true,
  showArea = true,
}: FiltrosBarProps) {
  const hasFilters =
    filters.estado ||
    filters.area ||
    filters.prioridad ||
    filters.origen ||
    filters.search ||
    filters.fechaDesde ||
    filters.fechaHasta;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexWrap: "wrap",
        mb: 3,
        alignItems: "center",
      }}
    >
      <TextField
        size="small"
        placeholder="Buscar..."
        value={filters.search}
        onChange={(e) => onFilterChange("search", e.target.value)}
        sx={{ minWidth: 200 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        size="small"
        type="date"
        label="Desde"
        value={filters.fechaDesde || ""}
        onChange={(e) => onFilterChange("fechaDesde", e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        size="small"
        type="date"
        label="Hasta"
        value={filters.fechaHasta || ""}
        onChange={(e) => onFilterChange("fechaHasta", e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Estado</InputLabel>
        <Select
          value={filters.estado}
          label="Estado"
          onChange={(e: SelectChangeEvent) => onFilterChange("estado", e.target.value)}
        >
          {ESTADOS.map((e) => (
            <MenuItem key={e.value} value={e.value}>
              {e.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showArea && areas.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Área</InputLabel>
          <Select
            value={filters.area}
            label="Área"
            onChange={(e: SelectChangeEvent) => onFilterChange("area", e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {areas.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Prioridad</InputLabel>
        <Select
          value={filters.prioridad}
          label="Prioridad"
          onChange={(e: SelectChangeEvent) => onFilterChange("prioridad", e.target.value)}
        >
          {PRIORIDADES.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showOrigen && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Origen</InputLabel>
          <Select
            value={filters.origen}
            label="Origen"
            onChange={(e: SelectChangeEvent) => onFilterChange("origen", e.target.value)}
          >
            {ORIGENES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {hasFilters && (
        <IconButton onClick={onClear} size="small">
          <Clear />
        </IconButton>
      )}
    </Box>
  );
}
