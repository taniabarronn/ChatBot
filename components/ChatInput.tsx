'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Loader2, Globe, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onOpenPromptsModal?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenPromptsModal,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <div className="relative bg-[#11131c]/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
        {/* Main Textarea */}
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje o presiona / para comandos... (Shift + Enter para salto de línea)"
          disabled={isLoading}
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 px-4 pt-3.5 pb-2 text-sm focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1 border-t border-slate-800/40">
          {/* Quick buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenPromptsModal}
              title="Comandos y Prompts rápidos"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Prompts</span>
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 bg-slate-900/60 border border-slate-800">
              <Globe className="w-3 h-3 text-indigo-400/80" />
              <span className="text-[10px] text-slate-400">Modo Directo</span>
            </div>
          </div>

          {/* Right side: Shortcut Hint + Send Button */}
          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-block text-[11px] text-slate-500 font-mono">
              Enter ↵ para enviar
            </span>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all flex items-center justify-center h-8 w-8 shadow-md shadow-indigo-600/20 active:scale-95 disabled:shadow-none"
              title="Enviar mensaje"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-[11px] text-slate-500 text-center mt-2 tracking-wide">
        El modelo puede cometer errores. Verifica la información técnica o clave.
      </p>
    </div>
  );
};
