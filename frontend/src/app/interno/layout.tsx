"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Button,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import AuthGuard from "@/components/AuthGuard";
import { DRAWER_WIDTH } from "@/lib/constants";

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/interno/dashboard" },
  { label: "Trámites", icon: <InboxIcon />, path: "/interno/tramites" },
  { label: "Tipos Trámite", icon: <SettingsIcon />, path: "/interno/configuracion/tipos-tramite" },
  { label: "Áreas", icon: <SettingsIcon />, path: "/interno/configuracion/areas" },
];

function InternoShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap>
          BPM Interno
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={pathname.startsWith(item.path.split("/").slice(0, 3).join("/"))}
            onClick={() => {
              router.push(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Portal Interno
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.nombre} ({user.rol})
            </Typography>
          )}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard tipo="INTERNO">
      <InternoShell>{children}</InternoShell>
    </AuthGuard>
  );
}
