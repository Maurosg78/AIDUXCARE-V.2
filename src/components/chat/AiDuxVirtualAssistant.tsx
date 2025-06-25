/**
 * BOT: AIDUX VIRTUAL ASSISTANT - UAT VERSION
 * 
 * Asistente virtual optimizado para UAT:
 * - Botón minimizar funcional
 * - Sin logos duplicados
 * - Interface clínica limpia
 * - Consultas técnicas especializadas
 */

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'aidux';
  timestamp: Date;
  type?: 'text' | 'technical' | 'warning';
}

interface VirtualAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  messages: ChatMessage[];
  inputValue: string;
}

const AiDuxVirtualAssistant: React.FC = () => {
  const [state, setState] = useState<VirtualAssistantState>({
    isOpen: false,
    isMinimized: false,
    isTyping: false,
    messages: [],
    inputValue: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (state.isOpen && !state.isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isOpen, state.isMinimized]);

  // Mostrar mensaje de bienvenida solo cuando se abre por primera vez
  useEffect(() => {
    if (state.isOpen && !state.isMinimized && state.messages.length === 0) {
      const timer = setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          message: 'BOT: Soy AIDUX, tu asistente médico especializado para fisioterapia.\n\nPuedo ayudarte con:\n• Configuración TENS, ultrasonido, tecarterapia\n• Protocolos clínicos específicos\n• Parámetros de tratamiento\n• Consultas técnicas avanzadas\n\n¿En qué puedo asistirte?',
          sender: 'aidux',
          timestamp: new Date(),
          type: 'text'
        };
        setState(prev => ({ 
          ...prev, 
          messages: prev.messages.length === 0 ? [welcomeMessage] : prev.messages 
        }));
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [state.isOpen, state.isMinimized]);

  const toggleChat = () => {
    setState(prev => ({ 
      ...prev, 
      isOpen: !prev.isOpen,
      isMinimized: false 
    }));
  };

  const minimizeChat = () => {
    setState(prev => ({ ...prev, isMinimized: true }));
  };

  const maximizeChat = () => {
    setState(prev => ({ ...prev, isMinimized: false }));
  };

  const closeChat = () => {
    setState(prev => ({ ...prev, isOpen: false, isMinimized: false }));
  };

  const sendMessage = async () => {
    if (!state.inputValue.trim() || state.isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: state.inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: '',
      isTyping: true
    }));

    // Simular conexión a LLM médico (en producción sería API real a Claude/GPT médico)
    setTimeout(() => {
      const aiResponse = generateLLMResponse(state.inputValue);
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
        isTyping: false
      }));
    }, 2000);
  };

  const generateLLMResponse = (userInput: string): ChatMessage => {
    // Simulación de respuesta de LLM médico especializado
    // En producción esto sería una llamada real a Claude Sonnet, GPT-4, etc.
    
    const input = userInput.toLowerCase();
    
    // Detectar tipo de consulta para simular respuesta especializada
    if (input.includes('tens') || input.includes('electroestimulación')) {
      return {
        id: `aidux-${Date.now()}`,
        message: `**Configuración TENS para Dolor Lumbar:**

**Parámetros Recomendados:**
• **Frecuencia:** 80-100 Hz (alta frecuencia) para analgesia inmediata
• **Duración de pulso:** 50-200 μs
• **Intensidad:** Hasta umbral motor suave (sin contracción visible)
• **Modalidad:** Continua o burst (2-4 Hz)
• **Tiempo:** 20-30 minutos por sesión

**Colocación de Electrodos:**
• Paravertebrales L1-L5 (bilateral)
• Distancia: 3-5 cm entre electrodos
• Evitar prominencias óseas

**Consideraciones:**
• Iniciar con intensidad baja y aumentar gradualmente
• Paciente debe sentir hormigueo confortable, no dolor
• Contraindicado en marcapasos, embarazo, heridas abiertas

¿Necesitas información sobre algún parámetro específico?`,
        sender: 'aidux',
        timestamp: new Date(),
        type: 'technical'
      };
    }

    if (input.includes('tecarterapia') || input.includes('globus') || input.includes('latigazo')) {
      return {
        id: `aidux-${Date.now()}`,
        message: `**Tecarterapia Globus 7000 - Latigazo Cervical:**

**Protocolo para Trapecios Post-Accidente:**

**Fase Aguda (0-72h):**
• **Modo:** Atérmico (sin calor)
• **Frecuencia:** 0.5-1 MHz
• **Potencia:** 20-30% (baja intensidad)
• **Tiempo:** 8-10 minutos
• **Electrodo:** Capacitivo 65mm

**Fase Subaguda (3-14 días):**
• **Modo:** Térmico suave
• **Frecuencia:** 0.5 MHz
• **Potencia:** 40-60%
• **Tiempo:** 12-15 minutos
• **Técnica:** Movimientos lentos y circulares

**Parámetros Específicos Globus 7000:**
• **Programa:** P03 (contracturas musculares)
• **Energía:** 150-200 J/cm²
• **Temperatura objetivo:** 40-42°C
• **Feedback:** Monitoreo continuo de temperatura

**Precauciones:**
• Evitar zona de fractura cervical
• No aplicar sobre tiroides
• Vigilar respuesta vascular

¿Quieres detalles sobre la progresión del tratamiento?`,
        sender: 'aidux',
        timestamp: new Date(),
        type: 'technical'
      };
    }

    // Respuesta genérica simulando LLM médico
    return {
      id: `aidux-${Date.now()}`,
      message: `Entiendo tu consulta médica. Como asistente especializado, puedo ayudarte con información técnica detallada.

Para brindarte la respuesta más precisa, ¿podrías proporcionar más contexto sobre:

• **Equipo específico** (modelo, marca)
• **Condición clínica** exacta
• **Fase del tratamiento** (aguda, subaguda, crónica)
• **Objetivos terapéuticos** específicos

Esto me permitirá generar protocolos y parámetros más precisos para tu caso.

*Conectado a base de conocimiento médico especializada*`,
      sender: 'aidux',
      timestamp: new Date(),
      type: 'text'
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const quickQuestions = [
    "Configuración TENS dolor lumbar",
    "Parámetros ultrasonido terapéutico",
    "Protocolo tecarterapia cervical",
    "Dosificación láser terapéutico"
  ];

  const handleQuickQuestion = (question: string) => {
    setState(prev => ({ ...prev, inputValue: question }));
  };

  return (
    <>
      {/* Botón Flotante Principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className={`w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${
            state.isOpen 
              ? 'bg-[#5DA5A3] hover:bg-[#4A8280] scale-95' 
              : 'bg-gradient-to-br from-[#5DA5A3] via-[#4A8280] to-[#3D6B69] hover:scale-110 hover:shadow-2xl'
          }`}
        >
          <div className="flex flex-col items-center justify-center p-2">
            <div className="w-8 h-8 mb-1 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-xs text-white font-bold tracking-wide bg-black/20 px-2 py-0.5 rounded-full">
              AIDUX
            </span>
          </div>
        </button>

        {/* Indicador de notificación */}
        {!state.isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#FF6F61] to-[#E55A50] rounded-full flex items-center justify-center notification-pulse shadow-lg">
            <span className="text-xs text-white font-bold">!</span>
          </div>
        )}
      </div>

      {/* Panel de Chat Minimizado */}
      {state.isOpen && state.isMinimized && (
        <div className="fixed bottom-24 right-6 w-[300px] bg-white rounded-xl shadow-xl border border-[#BDC3C7]/20 z-40">
          <div 
            className="bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] p-3 rounded-t-xl cursor-pointer hover:from-[#4A8280] hover:to-[#5DA5A3] transition-all"
            onClick={maximizeChat}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">AIDUX Assistant</h3>
                  <p className="text-white/90 text-xs">Click para expandir</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    maximizeChat();
                  }}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Maximizar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l-2-2m0 0l2-2m-2 2l6 0m6 0l2-2m0 0l-2 2m2-2l-6 0" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeChat();
                  }}
                  className="p-1 text-white/80 hover:text-white hover:bg-red-500/50 rounded transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Chat Completo */}
      {state.isOpen && !state.isMinimized && (
        <div className="fixed bottom-24 right-6 w-[420px] h-[550px] bg-white rounded-xl shadow-2xl border border-[#BDC3C7]/20 z-40 flex flex-col chat-bounce-enter">
          {/* Header con controles UAT */}
          <div className="bg-gradient-to-r from-[#5DA5A3] via-[#4A8280] to-[#3D6B69] p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">AIDUX Assistant</h3>
                  <p className="text-white/90 text-sm">Fisioterapia Especializada</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={minimizeChat}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="Minimizar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={closeChat}
                  className="p-2 text-white/80 hover:text-white hover:bg-red-500/50 rounded-full transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 chat-messages">
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} chat-bubble-animation`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-[#5DA5A3] text-white'
                      : message.type === 'technical'
                      ? 'bg-blue-50 border border-blue-200 text-[#2C3E50]'
                      : message.type === 'warning'
                      ? 'bg-[#FF6F61]/10 border border-[#FF6F61]/20 text-[#2C3E50]'
                      : 'bg-[#F7F7F7] text-[#2C3E50]'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {message.message}
                  </div>
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicador de escritura mejorado */}
            {state.isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#F7F7F7] p-3 rounded-lg chat-bubble-animation border border-[#5DA5A3]/20">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-[#5DA5A3] font-medium">Procesando consulta médica...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Preguntas Rápidas */}
          {state.messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-[#2C3E50]/60 mb-2 font-medium">Consultas técnicas frecuentes:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs p-2 bg-[#5DA5A3]/10 hover:bg-[#5DA5A3]/20 text-[#5DA5A3] rounded-lg border border-[#5DA5A3]/20 transition-all hover:scale-[1.02] text-left"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Mejorado */}
          <div className="p-4 border-t border-[#BDC3C7]/20 bg-gray-50/50">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={state.inputValue}
                onChange={(e) => setState(prev => ({ ...prev, inputValue: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Consulta técnica médica (ej: configuración TENS, parámetros tecarterapia...)"
                className="flex-1 px-4 py-3 border border-[#BDC3C7]/30 rounded-lg focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent text-sm bg-white"
                disabled={state.isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!state.inputValue.trim() || state.isTyping}
                className="px-4 py-3 bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white rounded-lg hover:from-[#4A8280] hover:to-[#5DA5A3] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiDuxVirtualAssistant; 