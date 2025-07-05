/**
 * Logo oficial de AiDuxCare
 * Tres círculos entrelazados: Azul (IA), Verde menta (Seguridad clínica), Coral (Cuidado humano)
 * Intersección en verde #5DA5A3 simbolizando la unión de los tres pilares
 */

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", showText = true }) => {
  const dimensions = {
    sm: { width: 32, height: 32, circleR: 8, fontSize: "text-lg" },
    md: { width: 40, height: 40, circleR: 10, fontSize: "text-xl" },
    lg: { width: 56, height: 56, circleR: 14, fontSize: "text-2xl" },
  };

  const { width, height, circleR, fontSize } = dimensions[size];

  return (
    <div className="flex items-center space-x-3">
      {/* Logo SVG con tres círculos entrelazados */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 40 40"
        className="flex-shrink-0"
      >
        {/* Círculo Azul - IA/Tecnología */}
        <circle cx="15" cy="15" r={circleR} fill="#2C3E50" opacity="0.8" />

        {/* Círculo Verde menta - Seguridad clínica */}
        <circle cx="25" cy="15" r={circleR} fill="#A8E6CF" opacity="0.8" />

        {/* Círculo Coral - Cuidado humano */}
        <circle cx="20" cy="25" r={circleR} fill="#FF6F61" opacity="0.8" />

        {/* Intersección central - Unión de los tres pilares */}
        <circle cx="20" cy="18" r="3" fill="#5DA5A3" />
      </svg>

      {/* Texto del logo */}
      {showText && (
        <div>
          <h1
            className={`font-semibold ${fontSize}`}
            style={{ color: "#2C3E50", fontFamily: "Inter, sans-serif" }}
          >
            AiDuxCare
          </h1>
          {size !== "sm" && (
            <p className="text-sm" style={{ color: "#BDC3C7" }}>
              Asistente Clínico Inteligente
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
