"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" },
    secondary: { main: "#00897b" },
    error: { main: "#d32f2f" },
    warning: { main: "#f57c00" },
    info: { main: "#0288d1" },
    success: { main: "#388e3c" },
    background: { default: "#f5f5f5", paper: "#ffffff" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, fontSize: "1.75rem" },
    h5: { fontWeight: 600, fontSize: "1.4rem" },
    h6: { fontWeight: 600, fontSize: "1.2rem" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 500 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": { fontWeight: 600, backgroundColor: "#fafafa" },
        },
      },
    },
  },
});
