import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { materia, tema } = await req.json();

    if (!materia || !tema) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const promptText = `
      Eres un tutor experto en la UNAM. El alumno necesita UN NUEVO Y DIFERENTE ejemplo práctico resuelto paso a paso para:
      Materia: ${materia}
      Tema: ${tema}

      Reglas:
      1. Genera un problema distinto al más común.
      2. Muestra la fórmula, el desarrollo y el resultado.
      3. Devuelve ESTRICTAMENTE un JSON con esta estructura:
      {
        "ejemplo": "Aquí va todo el texto del problema resuelto, con saltos de línea \\n"
      }
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
          temperature: 0.7,
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

    const data = JSON.parse(respuestaIA);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error generando ejemplo extra:', error);
    return NextResponse.json({ success: false, error: 'Error en la IA' }, { status: 500 });
  }
}