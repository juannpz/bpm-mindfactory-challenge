import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/components/Feedback";

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

describe("ErrorState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error message", () => {
    render(<ErrorState message="Error 404" />);

    expect(screen.getByText("Error 404")).toBeInTheDocument();
  });

  it("shows retry button when onRetry provided", () => {
    const mockRetry = vi.fn();
    render(<ErrorState message="Error" onRetry={mockRetry} />);

    const retryButton = screen.getByText("Reintentar");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show retry when onRetry not provided", () => {
    render(<ErrorState message="Error" />);

    expect(screen.queryByText("Reintentar")).not.toBeInTheDocument();
  });

  it("uses default error message", () => {
    render(<ErrorState />);

    expect(screen.getByText("Error al cargar los datos")).toBeInTheDocument();
  });
});
