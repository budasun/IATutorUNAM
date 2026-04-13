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
      Eres un tutor experto en el examen de admisión a la UNAM.
      Genera una "Píldora de Estudio" para:
      Materia: ${materia}
      Tema: ${tema}

      Reglas dinámicas:
      - Si la materia es Historia, Literatura, Geografía, etc.: Usa 3 párrafos explicativos directos.
      - Si la materia es Matemáticas, Física o Química: Sé más breve en el texto, PERO enfócate en mostrar las fórmulas necesarias, reglas, o el procedimiento paso a paso.

      Devuelve la respuesta ESTRICTAMENTE en este formato JSON válido:
      {
        "titulo": "Nombre del tema",
        "resumen": "Explicación teórica (usa saltos de línea \\n\\n)",
        "puntosClave": ["Punto 1", "Punto 2", "Punto 3"],
        "ejemploPractico": "Opcional pero OBLIGATORIO para Matemáticas/Física/Química. Aquí pon la fórmula exacta, constantes (ej. Gravedad) y un pequeño ejemplo paso a paso de cómo se resuelve. Usa texto claro."
      }
      No incluyas markdown adicional fuera del JSON.
    `;

    const MODELOS_FALLBACK = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b',
    ];

    let respuestaIA = null;
    let ultimoError = '';

    for (const modelo of MODELOS_FALLBACK) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'system', content: promptText }],
          model: modelo,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        respuestaIA = completion.choices[0]?.message?.content;
        if (respuestaIA) break;
      } catch (error: unknown) {
        const err = error as Error & { status?: number };
        ultimoError = err.message;
        if (err.status === 429) continue;
        break;
      }
    }

    if (!respuestaIA) throw new Error(`Modelos agotados: ${ultimoError}`);

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