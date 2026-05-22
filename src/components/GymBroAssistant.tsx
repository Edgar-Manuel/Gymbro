/**
 * Componente del Asistente GymBro
 * Chat flotante que se puede abrir desde cualquier página
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { orchestrator, type AgentContext } from '@/services/agents';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: {
    label: string;
    action: string;
    data?: unknown;
  }[];
}

export default function GymBroAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola! Soy GymBro Assistant. Pregúntame sobre nutrición, ejercicios, entrenamiento o tu progreso.',
          timestamp: new Date(),
          suggestedActions: [
            { label: 'Ver Mi Nutrición', action: 'navigate', data: { to: '/nutrition' } },
            { label: 'Aprender Técnica', action: 'navigate', data: { to: '/education' } },
            { label: 'Empezar a Entrenar', action: 'navigate', data: { to: '/workout' } },
          ],
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Obtener datos del usuario desde el store
      const { currentUser } = useAppStore.getState();

      // Construir contexto con datos reales del usuario
      const context: AgentContext = {
        currentPage: getCurrentPage(),
        user: currentUser ? {
          id: parseInt(currentUser.id),
          nombre: currentUser.nombre,
          peso: currentUser.peso || currentUser.pesoActual,
          altura: currentUser.altura,
          edad: currentUser.edad,
          physicalAssessment: currentUser.evaluacionFisica ? {
            estrategia: currentUser.evaluacionFisica.estrategia,
            prioridades: currentUser.evaluacionFisica.prioridades,
            proteinaMeta: currentUser.evaluacionFisica.proteinaMeta,
            caloriasExtra: currentUser.evaluacionFisica.caloriasExtra,
            puntosFuertes: currentUser.evaluacionFisica.puntosFuertes,
            areasMejora: currentUser.evaluacionFisica.areasMejora,
            notas: currentUser.evaluacionFisica.notas,
          } : undefined,
        } : undefined,
      };

      // Llamar al orquestador
      const response = await orchestrator.process(userMessage.content, context);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, verifica tu conexión y que la API key de Groq esté configurada correctamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: { action: string; data?: { to?: string } }) => {
    if (action.action === 'navigate' && action.data?.to) {
      navigate(action.data.to);
      // NO cerramos el chat, solo navegamos
    }
  };

  // Función para renderizar texto con formato markdown simple
  const renderMessageContent = (content: string) => {
    // Convertir **texto** a <strong>texto</strong>
    const parts = content.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Es texto en negrita
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getCurrentPage = (): AgentContext['currentPage'] => {
    const path = window.location.pathname;
    if (path.includes('exercises')) return 'exercises';
    if (path.includes('workout')) return 'workout';
    if (path.includes('progress')) return 'progress';
    if (path.includes('education')) return 'education';
    if (path.includes('nutrition')) return 'nutrition';
    if (path.includes('profile')) return 'profile';
    return 'dashboard';
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] z-50 flex flex-col bg-card sm:rounded-xl shadow-2xl border sm:border">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground sm:rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-bold">GymBro Assistant</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                        {renderMessageContent(line)}
                      </p>
                    ))}
                  </div>

                  {/* Acciones sugeridas */}
                  {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestedActions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Pregúntame lo que necesites..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
