"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Inbox as InboxIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useDashboard } from "@/hooks/useDashboard";
import { useAreas } from "@/hooks/useAreas";
import { LoadingState, ErrorState, EmptyState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const { data: areas } = useAreas();

  if (loading) return <LoadingState message="Cargando dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState message="No hay datos del dashboard" />;

  const totalTramites = Object.values(data.tramitesPorEstado).reduce((a, b) => a + b, 0);

  const areaNames: Record<string, string> = {};
  areas?.forEach((a) => {
    areaNames[a.id] = a.nombre;
  });

  return (
    <Box>
      <PageHeader title="Dashboard Operativo" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <InboxIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4">{totalTramites}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total trámites
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <WarningIcon sx={{ fontSize: 40, color: "error.main" }} />
              <Box>
                <Typography variant="h4">{data.tramitesVencidos}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Vencidos por SLA
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TimeIcon sx={{ fontSize: 40, color: "warning.main" }} />
              <Box>
                <Typography variant="h4">
                  {data.promedioResolucionHoras?.toFixed(1) || "—"}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Promedio resolución
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trámites por Estado
              </Typography>
              {Object.entries(data.tramitesPorEstado).map(([estado, count]) => (
                <Box
                  key={estado}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <StatusBadge estado={estado} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trámites por Origen
              </Typography>
              {Object.entries(data.tramitesPorOrigen || {}).map(([origen, count]) => (
                <Box
                  key={origen}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography variant="body2">
                    {origen === "INTERNO_INTERNO"
                      ? "Interno → Interno"
                      : origen === "INTERNO_EXTERNO"
                        ? "Interno → Externo"
                        : origen === "EXTERNO_INTERNO"
                          ? "Externo → Interno"
                          : origen}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trámites por Área
              </Typography>
              {Object.entries(data.cantidadPorArea || {}).map(([areaId, count]) => (
                <Box
                  key={areaId}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography variant="body2">{areaNames[areaId] || areaId}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Últimos Movimientos
              </Typography>
              {data.ultimosMovimientos && data.ultimosMovimientos.length > 0 ? (
                <List dense>
                  {data.ultimosMovimientos.map((m) => (
                    <ListItem key={m.id} divider>
                      <ListItemText
                        primary={m.accion}
                        secondary={`${format(new Date(m.fecha), "d/MM/yyyy HH:mm", { locale: es })} — ${m.usuarioTipo}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <EmptyState message="Sin movimientos recientes" />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
