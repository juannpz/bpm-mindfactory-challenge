import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CrearTramiteInternoPage from "@/app/interno/tramites/crear/page";

const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const mockEnqueueSnackbar = vi.fn();
vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useTiposTramite", () => ({
  useTiposTramite: () => ({
    data: [
      {
        id: "tt1",
        codigo: "SOL_ALTA",
        nombre: "Solicitud Alta",
        descripcion: "",
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 48,
        areaInicialId: "a1",
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAreas", () => ({
  useAreas: () => ({
    data: [{ id: "a1", nombre: "Mesa Entrada", codigo: "ME", activa: true }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

import api from "@/services/api";

function getSelectByLabel(labelText: string): HTMLElement {
  const label = screen.getByText(labelText, { selector: "label" });
  const formControl = label.closest(".MuiFormControl-root") as HTMLElement;
  return within(formControl).getByRole("combobox");
}

describe("CrearTramiteInternoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("renders fields", () => {
    render(<CrearTramiteInternoPage />);

    expect(getSelectByLabel("Tipo de Trámite")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
    expect(getSelectByLabel("Prioridad")).toBeInTheDocument();
    expect(getSelectByLabel("Área Destino")).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(<CrearTramiteInternoPage />);

    await user.click(screen.getByRole("button", { name: "Crear Trámite" }));

    await waitFor(() => {
      expect(screen.getByText("El título es requerido")).toBeInTheDocument();
    });
    expect(screen.getByText("La descripción es requerida")).toBeInTheDocument();
  });

  it("successful submit calls API and redirects", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: "new-id" } });

    render(<CrearTramiteInternoPage />);

    await user.click(getSelectByLabel("Tipo de Trámite"));
    await user.click(screen.getByRole("option", { name: /Solicitud Alta/ }));

    await user.type(screen.getByLabelText("Título"), "Trámite de prueba");
    await user.type(screen.getByLabelText("Descripción"), "Descripción del trámite");

    await user.click(getSelectByLabel("Área Destino"));
    await user.click(screen.getByRole("option", { name: "Mesa Entrada" }));

    await user.click(screen.getByRole("button", { name: "Crear Trámite" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/interno/tramites/new-id");
    });
  });
});
