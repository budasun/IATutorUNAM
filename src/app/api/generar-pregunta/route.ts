import { NextRequest, NextResponse } from 'next/server';
import { groqClient } from '@/lib/groq/client';
import { METODOLOGIA_UNAM, TEMARIO_UNAM } from '@/data/unam_temario';
import type { 
  SolicitudGenerarPregunta, 
  RespuestaGenerarPregunta,
  PreguntaGenerada 
} from '@/types/ia';

const MAPA_SUPERINDICES: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺',
};

function formatearExponentes(texto: string): string {
  return texto.replace(/\^([0-9+\-]+)/g, (match, exponente) => {
    return exponente.split('').map((char: string) => MAPA_SUPERINDICES[char] || char).join('');
  });
}

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

REGLA DE FORMATO MATEMÁTICO (CRÍTICO): 
- Está ESTRICTAMENTE PROHIBIDO usar el símbolo '^' para exponentes.
- DEBES usar caracteres Unicode para superíndices.
- Ejemplos CORRECTOS vs INCORRECTOS:
  * Correcto: x², y³, z⁴, 2ⁿ, eˣ
  * Incorrecto: x^2, y^3, z^4, 2^n, e^x
- Para subíndices químicos usa: H₂O, CO₂, NaCl, O₂, N₂

Debes responder SOLO con JSON válido, sin texto adicional. Usa este formato exacto:
{
  "pregunta": "Texto de la pregunta",
  "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "respuestaCorrecta": "Opción correcta exacta",
  "justificacionDescarte": "La propiedad 'justificacionDescarte' debe ser una explicación exhaustiva y educativa. Si la materia es Matemáticas, Física o Química, DEBES mostrar el procedimiento paso a paso para llegar a la respuesta correcta y explicar brevemente por qué los otros incisos son errores comunes. Para las demás materias, aporta un dato complementario o contexto histórico/científico que amplíe el conocimiento del alumno sobre el tema.",
  "explicacionCorrecta": "Explicación detallada de por qué es correcta, con ejemplos adicionales. Si es Matemáticas, Física o Química, muestra la fórmula exacta y explícala paso a paso."
}`;

    const userPrompt = `Genera una pregunta sobre el tema: "${temaAleatorio}". La pregunta debe ser exclusivamente sobre este tema de ${materia.nombre}. IMPORTANTE: Usa superíndices Unicode (x², x³) y NO uses el símbolo caret (^x).`;

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

    console.log('Groq response (raw):', responseContent);

    let parsedQuestion: unknown = JSON.parse(responseContent);
    const question = parsedQuestion as Record<string, unknown>;
    
    const preguntaRaw = String(question.pregunta || '');
    const opcionesRaw = question.opciones;
    const respuestaCorrectaRaw = String(question.respuestaCorrecta || '');
    const justificacionDescarteRaw = String(question.justificacionDescarte || '');
    const explicacionCorrectaRaw = String(question.explicacionCorrecta || '');

    if (!preguntaRaw || !Array.isArray(opcionesRaw) || opcionesRaw.length !== 4 || !respuestaCorrectaRaw || !justificacionDescarteRaw || !explicacionCorrectaRaw) {
      console.log('Validation failed. parsed:', parsedQuestion);
      return NextResponse.json(
        { success: false, error: 'La respuesta de Groq no tiene el formato esperado' },
        { status: 500 }
      );
    }

    const pregunta = formatearExponentes(preguntaRaw);
    const opciones = opcionesRaw.map((op: unknown) => formatearExponentes(String(op)));
    const respuestaCorrecta = formatearExponentes(respuestaCorrectaRaw);
    const justificacionDescarte = formatearExponentes(justificacionDescarteRaw);
    const explicacionCorrecta = formatearExponentes(explicacionCorrectaRaw);

    console.log('Pregunta formateada:', pregunta);
    console.log('Opciones formateadas:', opciones);

    const validatedQuestion: PreguntaGenerada = {
      pregunta,
      opciones: opciones as [string, string, string, string],
      respuestaCorrecta,
      justificacionDescarte,
      explicacionCorrecta,
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
