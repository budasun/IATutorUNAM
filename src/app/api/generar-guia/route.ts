import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { materia, tema } = await req.json();

    if (!materia || !tema) {
      return NextResponse.json({ success: false, error: 'Faltan datos de materia o tema' }, { status: 400 });
    }

    const promptText = `
      Eres un tutor experto en el examen de admisión a la UNAM (Universidad Nacional Autónoma de México) para el Área 3 (Ciencias Sociales).
      Tu tarea es generar una "Píldora de Estudio" (un resumen muy conciso y directo al grano) sobre el siguiente tema:
      
      Materia: ${materia}
      Tema: ${tema}

      Reglas estrictas:
      1. Explica el tema en máximo 3 párrafos cortos y fáciles de digerir.
      2. Enfócate SOLO en lo que históricamente pregunta la UNAM sobre este tema (ve directo al grano, sin relleno).
      3. Extrae entre 3 y 5 "Puntos Clave" (bullet points) que el alumno debe memorizar obligatoriamente.
      4. Devuelve la respuesta ESTRICTAMENTE en formato JSON válido con la siguiente estructura:
      {
        "titulo": "Nombre del tema",
        "resumen": "Los 3 párrafos unidos por saltos de línea \\n\\n",
        "puntosClave": ["Punto 1", "Punto 2", "Punto 3"]
      }
      No incluyas markdown adicional fuera del JSON.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: promptText }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const respuestaIA = completion.choices[0]?.message?.content;
    if (!respuestaIA) throw new Error('Respuesta vacía de Groq');

    const guia = JSON.parse(respuestaIA);

    return NextResponse.json({ success: true, data: guia });
  } catch (error: unknown) {
    console.error('🔥 ERROR CRÍTICO EN GROQ (Guías):', error);
    const mensajeError = error instanceof Error ? error.message : 'Error desconocido de la API';
    return NextResponse.json({ 
      success: false, 
      error: `Fallo en la IA: ${mensajeError}` 
    }, { status: 500 });
  }
}