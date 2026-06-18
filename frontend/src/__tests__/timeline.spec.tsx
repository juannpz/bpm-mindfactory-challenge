import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "@/components/Timeline";
import type { Movimiento } from "@/lib/types";

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

const createMovimiento = (overrides: Partial<Movimiento> = {}): Movimiento => ({
  id: "m1",
  tramiteId: "t1",
  estadoAnterior: null,
  estadoNuevo: "INGRESADO",
  areaAnteriorId: null,
  areaNuevaId: "a1",
  usuarioTipo: "INTERNO",
  accion: "CREAR",
  comentario: null,
  fecha: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("Timeline", () => {
  it("renders empty state", () => {
    render(<Timeline movimientos={[]} />);

    expect(screen.getByText("Sin movimientos registrados")).toBeInTheDocument();
  });

  it("renders movimientos in order", () => {
    const movimientos: Movimiento[] = [
      createMovimiento({ id: "m1", accion: "CREAR", fecha: "2024-01-15T10:30:00Z" }),
      createMovimiento({
        id: "m2",
        accion: "TOMAR",
        estadoAnterior: "INGRESADO",
        estadoNuevo: "EN_REVISION",
        fecha: "2024-01-15T11:00:00Z",
      }),
    ];

    render(<Timeline movimientos={movimientos} />);

    const items = screen.getAllByText(/el trámite/);
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Creó el trámite");
    expect(items[1]).toHaveTextContent("Tomó el trámite");
  });

  it("shows comentario when present", () => {
    const movimientos: Movimiento[] = [
      createMovimiento({
        id: "m1",
        accion: "OBSERVAR",
        comentario: "Falta documentación requerida",
        estadoAnterior: "EN_REVISION",
        estadoNuevo: "OBSERVADO",
      }),
    ];

    render(<Timeline movimientos={movimientos} />);

    expect(screen.getByText("Falta documentación requerida")).toBeInTheDocument();
    expect(screen.getByText("Observó el trámite")).toBeInTheDocument();
  });
});
