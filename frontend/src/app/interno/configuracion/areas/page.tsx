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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAreas } from "@/hooks/useAreas";
import { LoadingState } from "@/components/Feedback";
import { PageHeader } from "@/components/PageHeader";
import { useSnackbar } from "notistack";
import api from "@/services/api";

const validationSchema = yup.object({
  nombre: yup.string().required("El nombre es requerido"),
  codigo: yup.string().required("El código es requerido"),
});

export default function AreasPage() {
  const { data: areas, loading, refetch } = useAreas();
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);

  const formik = useFormik({
    initialValues: { nombre: "", codigo: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post("/areas", values);
        enqueueSnackbar("Área creada", { variant: "success" });
        setDialogOpen(false);
        formik.resetForm();
        refetch();
      } catch (e: unknown) {
        enqueueSnackbar(
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Error al crear área",
          {
            variant: "error",
          },
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleToggle = async (id: string, activa: boolean) => {
    try {
      await api.put(`/areas/${id}`, { activa: !activa });
      refetch();
    } catch {
      enqueueSnackbar("Error al actualizar", { variant: "error" });
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title="Áreas"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Nueva
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
                  <TableCell>Activa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areas?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.codigo}</TableCell>
                    <TableCell>{a.nombre}</TableCell>
                    <TableCell>
                      <Switch
                        checked={a.activa}
                        onChange={() => handleToggle(a.id, a.activa)}
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
        <DialogTitle>Nueva Área</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formik.values.nombre}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.nombre && Boolean(formik.errors.nombre)}
              helperText={formik.touched.nombre && formik.errors.nombre}
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Código"
              name="codigo"
              value={formik.values.codigo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.codigo && Boolean(formik.errors.codigo)}
              helperText={formik.touched.codigo && formik.errors.codigo}
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
