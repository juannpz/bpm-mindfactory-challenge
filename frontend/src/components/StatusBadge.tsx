"use client";

import React from "react";
import { Chip } from "@mui/material";

const ESTADO_COLORS: Record<
  string,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  BORRADOR: "default",
  INGRESADO: "info",
  EN_REVISION: "primary",
  OBSERVADO: "warning",
  ESPERANDO_EXTERNO: "warning",
  ESPERANDO_INTERNO: "warning",
  APROBADO: "success",
  RECHAZADO: "error",
  CANCELADO: "error",
  CERRADO: "default",
};

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  INGRESADO: "Ingresado",
  EN_REVISION: "En Revisión",
  OBSERVADO: "Observado",
  ESPERANDO_EXTERNO: "Esperando Externo",
  ESPERANDO_INTERNO: "Esperando Interno",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  CANCELADO: "Cancelado",
  CERRADO: "Cerrado",
};

export function StatusBadge({ estado }: { estado: string }) {
  return (
    <Chip
      label={ESTADO_LABELS[estado] || estado}
      color={ESTADO_COLORS[estado] || "default"}
      size="small"
      variant="filled"
    />
  );
}
