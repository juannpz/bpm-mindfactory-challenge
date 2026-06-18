"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";
import { PrioridadBadge } from "./PrioridadBadge";
import type { TramiteListItem } from "@/lib/types";

const COLUMNS = [
  { id: "numero", label: "Número", width: 150 },
  { id: "titulo", label: "Título" },
  { id: "origen", label: "Origen", width: 140 },
  { id: "estado", label: "Estado", width: 140 },
  { id: "prioridad", label: "Prioridad", width: 100 },
  { id: "area", label: "Área", width: 140 },
  { id: "fecha", label: "Fecha Creación", width: 130 },
];

interface TramiteTableProps {
  tramites: TramiteListItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  interno?: boolean;
}

const ORIGEN_LABELS: Record<string, string> = {
  INTERNO_INTERNO: "Int → Int",
  INTERNO_EXTERNO: "Int → Ext",
  EXTERNO_INTERNO: "Ext → Int",
};

export function TramiteTable({
  tramites,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  interno = true,
}: TramiteTableProps) {
  const router = useRouter();

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.id} sx={{ width: col.width, fontWeight: 600 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tramites.map((t) => (
              <TableRow
                key={t.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  router.push(
                    interno ? `/interno/tramites/${t.id}` : `/externo/mis-tramites/${t.id}`,
                  )
                }
              >
                <TableCell>
                  <strong>{t.numero}</strong>
                  {t.slaVencido && <span style={{ color: "red", marginLeft: 8 }}>⚠</span>}
                </TableCell>
                <TableCell>{t.titulo}</TableCell>
                <TableCell>{ORIGEN_LABELS[t.origen] || t.origen}</TableCell>
                <TableCell>
                  <StatusBadge estado={t.estado} />
                </TableCell>
                <TableCell>
                  <PrioridadBadge prioridad={t.prioridad} />
                </TableCell>
                <TableCell>{t.areaActualNombre || t.areaActualId || "—"}</TableCell>
                <TableCell>{new Date(t.fechaCreacion).toLocaleDateString("es-AR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Filas:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />
    </Paper>
  );
}
