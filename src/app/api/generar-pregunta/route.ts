import { NextRequest, NextResponse } from 'next/server';
import { groqClient } from '@/lib/groq/client';
import { METODOLOGIA_UNAM, TEMARIO_UNAM } from '@/data/unam_temario';
import type { 
  SolicitudGenerarPregunta, 
  RespuestaGenerarPregunta,
  PreguntaGenerada 
} from '@/types/ia';

export async function POST(request: NextRequest): Promise<NextResponse<RespuestaGenerarPregunta>> {
  try {
    const body: SolicitudGenerarPregunta = await request.json();
    
    const { id_materia } = body;
    
    if (!id_materia || typeof id_materia !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El campo "id_materia" es requerido y debe ser un string' },
        { status: 400 }
      );
    }

    const materia = TEMARIO_UNAM.materias.find(m => m.id === id_materia);
    
    if (!materia) {
      return NextResponse.json(
        { success: false, error: `Materia "${id_materia}" no encontrada. Materias válidas: ${TEMARIO_UNAM.materias.map(m => m.id).join(', ')}` },
        { status: 400 }
      );
    }

    const temaAleatorio = materia.temas[Math.floor(Math.random() * materia.temas.length)];

    const systemPrompt = `${METODOLOGIA_UNAM.instrucciones_tutor}

Tu tarea es generar UNA pregunta de opción múltiple para un examen de admisión UNAM (Área 3: Ciencias Sociales).

Debes responder SOLO con JSON válido, sin texto adicional. Usa este formato exacto:
{
  "pregunta": "Texto de la pregunta",
  "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "respuestaCorrecta": "Opción correcta exacta",
  "justificacionDescarte": "Explicación de por qué las otras 3 opciones son incorrectas"
}`;

    const userPrompt = `Genera una pregunta sobre el tema: "${temaAleatorio}". La pregunta debe ser exclusivamente sobre este tema de ${materia.nombre}.`;

    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 1024,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!responseContent) {
      return NextResponse.json(
        { success: false, error: 'No se recibió respuesta de Groq' },
        { status: 500 }
      );
    }

    console.log('Groq response:', responseContent);

    let parsedQuestion: unknown = JSON.parse(responseContent);
    const question = parsedQuestion as Record<string, unknown>;
    
    const pregunta = String(question.pregunta || '');
    const opcionesRaw = question.opciones;
    const opciones = Array.isArray(opcionesRaw) ? opcionesRaw.map(String) : [];
    const respuestaCorrecta = String(question.respuestaCorrecta || '');
    const justificacionDescarte = String(question.justificacionDescarte || '');

    if (!pregunta || opciones.length !== 4 || !respuestaCorrecta || !justificacionDescarte) {
      console.log('Validation failed. parsed:', parsedQuestion);
      return NextResponse.json(
        { success: false, error: 'La respuesta de Groq no tiene el formato esperado' },
        { status: 500 }
      );
    }

    const validatedQuestion: PreguntaGenerada = {
      pregunta,
      opciones: opciones as [string, string, string, string],
      respuestaCorrecta,
      justificacionDescarte,
    };

    return NextResponse.json({
      success: true,
      data: validatedQuestion,
    });

  } catch (error) {
    console.error('Error en /api/generar-pregunta:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}