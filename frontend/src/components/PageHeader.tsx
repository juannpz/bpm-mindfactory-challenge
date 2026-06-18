"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography variant="h4">{title}</Typography>
      {actions && <Box>{actions}</Box>}
    </Box>
  );
}
