"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Microsoft as MicrosoftIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/auth.context";
import { MOCK_INTERNAL_USERS } from "@/lib/mock-users";
import { loginRequest } from "@/lib/msal-config";
import { useMsal } from "@azure/msal-react";
import type { SelectChangeEvent } from "@mui/material";

const isProduction = process.env.NEXT_PUBLIC_MOCK_AUTH === "false";

function MockLogin() {
  const { loginMock, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
    if (submitted && isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      router.push("/interno/dashboard");
    }
  }, [submitted, isAuthenticated, router]);

  const handleLogin = async () => {
    if (!selectedUser) {
      setError("Seleccione un usuario");
      return;
    }
    const u = MOCK_INTERNAL_USERS.find((mu) => mu.azureObjectId === selectedUser);
    if (u) {
      setError("");
      setSubmitted(true);
      try {
        await loginMock(u.azureObjectId, u.nombre, u.rol);
      } catch {
        setError("Error de autenticación");
        setSubmitted(false);
      }
    }
  };

  if (submitted) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Usuario interno</InputLabel>
          <Select
            value={selectedUser}
            label="Usuario interno"
            onChange={(e: SelectChangeEvent) => {
              setSelectedUser(e.target.value);
              setError("");
            }}
          >
            {MOCK_INTERNAL_USERS.map((mu) => (
              <MenuItem key={mu.azureObjectId} value={mu.azureObjectId}>
                <Box>
                  <Typography variant="body1">{mu.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mu.rol} — {mu.area} ({mu.email})
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleLogin}
          disabled={!selectedUser}
        >
          Ingresar
        </Button>
      </CardContent>
    </Card>
  );
}

function AzureLogin() {
  const { instance } = useMsal();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Handle redirect from Azure
    instance
      .handleRedirectPromise()
      .then((response) => {
        if (response) {
          // Authentication successful — AuthProvider will pick up the token
          setLoading(true);
        }
      })
      .catch((e) => {
        setError("Error de autenticación con Azure");
        console.error(e);
      });
  }, [instance]);

  const handleAzureLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      setError("Error al iniciar sesión con Microsoft");
      console.error(e);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 4, textAlign: "center" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
          Inicie sesión con su cuenta corporativa de Microsoft
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<MicrosoftIcon />}
          onClick={handleAzureLogin}
          sx={{ px: 4, py: 1.5 }}
        >
          Sign in with Microsoft
        </Button>
      </CardContent>
    </Card>
  );
}

export default function InternoLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.tipo === "INTERNO") {
      router.push("/interno/dashboard");
    }
  }, [isAuthenticated, user, router]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Portal Interno
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary">
          {isProduction
            ? "Autenticación con Azure Entra ID"
            : "Modo desarrollo — seleccione un usuario para ingresar"}
        </Typography>
      </Box>

      {isProduction ? <AzureLogin /> : <MockLogin />}

      <Divider sx={{ my: 4 }} />
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ¿Usuario externo?
        </Typography>
        <Button variant="text" onClick={() => router.push("/externo/login")}>
          Ir al portal externo
        </Button>
      </Box>
    </Container>
  );
}
