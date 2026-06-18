"use client";

import React from "react";
import {
  Timeline as MuiTimeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  timelineItemClasses,
} from "@mui/lab";
import { Typography, Box } from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Create from "@mui/icons-material/Create";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Cancel from "@mui/icons-material/Cancel";
import RemoveRedEye from "@mui/icons-material/RemoveRedEye";
import Send from "@mui/icons-material/Send";
import Reply from "@mui/icons-material/Reply";
import Block from "@mui/icons-material/Block";
import Archive from "@mui/icons-material/Archive";
import PersonAdd from "@mui/icons-material/PersonAdd";
import type { Movimiento } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ACCION_ICONS: Record<string, React.ReactNode> = {
  CREAR: <Create fontSize="small" />,
  INGRESAR: <ArrowForward fontSize="small" />,
  TOMAR: <PersonAdd fontSize="small" />,
  ASIGNAR: <PersonAdd fontSize="small" />,
  DERIVAR: <Send fontSize="small" />,
  OBSERVAR: <RemoveRedEye fontSize="small" />,
  RESPONDER_OBSERVACION: <Reply fontSize="small" />,
  SOLICITAR_INTERVENCION_EXTERNA: <Send fontSize="small" />,
  RESPONDER_INTERVENCION_EXTERNA: <Reply fontSize="small" />,
  APROBAR: <CheckCircle fontSize="small" />,
  RECHAZAR: <Cancel fontSize="small" />,
  CANCELAR: <Block fontSize="small" />,
  CERRAR: <Archive fontSize="small" />,
};

const ACCION_COLORS: Record<
  string,
  "inherit" | "primary" | "success" | "error" | "warning" | "info"
> = {
  CREAR: "inherit",
  INGRESAR: "primary",
  TOMAR: "info",
  ASIGNAR: "info",
  DERIVAR: "warning",
  OBSERVAR: "warning",
  RESPONDER_OBSERVACION: "success",
  SOLICITAR_INTERVENCION_EXTERNA: "warning",
  RESPONDER_INTERVENCION_EXTERNA: "success",
  APROBAR: "success",
  RECHAZAR: "error",
  CANCELAR: "error",
  CERRAR: "inherit",
};

const ACCION_LABELS: Record<string, string> = {
  CREAR: "Creó el trámite",
  INGRESAR: "Ingresó el trámite",
  TOMAR: "Tomó el trámite",
  ASIGNAR: "Asignó el trámite",
  DERIVAR: "Derivó el trámite",
  OBSERVAR: "Observó el trámite",
  RESPONDER_OBSERVACION: "Respondió observación",
  SOLICITAR_INTERVENCION_EXTERNA: "Solicitó intervención externa",
  RESPONDER_INTERVENCION_EXTERNA: "Respondió intervención",
  APROBAR: "Aprobó el trámite",
  RECHAZAR: "Rechazó el trámite",
  CANCELAR: "Canceló el trámite",
  CERRAR: "Cerró el trámite",
};

export function Timeline({ movimientos }: { movimientos: Movimiento[] }) {
  if (movimientos.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Sin movimientos registrados
        </Typography>
      </Box>
    );
  }

  return (
    <MuiTimeline
      sx={{
        [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
      }}
    >
      {movimientos.map((m) => (
        <TimelineItem key={m.id}>
          <TimelineSeparator>
            <TimelineDot color={ACCION_COLORS[m.accion] || "grey"}>
              {ACCION_ICONS[m.accion] || <Create fontSize="small" />}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {ACCION_LABELS[m.accion] || m.accion}
            </Typography>
            {m.comentario && (
              <Typography variant="body2" color="text.secondary">
                {m.comentario}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {format(new Date(m.fecha), "d 'de' MMMM yyyy 'a las' HH:mm", {
                locale: es,
              })}{" "}
              — {m.usuarioTipo === "INTERNO" ? "Interno" : "Externo"}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
}
