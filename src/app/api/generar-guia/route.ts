import { NextResponse } from 'next/server';
import { groqClient } from '@/lib/groq/client';
import { obtenerModelosFallback, obtenerParametrosModelo, extraerJson } from '@/lib/groq/modelos';

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

    const MODELOS_FALLBACK = obtenerModelosFallback({ esMatesFisicaQuimica: true });

    let ultimoError = '';

    for (const modelo of MODELOS_FALLBACK) {
      try {
        const completion = await groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: promptText },
            { role: 'user', content: `Genera la píldora de estudio de "${tema}" para la materia ${materia}.` }
          ],
          ...obtenerParametrosModelo(modelo, 4096),
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const respuestaIA = completion.choices[0]?.message?.content;
        if (!respuestaIA) {
          console.warn(`Fallo con modelo ${modelo}, sin respuesta, intentando siguiente...`);
          continue;
        }

        const guia = extraerJson(respuestaIA);
        if (!guia) {
          console.warn(`Fallo con modelo ${modelo}, JSON no interpretable, intentando siguiente...`);
          ultimoError = 'Respuesta no interpretable como JSON';
          continue;
        }

        console.log(`Guía generada con modelo: ${modelo}`);
        return NextResponse.json({ success: true, data: guia });

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
    console.error('🔥 ERROR CRÍTICO EN GROQ (Guías):', error);
    const mensajeError = error instanceof Error ? error.message : 'Error desconocido de la API';
    return NextResponse.json({ 
      success: false, 
      error: `Fallo en la IA: ${mensajeError}` 
    }, { status: 500 });
  }
}