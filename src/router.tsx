import { createBrowserRouter } from "react-router-dom";
import { WelcomePage } from "@/features/welcome/WelcomePage";
import LoginPage from "@/features/auth/LoginPage";
import { NotFound } from "@/pages/NotFound";

export const router = createBrowserRouter([
  { path: "/", element: <WelcomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFound /> },
]);
