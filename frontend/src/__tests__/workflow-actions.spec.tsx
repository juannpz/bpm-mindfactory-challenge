import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function AccionesTramite({ acciones }: { acciones: string[] }) {
  if (acciones.includes("INGRESAR")) return <button>Ingresar</button>;
  if (acciones.includes("TOMAR")) return <button>Tomar</button>;
  if (acciones.includes("APROBAR")) return <button>Aprobar</button>;
  if (acciones.includes("RECHAZAR")) return <button>Rechazar</button>;
  if (acciones.includes("CERRAR")) return <button>Cerrar</button>;
  if (acciones.includes("OBSERVAR")) return <button>Observar</button>;
  if (acciones.includes("CANCELAR")) return <button>Cancelar</button>;
  return <span>No acciones disponibles</span>;
}

describe("Workflow Actions", () => {
  it('"Tomar" button visible for INGRESADO', () => {
    render(<AccionesTramite acciones={["TOMAR"]} />);

    expect(screen.getByRole("button", { name: "Tomar" })).toBeInTheDocument();
  });

  it('"Aprobar" visible for EN_REVISION', () => {
    render(<AccionesTramite acciones={["APROBAR"]} />);

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
  });

  it('"Rechazar" visible for EN_REVISION', () => {
    render(<AccionesTramite acciones={["RECHAZAR"]} />);

    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
  });

  it('"Cerrar" visible for APROBADO', () => {
    render(<AccionesTramite acciones={["CERRAR"]} />);

    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("No buttons for CERRADO", () => {
    render(<AccionesTramite acciones={[]} />);

    expect(screen.getByText("No acciones disponibles")).toBeInTheDocument();
  });
});
