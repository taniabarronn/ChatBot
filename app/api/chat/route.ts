// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ChatRequestBody } from '@/types/chat';

// Inicializar el cliente del SDK con la clave del servidor
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('ADVERTENCIA: GEMINI_API_KEY no está configurada en .env.local');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La API Key de Gemini no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    const body: ChatRequestBody = await req.json();
    const { messages, config } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'El historial de mensajes no puede estar vacío.' },
        { status: 400 }
      );
    }

    // Formatear el historial para el SDK de Gemini
    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    // Configuración de los hiperparámetros del modelo
    const response = await ai.models.generateContent({
      model: config.modelName || 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: config.systemInstruction
          ? config.systemInstruction
          : undefined,
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        topP: config.topP,
        topK: config.topK,
      },
    });

    const replyText = response.text || 'Sin respuesta generada por el modelo.';

    return NextResponse.json({
      text: replyText,
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json(
      {
        error:
          error.message ||
          'Ocurrió un error al procesar la solicitud con Gemini.',
      },
      { status: 500 }
    );
  }
}