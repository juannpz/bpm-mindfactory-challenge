"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import type { TipoUsuarioAuth } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
  tipo: TipoUsuarioAuth;
}

export default function AuthGuard({ children, tipo }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(tipo === "INTERNO" ? "/interno/login" : "/externo/login");
      return;
    }
    if (user?.tipo !== tipo) {
      router.push(user?.tipo === "INTERNO" ? "/interno/dashboard" : "/externo/mis-tramites");
    }
  }, [isAuthenticated, user, tipo, router]);

  if (!isAuthenticated || user?.tipo !== tipo) {
    return null;
  }

  return <>{children}</>;
}
