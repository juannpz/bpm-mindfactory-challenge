"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useTiposTramite } from "@/hooks/useTiposTramite";
import { useSnackbar } from "notistack";
import api from "@/services/api";
import type { SelectChangeEvent } from "@mui/material";

const validationSchema = yup.object({
  tipoTramiteId: yup.string().required("Seleccione un tipo de trámite"),
  titulo: yup.string().required("El título es requerido"),
  descripcion: yup.string().required("La descripción es requerida"),
  prioridad: yup.string().required("Seleccione la prioridad"),
});

export default function ExternoCrearTramitePage() {
  const router = useRouter();
  const { data: tipos } = useTiposTramite();
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      tipoTramiteId: "",
      titulo: "",
      descripcion: "",
      prioridad: "MEDIA",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await api.post("/tramites", {
          tipoTramiteId: values.tipoTramiteId,
          titulo: values.titulo,
          descripcion: values.descripcion,
          prioridad: values.prioridad,
          origen: "EXTERNO_INTERNO",
        });
        enqueueSnackbar("Trámite creado exitosamente", { variant: "success" });
        router.push(`/externo/mis-tramites/${res.data.id}`);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Error al crear el trámite";
        enqueueSnackbar(msg, { variant: "error" });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const tiposFiltrados = tipos?.filter((t) => t.activo && t.permiteInicioExterno);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Nuevo Trámite
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <FormControl
              fullWidth
              sx={{ mb: 2 }}
              error={formik.touched.tipoTramiteId && Boolean(formik.errors.tipoTramiteId)}
            >
              <InputLabel>Tipo de Trámite</InputLabel>
              <Select
                name="tipoTramiteId"
                value={formik.values.tipoTramiteId}
                label="Tipo de Trámite"
                onChange={(e: SelectChangeEvent) =>
                  formik.setFieldValue("tipoTramiteId", e.target.value)
                }
              >
                {tiposFiltrados?.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nombre} (SLA: {t.slaHoras}h)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Título"
              name="titulo"
              value={formik.values.titulo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.titulo && Boolean(formik.errors.titulo)}
              helperText={formik.touched.titulo && formik.errors.titulo}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              multiline
              rows={4}
              value={formik.values.descripcion}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
              helperText={formik.touched.descripcion && formik.errors.descripcion}
              sx={{ mb: 2 }}
            />

            <FormControl
              fullWidth
              sx={{ mb: 3 }}
              error={formik.touched.prioridad && Boolean(formik.errors.prioridad)}
            >
              <InputLabel>Prioridad</InputLabel>
              <Select
                name="prioridad"
                value={formik.values.prioridad}
                label="Prioridad"
                onChange={(e: SelectChangeEvent) =>
                  formik.setFieldValue("prioridad", e.target.value)
                }
              >
                <MenuItem value="BAJA">Baja</MenuItem>
                <MenuItem value="MEDIA">Media</MenuItem>
                <MenuItem value="ALTA">Alta</MenuItem>
                <MenuItem value="URGENTE">Urgente</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={formik.isSubmitting}
              >
                Cancelar
              </Button>
              <Button variant="contained" type="submit" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? "Creando..." : "Crear Trámite"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
