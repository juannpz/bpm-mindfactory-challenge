"use client";

import React, { useState, use, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  useTramite,
  useMovimientos,
  useComentarios,
  useDocumentos,
  useWorkflowAction,
  type WorkflowAction,
} from "@/hooks";
import { useAreas } from "@/hooks/useAreas";
import { useAuth } from "@/contexts/auth.context";
import { Timeline } from "@/components/Timeline";
import { StatusBadge } from "@/components/StatusBadge";
import { PrioridadBadge } from "@/components/PrioridadBadge";
import { LoadingState, ErrorState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSnackbar } from "notistack";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/services/api";
import type { SelectChangeEvent } from "@mui/material";

const ORIGEN_LABELS: Record<string, string> = {
  INTERNO_INTERNO: "Interno → Interno",
  INTERNO_EXTERNO: "Interno → Externo",
  EXTERNO_INTERNO: "Externo → Interno",
};

const ACCION_LABELS: Record<string, string> = {
  INGRESAR: "Ingresar",
  TOMAR: "Tomar",
  ASIGNAR: "Asignar/Reasignar",
  DERIVAR: "Derivar",
  OBSERVAR: "Observar",
  SOLICITAR_INTERVENCION_EXTERNA: "Solicitar intervención externa",
  APROBAR: "Aprobar",
  RECHAZAR: "Rechazar",
  CANCELAR: "Cancelar",
  CERRAR: "Cerrar",
};

const ACCION_COLORS: Record<string, string> = {
  INGRESAR: "primary",
  TOMAR: "primary",
  ASIGNAR: "info",
  DERIVAR: "info",
  OBSERVAR: "warning",
  SOLICITAR_INTERVENCION_EXTERNA: "warning",
  APROBAR: "success",
  RECHAZAR: "error",
  CANCELAR: "error",
  CERRAR: "default",
};

// Acciones que requieren confirmación simple (sin diálogo de texto)

// Acciones que requieren diálogo con texto
const TEXT_DIALOG_ACTIONS = ["OBSERVAR", "RECHAZAR", "APROBAR"];

// Acciones que requieren selección adicional
const SELECT_ACTIONS = ["DERIVAR", "ASIGNAR", "SOLICITAR_INTERVENCION_EXTERNA"];

export default function TramiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tramite, loading, error, refetch } = useTramite(id);
  const { data: movimientos, refetch: refetchMovimientos } = useMovimientos(id);
  const { data: comentarios, refetch: refetchComentarios } = useComentarios(id);
  const { data: documentos, refetch: refetchDocumentos } = useDocumentos(id);
  const { execute, loading: actionLoading } = useWorkflowAction(id);
  const { data: areas } = useAreas();
  const { user } = useAuth();
  const rol = user?.rol;
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState("");
  const [dialogText, setDialogText] = useState("");
  const [dialogAreaId, setDialogAreaId] = useState("");
  const [dialogUsuarioId, setDialogUsuarioId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [comentarioText, setComentarioText] = useState("");
  const [externos, setExternos] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar usuarios externos para el diálogo de solicitar intervención
  useEffect(() => {
    if (dialogOpen === "SOLICITAR_INTERVENCION_EXTERNA") {
      api
        .get("/usuarios-externos")
        .then((res) => {
          setExternos(res.data ?? []);
        })
        .catch(() => {});
    }
  }, [dialogOpen]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!tramite) return <ErrorState message="Trámite no encontrado" />;

  const handleAction = async (action: string, payload?: Record<string, unknown>) => {
    const act = action.toLowerCase().replace(/_/g, "-") as WorkflowAction;
    const result = await execute(act, payload);
    if (result) {
      enqueueSnackbar("Acción ejecutada correctamente", { variant: "success" });
      setDialogOpen("");
      setConfirmOpen("");
      refetch();
      refetchMovimientos();
      refetchComentarios();
      refetchDocumentos();
    } else {
      enqueueSnackbar("Error al ejecutar la acción", { variant: "error" });
    }
  };

  const handleSelectAction = (accion: string) => {
    if (TEXT_DIALOG_ACTIONS.includes(accion)) {
      setDialogText("");
      setDialogOpen(accion);
    } else if (SELECT_ACTIONS.includes(accion)) {
      setDialogText("");
      setDialogAreaId("");
      setDialogUsuarioId("");
      setDialogOpen(accion);
    } else {
      setConfirmOpen(accion);
      setConfirmMsg(`¿Confirmar acción "${ACCION_LABELS[accion] || accion}"?`);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/tramites/${id}/documentos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      enqueueSnackbar("Documento subido correctamente", { variant: "success" });
      refetchDocumentos();
    } catch {
      enqueueSnackbar("Error al subir el documento", { variant: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddComment = async () => {
    if (!comentarioText.trim()) return;
    try {
      await api.post(`/tramites/${id}/comentarios`, {
        mensaje: comentarioText,
        visibilidad: "INTERNA",
      });
      enqueueSnackbar("Comentario agregado", { variant: "success" });
      setComentarioText("");
      refetchComentarios();
    } catch {
      enqueueSnackbar("Error al agregar comentario", { variant: "error" });
    }
  };

  // Usar accionesDisponibles del backend si están disponibles, sino fallback
  const accionesDisponibles = (() => {
    const fromBackend = tramite.accionesDisponibles;
    if (fromBackend && fromBackend.length > 0) {
      return fromBackend
        .filter((a) => ACCION_LABELS[a]) // Solo las que conocemos
        .map((a) => ({
          label: ACCION_LABELS[a],
          action: a,
          color: ACCION_COLORS[a] || "primary",
        }));
    }
    // Fallback manual
    const estado = tramite.estado;
    const origen = tramite.origen;
    const acciones: { label: string; action: string; color?: string }[] = [];

    if (estado === "BORRADOR") {
      acciones.push({ label: "Ingresar", action: "ingresar", color: "primary" });
      acciones.push({ label: "Cancelar", action: "cancelar", color: "error" });
    }
    if (estado === "INGRESADO" && origen !== "EXTERNO_INTERNO") {
      acciones.push({ label: "Tomar", action: "tomar", color: "primary" });
    }
    if (estado === "INGRESADO" && origen === "EXTERNO_INTERNO") {
      acciones.push({ label: "Tomar", action: "tomar", color: "primary" });
    }
    if (estado === "INGRESADO" && origen === "INTERNO_EXTERNO") {
      acciones.push({
        label: "Solicitar intervención externa",
        action: "solicitar-intervencion-externa",
        color: "warning",
      });
    }
    if (estado === "EN_REVISION") {
      acciones.push({ label: "Aprobar", action: "aprobar", color: "success" });
      acciones.push({ label: "Rechazar", action: "rechazar", color: "error" });
      acciones.push({ label: "Observar", action: "observar", color: "warning" });
      acciones.push({ label: "Asignar/Reasignar", action: "asignar", color: "info" });
      if (origen === "INTERNO_INTERNO") {
        acciones.push({ label: "Derivar", action: "derivar", color: "info" });
      }
      if (origen === "INTERNO_EXTERNO") {
        acciones.push({
          label: "Solicitar intervención externa",
          action: "solicitar-intervencion-externa",
          color: "warning",
        });
      }
      acciones.push({ label: "Cancelar", action: "cancelar", color: "error" });
    }
    if (estado === "INGRESADO") {
      acciones.push({ label: "Cancelar", action: "cancelar", color: "error" });
    }
    if (
      estado === "OBSERVADO" ||
      estado === "ESPERANDO_EXTERNO" ||
      estado === "ESPERANDO_INTERNO"
    ) {
      acciones.push({ label: "Cancelar", action: "cancelar", color: "error" });
    }
    if (estado === "ESPERANDO_INTERNO") {
      acciones.push({ label: "Tomar", action: "tomar", color: "primary" });
    }
    if (["APROBADO", "RECHAZADO", "CANCELADO"].includes(estado)) {
      acciones.push({ label: "Cerrar", action: "cerrar", color: "default" });
    }

    return acciones;
  })();

  // Filtrar acciones por rol
  const accionesPorRol = (() => {
    if (!rol) return accionesDisponibles;
    const permitidas: Record<string, string[]> = {
      ADMIN: [
        "ingresar",
        "tomar",
        "asignar",
        "derivar",
        "observar",
        "aprobar",
        "rechazar",
        "cancelar",
        "cerrar",
        "solicitar-intervencion-externa",
      ],
      SUPERVISOR: [
        "ingresar",
        "tomar",
        "asignar",
        "derivar",
        "observar",
        "aprobar",
        "rechazar",
        "cancelar",
        "cerrar",
        "solicitar-intervencion-externa",
      ],
      OPERADOR: [
        "tomar",
        "observar",
        "aprobar",
        "rechazar",
        "cancelar",
        "solicitar-intervencion-externa",
      ],
      MESA_ENTRADA: ["ingresar", "tomar", "cancelar"],
      AUDITOR: [],
    };
    return accionesDisponibles.filter((a) => (permitidas[rol] ?? []).includes(a.action));
  })();

  return (
    <Box>
      <PageHeader title={`${tramite.numero} — ${tramite.titulo}`} />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" color="text.secondary">
                Origen
              </Typography>
              <Typography variant="body1">
                {ORIGEN_LABELS[tramite.origen] || tramite.origen}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Estado
              </Typography>
              <Box>
                <StatusBadge estado={tramite.estado} />
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Prioridad
              </Typography>
              <Box>
                <PrioridadBadge prioridad={tramite.prioridad} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="overline" color="text.secondary">
                Descripción
              </Typography>
              <Typography variant="body1">{tramite.descripcion}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Tipo de Trámite
              </Typography>
              <Typography variant="body2">
                {tramite.tipoTramiteNombre || tramite.tipoTramiteId}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Área Actual
              </Typography>
              <Typography variant="body2">
                {tramite.areaActualNombre || tramite.areaActualId || "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Asignado a
              </Typography>
              <Typography variant="body2">{tramite.usuarioAsignadoNombre || "—"}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Usuario Externo
              </Typography>
              <Typography variant="body2">{tramite.usuarioExternoNombre || "—"}</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Fecha Creación
              </Typography>
              <Typography variant="body2">
                {format(new Date(tramite.fechaCreacion), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="overline" color="text.secondary">
                SLA
              </Typography>
              <Typography variant="body2">
                {tramite.tipoTramiteSlaHoras ? `${tramite.tipoTramiteSlaHoras}h` : "—"}
              </Typography>
            </Grid>
          </Grid>

          {accionesPorRol.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {accionesPorRol.map((a) => (
                <Button
                  key={a.action}
                  variant="contained"
                  color={
                    (a.color as "primary" | "success" | "error" | "warning" | "info") || "primary"
                  }
                  size="small"
                  disabled={actionLoading}
                  onClick={() => handleSelectAction(a.action)}
                >
                  {a.label}
                </Button>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Timeline" />
        <Tab label={`Documentos (${documentos.length})`} />
        <Tab label={`Comentarios (${comentarios.length})`} />
      </Tabs>

      {tab === 0 && <Timeline movimientos={movimientos} />}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Documentos</Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Subiendo..." : "Adjuntar archivo"}
              </Button>
              <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />
            </Box>
            {documentos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin documentos adjuntos
              </Typography>
            ) : (
              documentos.map((doc) => (
                <Box
                  key={doc.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Box>
                    <Typography variant="body2">{doc.nombreArchivo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(doc.size / 1024).toFixed(0)} KB —{" "}
                      {format(new Date(doc.fechaCarga), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={doc.subidoPorTipo === "INTERNO" ? "Interno" : "Externo"}
                    size="small"
                  />
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Agregar comentario
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={comentarioText}
                onChange={(e) => setComentarioText(e.target.value)}
                placeholder="Escribir comentario interno..."
              />
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                disabled={!comentarioText.trim()}
                onClick={handleAddComment}
              >
                Agregar
              </Button>
            </Box>
            {comentarios.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin comentarios
              </Typography>
            ) : (
              comentarios.map((c) => (
                <Box key={c.id} sx={{ py: 1.5, borderBottom: "1px solid #eee" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {c.autorNombre || (c.autorTipo === "INTERNO" ? "Interno" : "Externo")}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip label={c.visibilidad} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(c.fecha), "dd/MM HH:mm", {
                          locale: es,
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">{c.mensaje}</Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para acciones con texto (observar, rechazar, aprobar) */}
      <Dialog
        open={!!dialogOpen && TEXT_DIALOG_ACTIONS.includes(dialogOpen)}
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogOpen === "OBSERVAR"
            ? "Observar trámite"
            : dialogOpen === "RECHAZAR"
              ? "Rechazar trámite"
              : dialogOpen === "APROBAR"
                ? "Aprobar trámite"
                : "Acción"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label={
              dialogOpen === "APROBAR"
                ? "Comentario (opcional)"
                : dialogOpen === "RECHAZAR"
                  ? "Motivo del rechazo"
                  : "Comentario"
            }
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              (dialogOpen === "RECHAZAR" || dialogOpen === "OBSERVAR") && !dialogText.trim()
            }
            onClick={() => {
              const act = dialogOpen.toLowerCase();
              handleAction(act, {
                comentario: dialogText || undefined,
                motivo: dialogText || undefined,
              });
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para DERIVAR: seleccionar área destino */}
      <Dialog
        open={dialogOpen === "DERIVAR"}
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Derivar trámite</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Área destino</InputLabel>
            <Select
              value={dialogAreaId}
              label="Área destino"
              onChange={(e: SelectChangeEvent) => setDialogAreaId(e.target.value)}
            >
              {areas
                ?.filter((a) => a.activa)
                .map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre} ({a.codigo})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Comentario (opcional)"
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!dialogAreaId}
            onClick={() =>
              handleAction("derivar", {
                areaDestinoId: dialogAreaId,
                comentario: dialogText || undefined,
              })
            }
          >
            Derivar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ASIGNAR: seleccionar área (opcional) */}
      <Dialog
        open={dialogOpen === "ASIGNAR"}
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Asignar/Reasignar trámite</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingrese el ID del usuario interno al que desea asignar el trámite.
          </Typography>
          <TextField
            fullWidth
            label="ID de usuario"
            value={dialogUsuarioId}
            onChange={(e) => setDialogUsuarioId(e.target.value)}
            sx={{ mt: 1 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Área (opcional)</InputLabel>
            <Select
              value={dialogAreaId}
              label="Área (opcional)"
              onChange={(e: SelectChangeEvent) => setDialogAreaId(e.target.value)}
            >
              <MenuItem value="">— Sin cambio —</MenuItem>
              {areas
                ?.filter((a) => a.activa)
                .map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre} ({a.codigo})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!dialogUsuarioId}
            onClick={() =>
              handleAction("asignar", {
                usuarioId: dialogUsuarioId,
                areaId: dialogAreaId || undefined,
              })
            }
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para SOLICITAR_INTERVENCION_EXTERNA: seleccionar usuario externo */}
      <Dialog
        open={dialogOpen === "SOLICITAR_INTERVENCION_EXTERNA"}
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar intervención externa</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Usuario externo</InputLabel>
            <Select
              value={dialogUsuarioId}
              label="Usuario externo"
              onChange={(e: SelectChangeEvent) => setDialogUsuarioId(e.target.value)}
            >
              {externos.map((ext) => (
                <MenuItem key={ext.id} value={ext.id}>
                  {ext.nombre} ({ext.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Comentario (opcional)"
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!dialogUsuarioId}
            onClick={() =>
              handleAction("solicitar-intervencion-externa", {
                usuarioExternoId: dialogUsuarioId,
                comentario: dialogText || undefined,
              })
            }
          >
            Solicitar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmOpen}
        title="Confirmar acción"
        message={confirmMsg}
        onConfirm={() => handleAction(confirmOpen)}
        onCancel={() => setConfirmOpen("")}
        loading={actionLoading}
      />
    </Box>
  );
}
