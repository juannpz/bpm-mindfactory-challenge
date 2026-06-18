"use client";

import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import AuthGuard from "@/components/AuthGuard";

function ExternoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => router.push("/externo/mis-tramites")}
          >
            Portal de Trámites
          </Typography>
          <Button color="inherit" onClick={() => router.push("/externo/mis-tramites")}>
            Mis Trámites
          </Button>
          <Button color="inherit" onClick={() => router.push("/externo/crear-tramite")}>
            Nuevo Trámite
          </Button>
          {user && (
            <Typography variant="body2" sx={{ mx: 1 }}>
              {user.nombre}
            </Typography>
          )}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, maxWidth: 1200, mx: "auto", width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}

export default function ExternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard tipo="EXTERNO">
      <ExternoShell>{children}</ExternoShell>
    </AuthGuard>
  );
}
