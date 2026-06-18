"use client";

import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
}

export function EmptyState({ message = "No hay datos disponibles" }: { message?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export function ErrorState({
  message = "Error al cargar los datos",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Typography variant="body1" color="error" gutterBottom>
        {message}
      </Typography>
      {onRetry && (
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: "pointer", mt: 1 }}
          onClick={onRetry}
        >
          Reintentar
        </Typography>
      )}
    </Box>
  );
}
