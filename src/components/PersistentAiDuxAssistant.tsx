/**
 * BOT: PERSISTENT AIDUX ASSISTANT - AIDUXCARE V.2
 * Asistente virtual persistente que está siempre disponible
 * Aparece en todas las páginas después de la autenticación
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PersistentAiDuxAssistantProps {
  className?: string;
}

const PersistentAiDuxAssistant: React.FC<PersistentAiDuxAssistantProps> = ({ 
  className = '' 
}) => {
  const { isAuthenticated } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'help' | 'quick'>('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'assistant', content: string}>>([
    { type: 'assistant', content: '¡Hola! Soy AiDux, tu asistente virtual. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Solo mostrar si está autenticado
  if (!isAuthenticated) return null;

  const quickActions = [
    { icon: '👥', label: 'Ver Pacientes', action: 'navigate_to_patients' },
    { icon: '➕', label: 'Nuevo Paciente', action: 'navigate_to_new_patient' },
    { icon: 'MIC:', label: 'Iniciar Sesión', action: 'navigate_to_session' },
    { icon: 'NOTES:', label: 'Ayuda SOAP', action: 'help_soap' },
    { icon: '⚙️', label: 'Configuración', action: 'navigate_to_settings' },
    { icon: '❓', label: 'Soporte', action: 'navigate_to_help' }
  ];

  const helpTopics = [
    {
      title: 'Transcripción de Audio',
      description: 'Cómo usar la transcripción inteligente',
      icon: 'MIC:'
    },
    {
      title: 'Generación SOAP',
      description: 'Crear notas SOAP automáticamente',
      icon: 'NOTES:'
    },
    {
      title: 'Gestión de Pacientes',
      description: 'Administrar tu lista de pacientes',
      icon: '👥'
    },
    {
      title: 'Configuración',
      description: 'Ajustar preferencias del sistema',
      icon: '⚙️'
    }
  ];

  const handleQuickAction = (action: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let response = '';
      switch (action) {
        case 'navigate_to_patients':
          response = 'Te ayudo a navegar a la lista de pacientes. Puedes acceder desde el menú lateral o usar el enlace "Dashboard de Pacientes".';
          break;
        case 'navigate_to_new_patient':
          response = 'Para crear un nuevo paciente, ve al menú lateral y selecciona "Nuevo Paciente". También puedes usar el botón de acceso rápido.';
          break;
        case 'navigate_to_session':
          response = 'Para iniciar una sesión clínica, selecciona "Sesión Clínica" en el menú lateral. Allí podrás grabar audio y generar SOAP automáticamente.';
          break;
        case 'help_soap':
          response = 'El sistema genera automáticamente notas SOAP basadas en la transcripción. Puedes revisar y editar el contenido antes de guardarlo.';
          break;
        case 'navigate_to_settings':
          response = 'La configuración está disponible en el menú lateral. Allí puedes ajustar preferencias de audio, transcripción y más.';
          break;
        case 'navigate_to_help':
          response = 'El centro de ayuda está en el menú lateral. También puedes preguntarme cualquier duda sobre el sistema.';
          break;
        default:
          response = 'Te ayudo con esa acción. ¿Puedes ser más específico sobre lo que necesitas?';
      }
      setMessages(prev => [...prev, { type: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInputValue('');
    setIsTyping(true);

    // Simular respuesta del asistente
    setTimeout(() => {
      let response = '';
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
        response = '¡Hola! ¿En qué puedo ayudarte hoy? Puedo asistirte con transcripción, SOAP, gestión de pacientes y más.';
      } else if (lowerMessage.includes('soap') || lowerMessage.includes('nota')) {
        response = 'Las notas SOAP se generan automáticamente desde la transcripción. El sistema clasifica la información en Subjetivo, Objetivo, Assessment y Plan. Puedes revisar y editar antes de guardar.';
      } else if (lowerMessage.includes('transcripción') || lowerMessage.includes('audio')) {
        response = 'La transcripción funciona en tiempo real durante las sesiones. Usa el botón de grabación y el sistema transcribirá automáticamente la conversación con alta precisión.';
      } else if (lowerMessage.includes('paciente') || lowerMessage.includes('lista')) {
        response = 'Para ver tus pacientes, usa "Dashboard de Pacientes" en el menú lateral. Allí puedes ver historiales, crear nuevos pacientes y acceder a sesiones anteriores.';
      } else if (lowerMessage.includes('ayuda') || lowerMessage.includes('soporte')) {
        response = 'Estoy aquí para ayudarte. Puedes usar las acciones rápidas o preguntarme cualquier cosa sobre el sistema. También hay un centro de ayuda en el menú lateral.';
      } else {
        response = 'Entiendo tu consulta. ¿Te refieres a transcripción, SOAP, gestión de pacientes o configuración? Puedo darte información específica sobre cualquiera de estos temas.';
      }

      setMessages(prev => [...prev, { type: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${className}`}>
      {/* Botón flotante cuando está minimizado */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white text-2xl"
          title="Abrir AiDux Assistant"
        >
          BOT:
        </button>
      )}

      {/* Panel principal */}
      {!isMinimized && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-80 max-h-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">BOT:</span>
                </div>
                <div>
                  <div className="text-white font-semibold">AiDux Assistant</div>
                  <div className="text-white/80 text-sm">Tu asistente virtual</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title={isExpanded ? "Contraer" : "Expandir"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Minimizar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="h-80 flex flex-col">
            {/* Navegación de vistas */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setCurrentView('chat')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  currentView === 'chat' 
                    ? 'text-[#5DA5A3] border-b-2 border-[#5DA5A3]' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setCurrentView('help')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  currentView === 'help' 
                    ? 'text-[#5DA5A3] border-b-2 border-[#5DA5A3]' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ❓ Ayuda
              </button>
              <button
                onClick={() => setCurrentView('quick')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  currentView === 'quick' 
                    ? 'text-[#5DA5A3] border-b-2 border-[#5DA5A3]' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ⚡ Rápido
              </button>
            </div>

            {/* Vista Chat */}
            {currentView === 'chat' && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.type === 'user'
                            ? 'bg-[#5DA5A3] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="px-4 py-2 bg-[#5DA5A3] text-white rounded-lg hover:bg-[#4A8280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vista Ayuda */}
            {currentView === 'help' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {helpTopics.map((topic, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{topic.icon}</span>
                        <div>
                          <h4 className="font-medium text-slate-900">{topic.title}</h4>
                          <p className="text-sm text-slate-600">{topic.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista Acciones Rápidas */}
            {currentView === 'quick' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-center"
                    >
                      <div className="text-2xl mb-1">{action.icon}</div>
                      <div className="text-xs font-medium text-slate-700">{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersistentAiDuxAssistant; 