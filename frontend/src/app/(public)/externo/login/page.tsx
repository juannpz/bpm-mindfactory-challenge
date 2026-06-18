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
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAuth } from "@/contexts/auth.context";
import { useSnackbar } from "notistack";

const validationSchema = yup.object({
  email: yup.string().email("Email inválido").required("El email es requerido"),
  password: yup.string().required("La contraseña es requerida"),
});

export default function ExternoLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        await login(values.email, values.password);
        enqueueSnackbar("Inicio de sesión exitoso", { variant: "success" });
        router.push("/externo/mis-tramites");
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Credenciales inválidas";
        setFieldError("password", msg);
        enqueueSnackbar(msg, { variant: "error" });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Portal Externo
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary">
          Ingrese sus credenciales para continuar
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={formik.handleSubmit}>
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
              label="Contraseña"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{ mb: 3 }}
              autoComplete="current-password"
            />

            <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
              Seed credentials: externo1@test.com / Password123!
            </Alert>

            <Button
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ¿No tiene cuenta?
        </Typography>
        <Button variant="text" onClick={() => router.push("/externo/registro")}>
          Registrarse
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
