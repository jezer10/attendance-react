import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import AutomationPage from "../pages/AutomationPage";
import ErrorPage from "../components/ErrorPage";
import { queryClient as appQueryClient } from "../lib/queryClient";

const renderWithRouter = (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AutomationPage />,
        errorElement: <ErrorPage />,
        children: [{ index: true, lazy: () => import("../pages/AutomationPage") as never }],
      },
      { path: "/login", element: <div>LOGIN</div> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
    { initialEntries: [path] }
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

describe("router smoke", () => {
  it("renders the ForgotPasswordPage at /forgot-password", () => {
    renderWithRouter("/forgot-password");
    expect(screen.getByRole("heading", { name: /recuperar contraseña/i })).toBeInTheDocument();
  });

  it("exports the shared queryClient (used by the app)", () => {
    expect(appQueryClient).toBeDefined();
  });
});
