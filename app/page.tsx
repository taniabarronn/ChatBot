'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, ModelConfig, ChatThread, UsageMetadata } from '@/types/chat';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import {
  Sparkles,
  Trash2,
  Download,
  Plus,
  MessageSquare,
  BarChart3,
  Menu,
  X,
  Info,
} from 'lucide-react';

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome-1',
  role: 'model',
  content: '¡Hola! Soy asistenteGPT, tu asistente inteligente. ¿En qué te puedo ayudar hoy?',
  timestamp: new Date(),
};

const STARTER_PROMPTS = [
  {
    title: 'Clima',
    prompt: '¿Cuál es el clima en tu ciudad hoy?',
  },
];

export default function ChatPage() {
  // Model Config State
  const [config] = useState<ModelConfig>({
    modelName: 'gemini-3.8-flash',
    systemInstruction:
      'Eres TIBGPT, un asistente inteligente experto, amable, preciso y con excelentes conocimientos en tecnología, software y gastronomía. Responde de forma clara, directa y estructurada sin rodeos innecesarios.',
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.95,
    topK: 40,
  });

  // Threads / Conversations State
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'thread-1',
      title: 'Conversación inicial',
      updatedAt: 'ahora',
      messages: [INITIAL_MESSAGE],
      config: {
        modelName: 'gemini-3.8-flash',
        systemInstruction: '',
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
      },
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  // UI Panels State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);

  // Usage statistics tracking
  const [totalTokensUsed, setTotalTokensUsed] = useState<number>(0);
  const [lastUsage, setLastUsage] = useState<UsageMetadata | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle switching threads
  const handleSelectThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setActiveThreadId(threadId);
      setMessages(thread.messages.length > 0 ? thread.messages : [INITIAL_MESSAGE]);
    }
    setIsSidebarOpen(false);
  };

  // Create new thread
  const handleNewThread = () => {
    const newId = `thread-${createId()}`;
    const newThread: ChatThread = {
      id: newId,
      title: 'Nueva conversación',
      updatedAt: 'ahora',
      messages: [INITIAL_MESSAGE],
      config: { ...config },
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setMessages([INITIAL_MESSAGE]);
    setIsSidebarOpen(false);
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Update thread title if first user prompt
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const isFirstUserMsg = !t.messages.some((m) => m.role === 'user');
          const title = isFirstUserMsg
            ? text.slice(0, 26) + (text.length > 26 ? '...' : '')
            : t.title;
          return {
            ...t,
            title,
            updatedAt: 'ahora',
            messages: updatedMessages,
          };
        }
        return t;
      })
    );

    try {
      // Filter user and model turns for the Gemini SDK
      const payloadMessages = updatedMessages
        .filter((m) => m.role === 'user' || m.role === 'model')
        .map((m) => ({
          role: m.role as 'user' | 'model',
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          config: config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servidor.');
      }

      const botMessage: Message = {
        id: createId(),
        role: 'model',
        content: data.text,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Track usage tokens
      if (data.usageMetadata) {
        setLastUsage(data.usageMetadata);
        const tokens = data.usageMetadata.totalTokenCount || 0;
        setTotalTokensUsed((prev) => prev + tokens);
      }

      // Update thread
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: finalMessages } : t))
      );
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Error al procesar la solicitud.';
      const errorMessage: Message = {
        id: createId(),
        role: 'model',
        content: `⚠️ **Error en la solicitud:** ${errMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('¿Deseas vaciar los mensajes de esta conversación?')) {
      setMessages([INITIAL_MESSAGE]);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [INITIAL_MESSAGE] } : t))
      );
    }
  };

  const handleExportChat = () => {
    const textData = messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'Usuario' : 'asistenteGPT'}:\n\n${m.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([textData], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistenteGPT-chat-${createId()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen bg-[#090a0f] text-slate-100 overflow-hidden font-sans select-none">
      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d0f17] border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">✍🏻</span>
            <span className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
              asistenteGPT
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Thread Button */}
        <div className="p-3">
          <button
            onClick={handleNewThread}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-medium transition-all group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform" />
              Nueva conversación
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘N
            </span>
          </button>
        </div>

        {/* RECENTS Thread List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Recientes
          </p>
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white font-medium border border-slate-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate flex-1">{thread.title}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Links */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 text-xs">
          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Métricas de Tokens</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Limpiar conversación</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* ===================== MAIN CHAT AREA (FULL WIDTH, NO RIGHT PANEL) ===================== */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#090a0f]">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#0c0d14]/90 px-4 lg:px-8 flex items-center justify-between backdrop-blur-md z-20">
          {/* Left section: mobile toggle & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-lg">✍🏻</span>
              <h1 className="text-white font-semibold text-sm">asistenteGPT</h1>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Online
              </span>
            </div>
          </div>

          {/* Right section: Action buttons (Clean, no right-panel sliders) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Prompts</span>
            </button>

            <button
              onClick={handleClearHistory}
              title="Limpiar Conversación"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            <button
              onClick={handleExportChat}
              title="Exportar como Markdown"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </header>

        {/* Chat Messages Body */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-12 py-6">
          <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
            {/* If only welcome message, show Starter Prompt chips */}
            {messages.length <= 1 && (
              <div className="my-auto py-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl mb-4 shadow-lg shadow-amber-500/10">
                  ✍🏻
                </div>
                <h2 className="text-base font-semibold text-white mb-1">
                  Bienvenido a asistenteGPT
                </h2>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Asistente inteligente full-stack potenciado por Google Gemini. Puedes hacerme preguntas técnicas, redactar textos o consultar sobre cualquier tema.
                </p>

                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="px-3.5 py-2 rounded-xl bg-[#12141f] hover:bg-[#1c2033] border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 hover:text-white transition-all shadow-sm hover:scale-[1.01] active:scale-95"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages list */}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                modelName="asistenteGPT"
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex w-full my-3 justify-start animate-fade-in">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm shrink-0 shadow-md">
                    ✍🏻
                  </div>
                  <div className="bg-[#11131c] border border-slate-800/90 rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-2">
                    <span className="text-xs text-slate-400">asistenteGPT está pensando</span>
                    <div className="flex items-center gap-1.5 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Floating Input Box */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenPromptsModal={() => setShowPromptsModal(true)}
        />
      </div>

      {/* ===================== MODAL: USAGE ANALYTICS ===================== */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Métricas de asistenteGPT</h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Tokens</span>
                <span className="text-xl font-bold text-white font-mono">{totalTokensUsed}</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Mensajes Activos</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {messages.length}
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tokens de Entrada</span>
                <span className="text-sm font-semibold text-slate-200 font-mono">
                  {lastUsage?.promptTokenCount || 0}
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tokens de Salida</span>
                <span className="text-sm font-semibold text-slate-200 font-mono">
                  {lastUsage?.candidatesTokenCount || 0}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Tokens consumidos en tiempo real vía <code className="text-white">usageMetadata</code> del SDK de Gemini.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PROMPTS LIBRARY ===================== */}
      {showPromptsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Prompts Rápidos</h3>
              </div>
              <button
                onClick={() => setShowPromptsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {STARTER_PROMPTS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300">{item.title}</span>
                    <button
                      onClick={() => {
                        handleSendMessage(item.prompt);
                        setShowPromptsModal(false);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                    >
                      Ejecutar
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.prompt}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPromptsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
