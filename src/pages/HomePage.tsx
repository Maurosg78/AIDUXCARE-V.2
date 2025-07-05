/**
 * 🏠 Home Page - AiDuxCare V.2
 * Página de bienvenida con identidad visual oficial
 */

import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7F7" }}>
      {/* Header Simple */}
      <header className="bg-white border-b" style={{ borderColor: "#BDC3C7" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Logo size="md" showText={true} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section Limpio */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl font-bold mb-6"
            style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
          >
            Documentación Clínica Inteligente
            <br />
            para Fisioterapia
          </h1>
          <p
            className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#5A879B" }}
          >
            Transcripción automática de consultas y generación de notas SOAP con
            inteligencia artificial especializada en fisioterapia.
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/professional-workflow"
              className="text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all"
              style={{
                backgroundColor: "#FF6F61",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Acceder al Sistema
            </Link>
            <Link
              to="/audio-processing"
              className="px-8 py-3 rounded-lg font-medium border transition-all hover:opacity-80"
              style={{
                color: "#2C3E50",
                borderColor: "#BDC3C7",
                backgroundColor: "white",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Ver Demo
            </Link>
          </div>
        </div>

        {/* Features Grid Simple */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#A8E6CF" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#2C3E50" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
            >
              Transcripción Automática
            </h3>
            <p className="text-sm" style={{ color: "#7F8C8D" }}>
              Convierte conversaciones médicas en texto preciso con IA
              especializada
            </p>
          </div>

          <div className="text-center">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#A8E6CF" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#2C3E50" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
            >
              Notas SOAP
            </h3>
            <p className="text-sm" style={{ color: "#7F8C8D" }}>
              Genera documentación clínica estructurada automáticamente
            </p>
          </div>

          <div className="text-center">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#A8E6CF" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#2C3E50" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
            >
              100% Privado
            </h3>
            <p className="text-sm" style={{ color: "#7F8C8D" }}>
              Procesamiento local. Tus datos nunca salen de tu dispositivo
            </p>
          </div>
        </div>

        {/* Stats Simples */}
        <div
          className="rounded-2xl p-8 mb-16"
          style={{ backgroundColor: "white", border: "1px solid #BDC3C7" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: "#2C3E50" }}
              >
                95%
              </div>
              <div className="text-sm" style={{ color: "#7F8C8D" }}>
                Precisión en Transcripción
              </div>
            </div>
            <div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: "#2C3E50" }}
              >
                70%
              </div>
              <div className="text-sm" style={{ color: "#7F8C8D" }}>
                Reducción en Tiempo
              </div>
            </div>
            <div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: "#2C3E50" }}
              >
                100%
              </div>
              <div className="text-sm" style={{ color: "#7F8C8D" }}>
                Privacidad Garantizada
              </div>
            </div>
          </div>
        </div>

        {/* Tecnología Section */}
        <div className="text-center mb-16">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
          >
            Tecnología Local y Segura
          </h2>
          <p className="mb-8 max-w-2xl mx-auto" style={{ color: "#5A879B" }}>
            AiDuxCare utiliza inteligencia artificial que funciona completamente
            en tu dispositivo. Sin conexión a internet, sin envío de datos,
            máxima privacidad.
          </p>

          <div
            className="rounded-xl p-6 max-w-2xl mx-auto"
            style={{ backgroundColor: "#A8E6CF", border: "1px solid #5DA5A3" }}
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#2C3E50" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="font-semibold" style={{ color: "#2C3E50" }}>
                Certificación HIPAA
              </span>
            </div>
            <p className="text-sm" style={{ color: "#2C3E50" }}>
              Cumple con todas las normativas de privacidad médica
            </p>
          </div>
        </div>
      </main>

      {/* Footer Simple */}
      <footer
        className="border-t"
        style={{ backgroundColor: "white", borderColor: "#BDC3C7" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo size="sm" showText={true} />
            </div>

            <div
              className="flex space-x-6 text-sm"
              style={{ color: "#7F8C8D" }}
            >
              <Link
                to="/professional-workflow"
                className="hover:opacity-70"
                style={{ color: "#2C3E50" }}
              >
                Sistema Profesional
              </Link>
              <Link
                to="/audio-processing"
                className="hover:opacity-70"
                style={{ color: "#2C3E50" }}
              >
                Demo
              </Link>
            </div>
          </div>

          <div
            className="border-t mt-6 pt-6 text-center"
            style={{ borderColor: "#BDC3C7" }}
          >
            <p className="text-sm" style={{ color: "#7F8C8D" }}>
              © 2025 AiDuxCare. Tecnología de IA para fisioterapia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
