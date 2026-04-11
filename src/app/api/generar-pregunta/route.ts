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
    
    const { id_materia, area } = body;
    
    if (!id_materia || typeof id_materia !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El campo "id_materia" es requerido y debe ser un string' },
        { status: 400 }
      );
    }

    const areaMatch = area?.match(/Áreas? (\d)/);
    const areaKey: keyof typeof TEMARIO_UNAM = areaMatch 
      ? (`area${areaMatch[1]}` as keyof typeof TEMARIO_UNAM) 
      : 'area3';
    const areaData = TEMARIO_UNAM[areaKey];
    const materia = areaData.materias.find((m: { id: string }) => m.id === id_materia);
    
    if (!materia) {
      return NextResponse.json(
        { success: false, error: `Materia "${id_materia}" no encontrada en el área seleccionada` },
        { status: 400 }
      );
    }

    const temaAleatorio = materia.temas[Math.floor(Math.random() * materia.temas.length)];
    
    const esLectura = id_materia.toLowerCase().includes('espanol') || id_materia.toLowerCase().includes('literatura');
    const cantidad = esLectura ? 3 : 1;

    const systemPrompt = `${METODOLOGIA_UNAM.instrucciones_tutor}

Tu tarea es generar ${cantidad} pregunta(s) de nivel preparatoria.
${esLectura ? 'REGLA DE COMPRENSIÓN LECTORA: Escribe un texto de lectura original (2-3 párrafos). Luego genera 3 preguntas diferentes basadas ÚNICAMENTE en ese texto. Agrega el texto en la propiedad "textoLectura" de cada pregunta.' : 'Genera 1 pregunta directa sin texto de lectura.'}

REGLA DE FORMATO MATEMÁTICO (CRÍTICO): 
- Está ESTRICTAMENTE PROHIBIDO usar el símbolo '^' para exponentes.
- DEBES usar caracteres Unicode para superíndices.
- Ejemplos CORRECTOS vs INCORRECTOS:
  * Correcto: x², y³, z⁴, 2ⁿ, eˣ
  * Incorrecto: x^2, y^3, z^4, 2^n, e^x
- Para subíndices químicos usa: H₂O, CO₂, NaCl, O₂, N₂

Debes responder SOLO con JSON válido, sin texto adicional. Usa este formato exacto:
{
  "preguntas": [
    {
      "pregunta": "Texto de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": "Opción correcta exacta",
      "justificacionDescarte": "Explicación exhaustiva y educativa",
      "explicacionCorrecta": "Explicación detallada"
      ${esLectura ? ', "textoLectura": "Aquí va el texto completo..."' : ''}
    }
  ]
}`;

    const userPrompt = `Genera ${esLectura ? '3 preguntas basadas en un texto de comprensión lectora' : 'una pregunta'} sobre el tema: "${temaAleatorio}". La pregunta debe ser exclusivamente sobre este tema de ${materia.nombre}. IMPORTANTE: Usa superíndices Unicode (x², x³) y NO uses el símbolo caret (^x).`;

    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2048,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!responseContent) {
      return NextResponse.json(
        { success: false, error: 'No se recibió respuesta de Groq' },
        { status: 500 }
      );
    }

    console.log('Groq response (raw):', responseContent);

    const parsedResponse = JSON.parse(responseContent);
    const preguntasRaw = parsedResponse.preguntas;

    if (!Array.isArray(preguntasRaw) || preguntasRaw.length === 0) {
      return NextResponse.json(
        { success: false, error: 'La respuesta de Groq no tiene el formato esperado' },
        { status: 500 }
      );
    }

    const validatedQuestions: PreguntaGenerada[] = preguntasRaw.map((q: Record<string, unknown>) => {
      const preguntaRaw = String(q.pregunta || '');
      const opcionesRaw = q.opciones;
      const respuestaCorrectaRaw = String(q.respuestaCorrecta || '');
      const justificacionDescarteRaw = String(q.justificacionDescarte || '');
      const explicacionCorrectaRaw = String(q.explicacionCorrecta || '');
      const textoLecturaRaw = q.textoLectura ? String(q.textoLectura) : undefined;

      if (!preguntaRaw || !Array.isArray(opcionesRaw) || opcionesRaw.length !== 4 || !respuestaCorrectaRaw || !justificacionDescarteRaw || !explicacionCorrectaRaw) {
        throw new Error('Pregunta inválida en el array');
      }

      return {
        pregunta: formatearExponentes(preguntaRaw),
        opciones: opcionesRaw.map((op: unknown) => formatearExponentes(String(op))) as [string, string, string, string],
        respuestaCorrecta: formatearExponentes(respuestaCorrectaRaw),
        justificacionDescarte: formatearExponentes(justificacionDescarteRaw),
        explicacionCorrecta: formatearExponentes(explicacionCorrectaRaw),
        textoLectura: textoLecturaRaw ? formatearExponentes(textoLecturaRaw) : undefined,
      };
    });

    console.log('Preguntas generadas:', validatedQuestions.length);

    return NextResponse.json({
      success: true,
      data: validatedQuestions,
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
