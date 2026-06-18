"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useTiposTramite } from "@/hooks/useTiposTramite";
import { LoadingState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "notistack";
import api from "@/services/api";

const validationSchema = yup.object({
  codigo: yup.string().required("El código es requerido"),
  nombre: yup.string().required("El nombre es requerido"),
  descripcion: yup.string().required("La descripción es requerida"),
  slaHoras: yup.number().min(1, "Mínimo 1 hora").required("El SLA es requerido"),
});

export default function TiposTramitePage() {
  const { data: tipos, loading, refetch } = useTiposTramite();
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);

  const formik = useFormik({
    initialValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      slaHoras: 24,
      requiereExterno: false,
      permiteInicioExterno: false,
      areaInicialId: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post("/tipos-tramite", {
          ...values,
          areaInicialId: values.areaInicialId || undefined,
        });
        enqueueSnackbar("Tipo de trámite creado", { variant: "success" });
        setDialogOpen(false);
        formik.resetForm();
        refetch();
      } catch (e: unknown) {
        enqueueSnackbar(
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Error al crear tipo de trámite",
          { variant: "error" },
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleToggle = async (id: string, activo: boolean) => {
    try {
      await api.put(`/tipos-tramite/${id}`, { activo: !activo });
      refetch();
    } catch {
      enqueueSnackbar("Error al actualizar", { variant: "error" });
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title="Tipos de Trámite"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Nuevo
          </Button>
        }
      />

      <Card>
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>SLA (h)</TableCell>
                  <TableCell>Req. Externo</TableCell>
                  <TableCell>Inicio Ext.</TableCell>
                  <TableCell>Activo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tipos?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.codigo}</TableCell>
                    <TableCell>{t.nombre}</TableCell>
                    <TableCell>{t.slaHoras}</TableCell>
                    <TableCell>{t.requiereExterno ? "Sí" : "No"}</TableCell>
                    <TableCell>{t.permiteInicioExterno ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={t.activo}
                        onChange={() => handleToggle(t.id, t.activo)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          formik.resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo Tipo de Trámite</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Código"
              name="codigo"
              value={formik.values.codigo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.codigo && Boolean(formik.errors.codigo)}
              helperText={formik.touched.codigo && formik.errors.codigo}
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formik.values.nombre}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.nombre && Boolean(formik.errors.nombre)}
              helperText={formik.touched.nombre && formik.errors.nombre}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formik.values.descripcion}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
              helperText={formik.touched.descripcion && formik.errors.descripcion}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="SLA (horas)"
              name="slaHoras"
              type="number"
              value={formik.values.slaHoras}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.slaHoras && Boolean(formik.errors.slaHoras)}
              helperText={formik.touched.slaHoras && formik.errors.slaHoras}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.requiereExterno}
                  onChange={(e) => formik.setFieldValue("requiereExterno", e.target.checked)}
                />
              }
              label="Requiere externo"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.permiteInicioExterno}
                  onChange={(e) => formik.setFieldValue("permiteInicioExterno", e.target.checked)}
                />
              }
              label="Permite inicio externo"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDialogOpen(false);
                formik.resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button variant="contained" type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Creando..." : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
