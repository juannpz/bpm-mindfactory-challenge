import type { Metadata } from "next";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "BPM Trámites de Oficina",
  description: "Plataforma de gestión de trámites internos y externos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
