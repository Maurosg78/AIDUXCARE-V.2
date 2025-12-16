// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';

import { analyzeWithVertexProxy } from '@/services/vertex-ai-service-firebase';

import logger from '@/shared/utils/logger';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

interface VirtualAssistantProps {
  professionalRole: string;
  className?: string;
}

export const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  professionalRole,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `¡Hola! Soy tu asistente virtual especializado en ${professionalRole}. ¿En qué puedo ayudarte hoy?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generatePrompt = (userMessage: string, role: string): string => {
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Eres un asistente virtual especializado en ${role}. Tu objetivo es ayudar al profesional con:

1. Consultas clínicas y técnicas
2. Interpretación de resultados
3. Sugerencias de tratamiento
4. Información médica actualizada
5. Apoyo en la toma de decisiones clínicas

Responde de manera profesional, clara y concisa. Si no estás seguro de algo, indícalo claramente.

<|eot_id|><|start_header_id|>user<|end_header_id|>

${userMessage}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
  };

  const extractAssistantResponse = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;

    if (typeof data.response === 'string') return data.response;
    if (typeof data.text === 'string') return data.text;
    if (typeof data.summary === 'string') return data.summary;
    if (typeof data.answer === 'string') return data.answer;

    if (data.result && typeof data.result === 'string') return data.result;
    if (data.result?.text) return data.result.text;

    if (Array.isArray(data.candidates) && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      return data.choices[0].message.content as string;
    }

    if (Array.isArray(data.outputs) && data.outputs[0]?.content?.[0]?.text) {
      return data.outputs[0].content[0].text;
    }

    return typeof data === 'object' ? JSON.stringify(data) : '';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Pensando...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const prompt = generatePrompt(inputValue.trim(), professionalRole);
      const traceId = `virtual-assistant|role:${professionalRole}|ts:${Date.now()}`;

      const vertexResponse = await analyzeWithVertexProxy({
        action: 'analyze',
        prompt,
        traceId
      });

      const assistantContent = extractAssistantResponse(vertexResponse) || 'No response available.';

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: assistantContent.trim(),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(assistantMessage));
    } catch (error) {
      logger.error('Error al generar respuesta:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta de nuevo.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm flex flex-col h-full ${className}`} style={{ borderColor: '#BDC3C7' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5DA5A3' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: '#2C3E50' }}>
              Asistente Virtual
            </h3>
            <p className="text-xs" style={{ color: '#BDC3C7' }}>
              Especializado en {professionalRole}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
              style={{ 
                color: message.isUser ? 'white' : '#2C3E50',
                backgroundColor: message.isUser ? '#5DA5A3' : '#F8F9FA'
              }}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.timestamp)}
              </div>
              {message.isLoading && (
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu consulta..."
            className="flex-1 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ 
              borderColor: '#BDC3C7',
              color: '#2C3E50',
              fontFamily: 'Inter, sans-serif'
            }}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: inputValue.trim() && !isLoading ? '#5DA5A3' : '#BDC3C7',
              color: 'white'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        <div className="text-xs mt-2" style={{ color: '#BDC3C7' }}>
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </div>
      </div>
    </div>
  );
};

export default VirtualAssistant; 