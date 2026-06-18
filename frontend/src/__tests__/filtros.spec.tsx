import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FiltrosBar } from "@/components/FiltrosBar";

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

const defaultFilters = {
  estado: "",
  area: "",
  prioridad: "",
  origen: "",
  search: "",
};

const defaultAreas = [
  { id: "a1", nombre: "Mesa Entrada" },
  { id: "a2", nombre: "Legales" },
];

function getSelectByLabel(labelText: string): HTMLElement {
  const label = screen.getByText(labelText, { selector: "label" });
  const formControl = label.closest(".MuiFormControl-root") as HTMLElement;
  return within(formControl).getByRole("combobox");
}

function querySelectByLabel(labelText: string): HTMLElement | null {
  const label = screen.queryByText(labelText, { selector: "label" });
  if (!label) return null;
  const formControl = label.closest(".MuiFormControl-root") as HTMLElement;
  return within(formControl).queryByRole("combobox");
}

describe("FiltrosBar", () => {
  const mockOnFilterChange = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter controls", () => {
    render(
      <FiltrosBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
        areas={defaultAreas}
      />,
    );

    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
    expect(getSelectByLabel("Estado")).toBeInTheDocument();
    expect(getSelectByLabel("Prioridad")).toBeInTheDocument();
    expect(getSelectByLabel("Origen")).toBeInTheDocument();
    expect(getSelectByLabel("Área")).toBeInTheDocument();
  });

  it("hides origen when showOrigen=false", () => {
    render(
      <FiltrosBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
        showOrigen={false}
      />,
    );

    expect(querySelectByLabel("Origen")).not.toBeInTheDocument();
    expect(getSelectByLabel("Estado")).toBeInTheDocument();
    expect(getSelectByLabel("Prioridad")).toBeInTheDocument();
  });

  it("hides area when showArea=false", () => {
    render(
      <FiltrosBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
        areas={defaultAreas}
        showArea={false}
      />,
    );

    expect(querySelectByLabel("Área")).not.toBeInTheDocument();
    expect(getSelectByLabel("Estado")).toBeInTheDocument();
    expect(getSelectByLabel("Prioridad")).toBeInTheDocument();
  });

  it("calls onFilterChange when estado changed", async () => {
    const user = userEvent.setup();
    render(
      <FiltrosBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
      />,
    );

    await user.click(getSelectByLabel("Estado"));
    await user.click(screen.getByRole("option", { name: "Ingresado" }));

    expect(mockOnFilterChange).toHaveBeenCalledWith("estado", "INGRESADO");
  });

  it("shows clear button when has filters", () => {
    render(
      <FiltrosBar
        filters={{ ...defaultFilters, estado: "INGRESADO" }}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
      />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onClear when clear button clicked", async () => {
    const user = userEvent.setup();
    render(
      <FiltrosBar
        filters={{ ...defaultFilters, estado: "INGRESADO" }}
        onFilterChange={mockOnFilterChange}
        onClear={mockOnClear}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });
});
