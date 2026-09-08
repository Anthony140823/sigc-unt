'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api/cliente';
import { cn } from '@/lib/utils/cn';

interface Mensaje {
  rol: 'user' | 'bot';
  texto: string;
  acciones?: { etiqueta: string; ruta: string }[];
}

type Status = 'idle' | 'loading' | 'error';

export default function ChatBotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [noAnimacion, setNoAnimacion] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([{
        rol: 'bot',
        texto: '¡Hola! Soy el asistente virtual del **SIGC-UNT**. ¿En qué puedo ayudarte?',
        acciones: [
          { etiqueta: '📋 ¿Qué módulos hay?', ruta: '' },
          { etiqueta: '📊 Estadísticas rápidas', ruta: '' },
          { etiqueta: '❓ ¿Cómo funciona CAPA?', ruta: '' },
        ],
      }]);
    }
  }, [abierto, mensajes.length]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviar = useCallback(async (texto?: string) => {
    const msg = (texto ?? input).trim();
    if (!msg || status === 'loading') return;

    setInput('');
    setMensajes((prev) => [...prev, { rol: 'user', texto: msg }]);
    setStatus('loading');
    setNoAnimacion(true);

    try {
      const { data: res } = await api.post('/chatbot/consultar', { mensaje: msg });
      const datos = res.datos ?? res;
      setMensajes((prev) => [
        ...prev,
        { rol: 'bot', texto: datos.mensaje, acciones: datos.acciones },
      ]);
      setStatus('idle');
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          rol: 'bot',
          texto: 'Lo siento, ocurrió un error al procesar tu consulta. Intenta de nuevo.',
        },
      ]);
      setStatus('error');
    }
  }, [input, status]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const formatearTexto = (texto: string) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          abierto ? 'bg-gray-700 text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700',
        )}
        aria-label={abierto ? 'Cerrar chat' : 'Abrir asistente virtual'}
      >
        {abierto ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Panel de chat */}
      <div
        className={cn(
          'fixed bottom-20 right-5 z-50 w-80 sm:w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-300',
          abierto ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-blue-600 px-4 py-3">
          <Bot className="h-5 w-5 text-white" />
          <span className="text-sm font-semibold text-white">Asistente SIGC-UNT</span>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
            En línea
          </span>
        </div>

        {/* Mensajes */}
        <div ref={chatRef} className="h-80 space-y-3 overflow-y-auto p-4">
          {mensajes.map((m, i) => (
            <div key={i} className={cn('flex', m.rol === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.rol === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: formatearTexto(m.texto) }} />

                {m.acciones && m.acciones.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.acciones.map((acc, j) => {
                      if (acc.ruta) {
                        return (
                          <a
                            key={j}
                            href={acc.ruta}
                            className="inline-block rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-blue-700 shadow-sm hover:bg-white"
                          >
                            {acc.etiqueta}
                          </a>
                        );
                      }
                      return (
                        <button
                          key={j}
                          onClick={() => enviar(acc.etiqueta.replace(/^[^\s]+\s/, ''))}
                          className="rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-blue-700 shadow-sm hover:bg-white"
                        >
                          {acc.etiqueta}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {status === 'loading' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-gray-100 p-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta..."
            disabled={status === 'loading'}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
          />
          <button
            onClick={() => enviar()}
            disabled={status === 'loading' || !input.trim()}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
