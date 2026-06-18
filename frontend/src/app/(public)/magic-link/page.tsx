"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAuth } from "@/contexts/auth.context";
import { useSnackbar } from "notistack";
import api from "@/services/api";

const requestSchema = yup.object({
  email: yup.string().email("Email inválido").required("El email es requerido"),
});

function MagicLinkRequestForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [devLink, setDevLink] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: requestSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await api.post("/auth/external/magic-link/request", {
          email: values.email,
        });
        if (data.devLink) {
          setDevLink(data.devLink);
        } else {
          enqueueSnackbar(
            "Si el email está registrado, recibirás un enlace de acceso en tu correo",
            { variant: "success" },
          );
        }
      } catch {
        enqueueSnackbar("Error al enviar el enlace", { variant: "error" });
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (devLink) {
    return (
      <>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Enlace generado
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Modo desarrollo — SMTP no configurado. Hacé clic en el enlace para iniciar sesión.
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Este enlace se muestra solo porque no hay SMTP configurado. En producción se enviaría
              por email.
            </Alert>

            <Button variant="contained" size="large" href={devLink} fullWidth sx={{ mb: 2 }}>
              Iniciar sesión
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                bgcolor: "grey.100",
                p: 1.5,
                borderRadius: 1,
              }}
            >
              {devLink}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button variant="text" onClick={() => setDevLink(null)}>
            Enviar otro enlace
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Acceso sin contraseña
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ingresá tu email y te enviaremos un enlace para iniciar sesión
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
              sx={{ mb: 3 }}
              autoComplete="email"
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Enviando..." : "Enviar enlace mágico"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button variant="text" onClick={() => router.push("/externo/login")}>
          Volver al inicio de sesión
        </Button>
      </Box>
    </>
  );
}

function MagicLinkVerify({ token }: { token: string }) {
  const router = useRouter();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const { data } = await api.post("/auth/external/magic-link/verify", {
          token,
        });
        if (cancelled) return;

        localStorage.setItem(
          "bpm_auth",
          JSON.stringify({
            user: data.usuario,
            token: data.token,
            isAuthenticated: true,
          }),
        );

        document.cookie = `bpm_token=${data.token}; path=/; SameSite=Lax; max-age=${30 * 24 * 60 * 60}`;

        enqueueSnackbar("Inicio de sesión exitoso", { variant: "success" });
        router.push("/externo/mis-tramites");
      } catch {
        if (!cancelled) {
          setError("El enlace es inválido o ha expirado. Solicitá uno nuevo.");
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, router, login, enqueueSnackbar]);

  if (error) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push("/magic-link")}>
          Solicitar nuevo enlace
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <CircularProgress size={48} />
      <Typography variant="body1" sx={{ mt: 3 }} color="text.secondary">
        Verificando enlace de acceso...
      </Typography>
    </Box>
  );
}

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return token ? <MagicLinkVerify token={token} /> : <MagicLinkRequestForm />;
}

export default function MagicLinkPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Suspense
          fallback={
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={48} />
            </Box>
          }
        >
          <MagicLinkContent />
        </Suspense>
      </Box>
    </Container>
  );
}
