import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/contexts/auth.context";
import ExternoRegistroPage from "@/app/(public)/externo/registro/page";

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const mockEnqueueSnackbar = vi.fn();
vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

function renderPage() {
  return render(
    <AuthProvider>
      <ExternoRegistroPage />
    </AuthProvider>,
  );
}

async function fillBaseFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre completo"), "Test User");
  await user.type(screen.getByLabelText("Email"), "test@test.com");
  await user.type(screen.getByLabelText("Documento (DNI/CUIT)"), "12345678");
  await user.type(screen.getByLabelText("Organización"), "Test Org");
}

describe("ExternoRegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("renders all fields", () => {
    renderPage();

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Documento (DNI/CUIT)")).toBeInTheDocument();
    expect(screen.getByLabelText("Organización")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
  });

  it("password validation - min 8 chars", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "Ab1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Ab1!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
    });
  });

  it("password validation - uppercase required", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "password1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "password1!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Debe contener al menos una mayúscula")).toBeInTheDocument();
    });
  });

  it("password validation - number required", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "Password!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Debe contener al menos un número")).toBeInTheDocument();
    });
  });

  it("password validation - special char required", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "Password1");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Debe contener al menos un carácter especial")).toBeInTheDocument();
    });
  });

  it("confirmation must match", async () => {
    const user = userEvent.setup();
    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "Password1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Different1!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();
    });
  });

  it("successful submit calls API, shows snackbar and redirects", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        token: "jwt-token",
        usuario: { id: "e1", nombre: "Test User", email: "test@test.com" },
      },
    });

    renderPage();

    await fillBaseFields(user);
    await user.type(screen.getByLabelText("Contraseña"), "Password1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Password1!");

    await waitFor(() => {
      expect(screen.getByLabelText("Nombre completo")).toHaveValue("Test User");
    });

    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/externo/mis-tramites");
    });
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith("Registro exitoso", { variant: "success" });
  });
});
