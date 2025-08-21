/**
 * WelcomePage - Página principal institucional de AiDuxCare
 * Diseño limpio y profesional con identidad corporativa
 * 
 * @version 2.0.0
 * @author AiDuxCare Development Team
 */

import { Logo } from "@/shared/components/Logo";

export function WelcomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 text-center">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-center gap-2 text-xl">
          <Logo />
        </div>
        <h1 className="text-4xl font-bold">Bienvenido a AiDuxCare</h1>
        <p className="text-neutral-400">Sistema de documentación clínica inteligente para profesionales de la salud</p>
        <ul className="grid gap-2 text-sm">
          <li>Seguridad Total</li>
          <li>IA Avanzada</li>
          <li>Eficiencia</li>
        </ul>
        <div className="flex gap-3 justify-center">
          <button data-testid="seed-button" className="px-4 py-2 rounded-xl border">Crear Datos de Prueba</button>
          <a href="/login" className="px-4 py-2 rounded-xl bg-white text-black">Iniciar Sesión</a>
        </div>
      </div>
    </main>
  );
} 