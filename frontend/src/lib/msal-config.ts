"use client";

import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
    authority: process.env.NEXT_PUBLIC_AZURE_TENANT_ID
      ? `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`
      : "",
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/interno/login` : "",
    postLogoutRedirectUri:
      typeof window !== "undefined" ? `${window.location.origin}/interno/login` : "",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
