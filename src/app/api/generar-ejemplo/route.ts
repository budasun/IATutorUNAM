import { NextResponse } from 'next/server';
import { groqClient } from '@/lib/groq/client';
import { obtenerModelosFallback, obtenerParametrosModelo, extraerJson } from '@/lib/groq/modelos';

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

    const MODELOS_FALLBACK = obtenerModelosFallback({ esMatesFisicaQuimica: true });

    let ultimoError = '';

    for (const modelo of MODELOS_FALLBACK) {
      try {
        const completion = await groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: promptText },
            { role: 'user', content: `Genera un ejemplo práctico resuelto paso a paso de "${tema}" para la materia ${materia}.` }
          ],
          ...obtenerParametrosModelo(modelo, 4096),
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const respuestaIA = completion.choices[0]?.message?.content;
        if (!respuestaIA) {
          console.warn(`Fallo con modelo ${modelo}, sin respuesta, intentando siguiente...`);
          continue;
        }

        const data = extraerJson(respuestaIA);
        if (!data) {
          console.warn(`Fallo con modelo ${modelo}, JSON no interpretable, intentando siguiente...`);
          ultimoError = 'Respuesta no interpretable como JSON';
          continue;
        }

        console.log(`Ejemplo generado con modelo: ${modelo}`);
        return NextResponse.json({ success: true, data });

      } catch (error: unknown) {
        const err = error as Error & { status?: number; message?: string };
        console.warn(`Fallo con modelo ${modelo}: ${err.message || err.status}, intentando siguiente...`);
        ultimoError = err.message || String(err);

        if (err.status === 429 || err.status === 503) {
          continue;
        }
      }
    }

    throw new Error(`Todos los modelos agotados: ${ultimoError}`);
  } catch (error: unknown) {
    console.error('Error generando ejemplo extra:', error);
    return NextResponse.json({ success: false, error: 'Error en la IA' }, { status: 500 });
  }
}