/**
 * 🧪 Prompt Testing Widget - Control A/B Testing
 * Widget para que Mauricio pueda alternar entre prompts durante user testing
 */

import React, { useState, useEffect } from "react";
import { NLPServiceOllama } from "../../services/nlpServiceOllama";
import { Button } from "../../shared/components/UI/Button";

interface PromptTestingWidgetProps {
  className?: string;
  onConfigChange?: (config: {
    promptVersion: string;
    testingMode: boolean;
  }) => void;
}

export const PromptTestingWidget: React.FC<PromptTestingWidgetProps> = ({
  className = "",
  onConfigChange,
}) => {
  const [config, setConfig] = useState(() =>
    NLPServiceOllama.getTestingConfig(),
  );
  const [isVisible, setIsVisible] = useState(false);

  // Update config when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newConfig = NLPServiceOllama.getTestingConfig();
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    }, 1000);

    return () => clearInterval(interval);
  }, [onConfigChange]);

  const handlePromptVersionChange = (version: "current" | "v2") => {
    NLPServiceOllama.setPromptVersion(version);
    const newConfig = NLPServiceOllama.getTestingConfig();
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleTestingModeToggle = () => {
    const newMode = !config.testingMode;
    NLPServiceOllama.setTestingMode(newMode);
    const newConfig = NLPServiceOllama.getTestingConfig();
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg"
          title="Abrir controles de testing"
        >
          🧪
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🧪 Prompt Testing
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Prompt Version Control */}
      <div className="mb-4">
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Versión de Prompt
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => handlePromptVersionChange("current")}
            variant={config.promptVersion === "current" ? "primary" : "outline"}
            className="flex-1 text-sm"
          >
            Original
          </Button>
          <Button
            onClick={() => handlePromptVersionChange("v2")}
            variant={config.promptVersion === "v2" ? "primary" : "outline"}
            className="flex-1 text-sm"
          >
            Optimizado v2
          </Button>
        </div>
      </div>

      {/* Testing Mode Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.testingMode}
            onChange={handleTestingModeToggle}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Modo Testing (Auto-log)</span>
        </label>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Estado Actual
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Prompt:</span>
            <span
              className={`font-medium ${
                config.promptVersion === "v2"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {config.promptVersion === "v2" ? "Optimizado v2" : "Original"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Auto-logging:</span>
            <span
              className={`font-medium ${
                config.testingMode ? "text-green-600" : "text-gray-500"
              }`}
            >
              {config.testingMode ? "Habilitado" : "Deshabilitado"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Instructions */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
        <h5 className="text-xs font-medium text-blue-800 mb-1">
          💡 Testing Guide
        </h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Alterna entre prompts por sesión</li>
          <li>• Habilita auto-log para métricas</li>
          <li>• Anota observaciones manuales</li>
          <li>• Compara timeouts y calidad</li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => {
            console.log("📊 Current Testing Config:", config);
            alert(
              `Testing Config:\nPrompt: ${config.promptVersion}\nAuto-log: ${config.testingMode ? "ON" : "OFF"}`,
            );
          }}
          variant="outline"
          className="flex-1 text-xs"
        >
          Ver Config
        </Button>
        <Button
          onClick={() => {
            const version =
              config.promptVersion === "current" ? "v2" : "current";
            handlePromptVersionChange(version);
          }}
          variant="secondary"
          className="flex-1 text-xs"
        >
          Alternar
        </Button>
      </div>
    </div>
  );
};

export default PromptTestingWidget;
