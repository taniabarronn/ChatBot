'use client';

import React from 'react';
import { ModelConfig } from '@/types/chat';
import {
  Sparkles,
  BookOpen,
  Sliders,
  RotateCcw,
  KeyRound,
  X,
} from 'lucide-react';

interface ConfigPanelProps {
  config: ModelConfig;
  onChange: (newConfig: ModelConfig) => void;
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
  onClose?: () => void;
}

const SYSTEM_PROMPT_PRESETS = [
  {
    label: 'Tutor de Software',
    prompt:
      'Eres un tutor universitario de desarrollo de software especializado en TypeScript, Next.js y algoritmos. Explica con claridad, ejemplos didácticos y buenas prácticas.',
  },
  {
    label: 'JSON Estricto',
    prompt:
      'Responde únicamente con un objeto JSON válido con la estructura: {"respuesta": string, "lenguaje": string, "complejidad": string}. Sin texto introductorio ni formato Markdown externo.',
  },
  {
    label: 'Arquitecto Cloud',
    prompt:
      'Eres un Arquitecto de Soluciones Cloud Senior. Evalúa escalabilidad, latencia, costos y patrones de resiliencia con tono técnico y conciso.',
  },
  {
    label: 'Code Reviewer',
    prompt:
      'Eres un revisor de código riguroso. Identifica vulnerabilidades de seguridad, cuellos de botella y violaciones a principios SOLID.',
  },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  apiKey = '',
  onApiKeyChange,
  onClose,
}) => {
  const handleChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleResetDefaults = () => {
    onChange({
      modelName: 'gemini-2.5-flash',
      systemInstruction:
        'Eres un tutor universitario de desarrollo de software especializado en TypeScript y arquitecturas web modernas.',
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    });
  };

  return (
    <aside className="w-full lg:w-84 xl:w-90 bg-[#0d0e17] border-l border-slate-800/80 p-5 flex flex-col gap-5 text-slate-200 overflow-y-auto h-full select-none z-30">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white tracking-wide">
              Parámetros del Modelo
            </h2>
            <p className="text-[10px] text-slate-400">Control de Hiperparámetros LLM</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleResetDefaults}
            title="Restablecer valores por defecto"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Cerrar panel"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* API Key Session Override */}
      {onApiKeyChange && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium flex items-center gap-1.5 text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              API Key (Gemini)
            </label>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                apiKey.trim()
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {apiKey.trim() ? 'En sesión' : 'Por .env.local'}
            </span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Pega tu clave AI Studio aquí..."
            className="w-full bg-[#141624] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            Prioridad: .env.local del servidor o clave ingresada aquí.
          </p>
        </div>
      )}

      {/* Selector de Modelo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Modelo Base
        </label>
        <select
          value={config.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          className="bg-[#141624] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
        >
          <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recomendado & Rápido)</option>
          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Baja Latencia)</option>
          <option value="gemini-3.7-flash">Gemini 3.7 Flash (Equilibrado)</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
        </select>
      </div>

      {/* Contexto / System Instruction */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-300 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            System Prompt (Rol)
          </label>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1">
          {SYSTEM_PROMPT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChange('systemInstruction', preset.prompt)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-600/40 hover:text-indigo-200 text-slate-400 border border-slate-700/60 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={config.systemInstruction}
          onChange={(e) => handleChange('systemInstruction', e.target.value)}
          placeholder="Ej: Eres un tutor universitario de desarrollo de software..."
          className="bg-[#141624] border border-slate-700/80 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
        />
        <p className="text-[10px] text-slate-400">
          Modela el rol, tono y restricciones del asistente antes de procesar el chat.
        </p>
      </div>

      <div className="h-px bg-slate-800/60 my-1" />

      {/* Sliders Container */}
      <div className="space-y-4">
        {/* Temperatura */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1">
              Temperatura
              <span className="text-[10px] text-slate-400">(Creatividad)</span>
            </label>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
              {config.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="accent-indigo-500 w-full cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium">
            <span>0.0 (Preciso)</span>
            <span>1.0 (Balance)</span>
            <span>2.0 (Creativo)</span>
          </div>
        </div>

        {/* Max Tokens de Salida */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1">
              Tokens Máximos
              <span className="text-[10px] text-slate-400">(Salida)</span>
            </label>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
              {config.maxOutputTokens}
            </span>
          </div>
          <input
            type="range"
            min="64"
            max="4096"
            step="64"
            value={config.maxOutputTokens}
            onChange={(e) => handleChange('maxOutputTokens', parseInt(e.target.value, 10))}
            className="accent-indigo-500 w-full cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium">
            <span>64 (Corto)</span>
            <span>1024 (Medio)</span>
            <span>4096 (Extenso)</span>
          </div>
        </div>

        {/* Top-P */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1">
              Top-P
              <span className="text-[10px] text-slate-400">(Nucleus)</span>
            </label>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
              {config.topP.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={config.topP}
            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
            className="accent-indigo-500 w-full cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Top-K */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1">
              Top-K
              <span className="text-[10px] text-slate-400">(Vocabulario)</span>
            </label>
            <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
              {config.topK}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={config.topK}
            onChange={(e) => handleChange('topK', parseInt(e.target.value, 10))}
            className="accent-indigo-500 w-full cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-medium">
            <span>1</span>
            <span>20</span>
            <span>40</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
