"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAuth } from "@/contexts/auth.context";
import { useSnackbar } from "notistack";

const validationSchema = yup.object({
  nombre: yup.string().required("El nombre es requerido"),
  email: yup.string().email("Email inválido").required("El email es requerido"),
  documento: yup.string().required("El documento es requerido"),
  organizacion: yup.string().required("La organización es requerida"),
  password: yup
    .string()
    .min(8, "Mínimo 8 caracteres")
    .matches(/[A-Z]/, "Debe contener al menos una mayúscula")
    .matches(/[0-9]/, "Debe contener al menos un número")
    .matches(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial")
    .required("La contraseña es requerida"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden")
    .required("Confirme su contraseña"),
});

export default function ExternoRegistroPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      nombre: "",
      email: "",
      documento: "",
      organizacion: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        await register({
          nombre: values.nombre,
          email: values.email,
          password: values.password,
          documento: values.documento,
          organizacion: values.organizacion,
        });
        enqueueSnackbar("Registro exitoso", { variant: "success" });
        router.push("/externo/mis-tramites");
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Error al registrarse";
        setFieldError("email", msg);
        enqueueSnackbar(msg, { variant: "error" });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Registro
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary">
          Complete sus datos para crear una cuenta
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label="Nombre completo"
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
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Documento (DNI/CUIT)"
              name="documento"
              value={formik.values.documento}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.documento && Boolean(formik.errors.documento)}
              helperText={formik.touched.documento && formik.errors.documento}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Organización"
              name="organizacion"
              value={formik.values.organizacion}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.organizacion && Boolean(formik.errors.organizacion)}
              helperText={formik.touched.organizacion && formik.errors.organizacion}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{ mb: 2 }}
              autoComplete="new-password"
            />

            <TextField
              fullWidth
              label="Confirmar contraseña"
              name="confirmPassword"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              sx={{ mb: 3 }}
              autoComplete="new-password"
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ¿Ya tiene cuenta?
        </Typography>
        <Button variant="text" onClick={() => router.push("/externo/login")}>
          Iniciar sesión
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ¿Usuario interno?
        </Typography>
        <Button variant="text" onClick={() => router.push("/interno/login")}>
          Ir al portal interno
        </Button>
      </Box>
    </Container>
  );
}
