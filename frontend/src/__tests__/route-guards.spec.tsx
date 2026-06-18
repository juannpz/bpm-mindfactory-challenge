import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthGuard from "@/components/AuthGuard";

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("@/contexts/auth.context", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderGuard(tipo: "INTERNO" | "EXTERNO") {
  return render(
    <AuthGuard tipo={tipo}>
      <div data-testid="protected-content">Protected Content</div>
    </AuthGuard>,
  );
}

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not authenticated (redirects)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
    });

    const { container } = renderGuard("INTERNO");

    expect(container.firstChild).toBeNull();
    expect(mockRouter.push).toHaveBeenCalledWith("/interno/login");
  });

  it("renders children when authenticated with correct type", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        nombre: "Admin",
        email: "admin@test.com",
        tipo: "INTERNO",
        rol: "ADMIN",
      },
      token: "jwt-token",
    });

    renderGuard("INTERNO");

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects when wrong user type", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "2",
        nombre: "Externo",
        email: "ext@test.com",
        tipo: "EXTERNO",
      },
      token: "jwt-token",
    });

    renderGuard("INTERNO");

    expect(mockRouter.push).toHaveBeenCalledWith("/externo/mis-tramites");
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});
