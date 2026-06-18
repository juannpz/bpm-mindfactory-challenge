import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TramiteTable } from "@/components/TramiteTable";
import { LoadingState, EmptyState, ErrorState } from "@/components/Feedback";
import type { TramiteListItem } from "@/lib/types";

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/components/StatusBadge", () => ({
  StatusBadge: ({ estado }: { estado: string }) => <span data-testid="status-badge">{estado}</span>,
}));

vi.mock("@/components/PrioridadBadge", () => ({
  PrioridadBadge: ({ prioridad }: { prioridad: string }) => (
    <span data-testid="prioridad-badge">{prioridad}</span>
  ),
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

const mockTramite: TramiteListItem = {
  id: "t1",
  numero: "TRAM-2026-00001",
  tipoTramiteId: "tt1",
  titulo: "Test Tramite",
  origen: "INTERNO_INTERNO",
  estado: "INGRESADO",
  prioridad: "MEDIA",
  areaActualId: "a1",
  areaActualNombre: "Mesa Entrada",
  fechaCreacion: "2026-06-16T10:00:00Z",
  fechaActualizacion: "2026-06-16T10:00:00Z",
};

const mockOnPageChange = vi.fn();
const mockOnLimitChange = vi.fn();

function renderTable(overrides: Partial<Parameters<typeof TramiteTable>[0]> = {}) {
  return render(
    <TramiteTable
      tramites={[mockTramite]}
      total={1}
      page={0}
      limit={10}
      onPageChange={mockOnPageChange}
      onLimitChange={mockOnLimitChange}
      {...overrides}
    />,
  );
}

describe("Bandeja de Tramites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with data", () => {
    renderTable();

    expect(screen.getByText("Test Tramite")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("INGRESADO");
    expect(screen.getByTestId("prioridad-badge")).toHaveTextContent("MEDIA");
    expect(screen.getByText("TRAM-2026-00001")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<LoadingState message="Cargando trámites..." />);

    expect(screen.getByText("Cargando trámites...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<EmptyState message="No hay trámites con los filtros seleccionados" />);

    expect(screen.getByText("No hay trámites con los filtros seleccionados")).toBeInTheDocument();
  });

  it("shows error state with retry", () => {
    const mockRetry = vi.fn();
    render(<ErrorState message="Error al cargar los datos" onRetry={mockRetry} />);

    expect(screen.getByText("Error al cargar los datos")).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("pagination is rendered", () => {
    renderTable({ total: 25, page: 0, limit: 10 });

    expect(screen.getByText("1–10 de 25")).toBeInTheDocument();
    expect(screen.getByText("Filas:")).toBeInTheDocument();
  });
});
