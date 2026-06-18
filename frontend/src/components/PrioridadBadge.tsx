"use client";

import React from "react";
import { Chip } from "@mui/material";

const PRIORIDAD_COLORS: Record<string, "default" | "success" | "warning" | "error"> = {
  BAJA: "default",
  MEDIA: "success",
  ALTA: "warning",
  URGENTE: "error",
};

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export function PrioridadBadge({ prioridad }: { prioridad: string }) {
  return (
    <Chip
      label={PRIORIDAD_LABELS[prioridad] || prioridad}
      color={PRIORIDAD_COLORS[prioridad] || "default"}
      size="small"
      variant="outlined"
    />
  );
}
