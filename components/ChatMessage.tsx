'use client';

import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { User, Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  modelName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, modelName = 'asistenteGPT' }) => {
  const isUser = message.role === 'user';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse content into text blocks and code blocks
  const renderFormattedContent = (content: string) => {
    // Check if content has triple backticks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
        const language = hasLang ? firstLine : 'code';
        const codeText = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div
            key={index}
            className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#0d0f17] shadow-lg"
          >
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#131520] border-b border-slate-800/80 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 uppercase font-semibold tracking-wider text-[11px] text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500/80 inline-block" />
                {language}
              </span>
              <button
                onClick={() => copyToClipboard(codeText, index)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                title="Copiar código"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            {/* Code Content */}
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Render regular text with markdown styling (bold, inline code, paragraphs)
      return (
        <div key={index} className="space-y-2 whitespace-pre-wrap leading-relaxed text-sm">
          {part.split('\n\n').map((paragraph, pIdx) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={pIdx} className="leading-relaxed text-slate-200">
                {paragraph.split('\n').map((line, lIdx) => {
                  const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                  const isNumbered = /^\d+\.\s/.test(line.trim());
                  
                  return (
                    <span key={lIdx} className={isBullet || isNumbered ? 'block pl-4 my-1' : 'block'}>
                      {isBullet && <span className="text-indigo-400 mr-2 font-bold">•</span>}
                      {formatInlineMarkdown(isBullet ? line.trim().replace(/^[-*]\s+/, '') : line)}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for inline bold and code
  const formatInlineMarkdown = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((seg, i) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/60"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  };

  return (
    <div className={`flex w-full my-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex gap-3 max-w-[85%] lg:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
            isUser
              ? 'bg-slate-800 border border-slate-700 text-slate-300'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-amber-500/10 shadow-md'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <span className="text-sm">✍🏻</span>}
        </div>

        {/* Message Bubble Container */}
        <div className="flex flex-col min-w-0">
          {/* Author Header (sin timestamp) */}
          <div className={`flex items-center gap-1.5 mb-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[12px] font-semibold text-slate-300">
              {isUser ? 'Tú' : modelName}
            </span>
          </div>

          {/* Bubble content */}
          <div
            className={`rounded-2xl px-5 py-3.5 shadow-sm transition-all ${
              isUser
                ? 'bg-[#1e2230] border border-slate-700/80 text-white rounded-tr-none'
                : 'bg-[#11131c] border border-slate-800/90 text-slate-100 rounded-tl-none shadow-md'
            }`}
          >
            {renderFormattedContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
};
