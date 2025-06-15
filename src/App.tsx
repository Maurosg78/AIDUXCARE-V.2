import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { router } from "@/router/index"; // Importa el router correcto
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;