"use client";

import React, { useState, use, useRef } from "react";
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
} from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";
import {
  useTramite,
  useMovimientos,
  useComentarios,
  useDocumentos,
  useWorkflowAction,
  type WorkflowAction,
} from "@/hooks";
import { Timeline } from "@/components/Timeline";
import { StatusBadge } from "@/components/StatusBadge";
import { PrioridadBadge } from "@/components/PrioridadBadge";
import { LoadingState, ErrorState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "notistack";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/services/api";

const ORIGEN_LABELS: Record<string, string> = {
  INTERNO_INTERNO: "Interno → Interno",
  INTERNO_EXTERNO: "Interno → Externo",
  EXTERNO_INTERNO: "Externo → Interno",
};

export default function ExternoTramiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tramite, loading, error, refetch } = useTramite(id);
  const { data: movimientos } = useMovimientos(id);
  const { data: comentarios, refetch: refetchComentarios } = useComentarios(id);
  const { data: documentos, refetch: refetchDocumentos } = useDocumentos(id);
  const { execute, loading: actionLoading } = useWorkflowAction(id);
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState("");
  const [dialogText, setDialogText] = useState("");
  const [uploading, setUploading] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!tramite) return <ErrorState message="Trámite no encontrado" />;

  const handleAction = async (action: string, payload?: Record<string, unknown>) => {
    const act = action.toLowerCase().replace(/_/g, "-") as WorkflowAction;
    const result = await execute(act, payload);
    if (result) {
      enqueueSnackbar("Acción ejecutada correctamente", {
        variant: "success",
      });
      setDialogOpen("");
      refetch();
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
      enqueueSnackbar("Documento subido correctamente", {
        variant: "success",
      });
      refetchDocumentos();
    } catch {
      enqueueSnackbar("Error al subir el documento", { variant: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddComment = async () => {
    if (!dialogText.trim()) return;
    try {
      await api.post(`/tramites/${id}/comentarios`, {
        mensaje: dialogText,
        visibilidad: "EXTERNA",
      });
      enqueueSnackbar("Comentario agregado", { variant: "success" });
      setDialogText("");
      refetchComentarios();
    } catch {
      enqueueSnackbar("Error al agregar comentario", { variant: "error" });
    }
  };

  const comentariosVisibles = comentarios.filter(
    (c) => c.visibilidad === "EXTERNA" || c.visibilidad === "TODOS",
  );

  const accionesDisponibles = (() => {
    const estado = tramite.estado;
    const origen = tramite.origen;
    const acciones: { label: string; action: string; color?: string }[] = [];

    if (estado === "OBSERVADO" && origen === "EXTERNO_INTERNO") {
      acciones.push({
        label: "Responder observación",
        action: "responder-observacion",
        color: "success",
      });
    }
    if (estado === "ESPERANDO_EXTERNO") {
      acciones.push({
        label: "Responder intervención",
        action: "responder-intervencion-externa",
        color: "primary",
      });
    }

    return acciones;
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

          {accionesDisponibles.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              {accionesDisponibles.map((a) => (
                <Button
                  key={a.action}
                  variant="contained"
                  color={
                    (a.color as "primary" | "success" | "error" | "warning" | "info") || "primary"
                  }
                  size="small"
                  disabled={actionLoading}
                  onClick={() => setDialogOpen(a.action)}
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
        <Tab label={`Comentarios (${comentariosVisibles.length})`} />
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
                startIcon={<UploadIcon />}
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Comentarios</Typography>
              <Button variant="outlined" size="small" onClick={() => setDialogOpen("comentario")}>
                Agregar comentario
              </Button>
            </Box>
            {comentariosVisibles.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin comentarios visibles
              </Typography>
            ) : (
              comentariosVisibles.map((c) => (
                <Box key={c.id} sx={{ py: 1.5, borderBottom: "1px solid #eee" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {c.autorNombre || (c.autorTipo === "INTERNO" ? "Interno" : "Externo")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(c.fecha), "dd/MM HH:mm", {
                        locale: es,
                      })}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{c.mensaje}</Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={
          dialogOpen === "responder-observacion" || dialogOpen === "responder-intervencion-externa"
        }
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogOpen === "responder-observacion"
            ? "Responder observación"
            : "Responder intervención"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Respuesta"
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!dialogText.trim() || actionLoading}
            onClick={() => handleAction(dialogOpen, { comentario: dialogText || undefined })}
          >
            {actionLoading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogOpen === "comentario"}
        onClose={() => setDialogOpen("")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar comentario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Mensaje"
            value={dialogText}
            onChange={(e) => setDialogText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen("")}>Cancelar</Button>
          <Button variant="contained" disabled={!dialogText.trim()} onClick={handleAddComment}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
