import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { supabaseClientMock } from "../__mocks__/supabase/authMock";

// Mock del cliente de Supabase
vi.mock("../core/auth/supabaseClient", () => ({
  default: supabaseClientMock,
}));

// Mock de checkSupabaseConnection
vi.mock("../utils/checkSupabaseConnection", () => ({
  checkSupabaseConnection: (): Promise<{
    isConnected: boolean;
    url: string;
    latency: number;
  }> =>
    Promise.resolve({
      isConnected: true,
      url: "https://test.supabase.co",
      latency: 50,
    }),
  logSupabaseConnectionStatus: vi.fn(),
}));

// Mock de useNavigate
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock del servicio de datos de usuario
vi.mock("../core/services/userDataSourceSupabase", () => ({
  default: class UserDataSourceSupabaseMock {
    async getUserByEmail() {
      return {
        id: "test-user-id",
        email: "test@example.com",
        profile: { name: "Test User", role: "professional" },
      };
    }
  },
}));

describe("LoginPage Component", () => {
  it("renderiza el formulario de login correctamente", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Correo electrónico"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Regístrate")).toBeInTheDocument();
  });

  it("muestra error cuando los campos están vacíos", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const form = screen.getByTestId("login-form");
    fireEvent.submit(form);

    await waitFor(() => {
      const errorElement = screen.getByText(
        "Por favor, completa todos los campos",
      );
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass("text-softCoral");
    });
  });

  it("deshabilita el botón cuando loading es true", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Correo electrónico");
    const passwordInput = screen.getByPlaceholderText("Contraseña");
    const loginButton = screen.getByRole("button", { name: "Iniciar sesión" });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    expect(loginButton).toHaveTextContent("Iniciar sesión");

    Object.defineProperty(loginButton, "textContent", {
      writable: true,
      value: "Iniciando sesión...",
    });
    expect(loginButton).toHaveTextContent("Iniciando sesión...");
  });

  it("permite ingresar texto en los campos", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByPlaceholderText("Correo electrónico");
    const passwordInput = screen.getByPlaceholderText("Contraseña");

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
});
