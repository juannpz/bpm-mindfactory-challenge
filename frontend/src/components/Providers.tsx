"use client";

import React from "react";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { AuthProvider } from "@/contexts/auth.context";
import { SnackbarProvider } from "notistack";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/lib/msal-config";

const isProduction = process.env.NEXT_PUBLIC_MOCK_AUTH === "false";

export default function Providers({ children }: { children: React.ReactNode }) {
  const inner = (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      <AuthProvider>{children}</AuthProvider>
    </SnackbarProvider>
  );

  return (
    <ThemeRegistry>
      {isProduction ? <MsalProvider instance={msalInstance}>{inner}</MsalProvider> : inner}
    </ThemeRegistry>
  );
}
