import { NextRequest, NextResponse } from 'next/server';
import { groqClient } from '@/lib/groq/client';
import { TEMARIO_UNAM } from '@/data/unam_temario';
import type {
  SolicitudGenerarPregunta,
  RespuestaGenerarPregunta,
  PreguntaGenerada
} from '@/types/ia';

export async function POST(request: NextRequest): Promise<NextResponse<RespuestaGenerarPregunta>> {
  try {
    const body: SolicitudGenerarPregunta = await request.json();

    const { id_materia, area, model, temas_excluidos } = body;
    const modeloAI = model || 'llama-3.1-8b-instant';

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

    // Filtrar temas ya usados
    const temasDisponibles = materia.temas.filter((t: string) => !temas_excluidos?.includes(t));

    // Si se agotaron, reiniciar
    const temasParaElegir = temasDisponibles.length > 0 ? temasDisponibles : materia.temas;
    const temaAleatorio = temasParaElegir[Math.floor(Math.random() * temasParaElegir.length)];

    const enfoques = ['teórico', 'aplicación práctica', 'identificación de excepciones', 'análisis de un caso', 'resolución directa'];
    const enfoqueAleatorio = enfoques[Math.floor(Math.random() * enfoques.length)];

    // ============================================================================
    // CLASIFICADOR CENTRAL DE MATERIAS
    // ============================================================================
    const materiaLower = id_materia.toLowerCase();
    const esEspanol = materiaLower.includes('espanol');
    const esLiteratura = materiaLower.includes('literatura');
    const esLectura = esEspanol || esLiteratura;
    const esBiologia = materiaLower.includes('biologia') || materiaLower.includes('biología');
    const esHistoria = materiaLower.includes('historia');
    const esGeografia = materiaLower.includes('geografia') || materiaLower.includes('geografía');
    const esFilosofia = materiaLower.includes('filosofia') || materiaLower.includes('filosofía');
    const esPsicologia = materiaLower.includes('psicologia') || materiaLower.includes('psicología');
    const esSociologia = materiaLower.includes('sociologia') || materiaLower.includes('sociología');
    const esEtica = materiaLower.includes('etica') || materiaLower.includes('ética');
    const esEconomia = materiaLower.includes('economia') || materiaLower.includes('economía');
    const esCienciaTeorica = esBiologia || esHistoria || esGeografia || esFilosofia || esPsicologia || esSociologia || esEtica || esEconomia;
    const esMatesFisicaQuimica = materiaLower.match(/(matemáticas?|matematica|física|fisica|química|quimica)/);
    const cantidad = esLectura ? 3 : 1;

    // ============================================================================
    // SELECCIÓN DE ESTRUCTURA PEDAGÓGICA
    // ============================================================================
    let estructuraExplicacion = '';

    if (esMatesFisicaQuimica) {
      // ESTRUCTURA A: Ciencias Exactas
      estructuraExplicacion = `
**✅ Anclaje:** [Una línea explicando el fenómeno físico, químico o lógico]

**📊 Datos:**
- Variable 1 = valor
- Variable 2 = valor

**📐 Fórmula:** $[Ecuación original en LaTeX]$

**🔄 Desarrollo:**
[Paso 1: Sustitución]

[Paso 2: Simplificación]

[Paso 3: Resultado Final]

**🔍 Análisis de Errores Comunes:**
- Trampa 1: [Error específico, ej: "Error de signos al despejar"]
- Trampa 2: [Error específico, ej: "Olvidar elevar al cuadrado"]

**💡 Tip Pro:** [Consejo rápido y accionable]`;
    } else if (esCienciaTeorica) {
      // ESTRUCTURA B: Ciencias Teóricas
      estructuraExplicacion = `
**✅ Anclaje Conceptual:** [Define el concepto principal en una frase contundente]

**🧬 Desglose/Mecanismo:**
- [Característica o fase 1]
- [Característica o fase 2]
- [Característica o fase 3]

**🔗 Palabra Clave / Nexo:** [La palabra en la pregunta que da la respuesta inmediatamente]

**🔍 Análisis de Errores Comunes:**
- [Por qué el distractor más lógico es falso]
- [Confusión común entre conceptos similares]

**💡 Tip Pro:** [Mnemotecnia, truco de memoria o asociación rápida]`;
    } else {
      // ESTRUCTURA C: Lectura de Comprensión (default para Español/Literatura)
      estructuraExplicacion = `
**✅ Tipo de Pregunta:** [Ej: "Pregunta de Inferencia", "Idea Principal", "Tono del autor"]

**📖 Evidencia en el Texto:** "[Cita textual exacta del fragmento donde reside la respuesta]"

**🧠 Análisis Lógico:** [Cómo conectar la evidencia con la respuesta correcta]

**🔍 Análisis de Errores Comunes:**
- Opción X: [Por qué es incorrecta, ej: "Es demasiado general"]
- Opción Y: [Por qué es incorrecta, ej: "Es cierta en la realidad pero NO se menciona en el texto"]

**💡 Tip Pro:** [Estrategia de lectura rápida]`;
    }

    const systemPrompt = `
================================================================================
REGLA DE CODIFICACIÓN (CRÍTICA)
================================================================================
USA EXCLUSIVAMENTE emojis estándar de Unicode. NO uses representaciones de texto como :emoji_name:. NO uses secuencias de escape. Los emojis deben ser caracteres UTF-8 puros. Ejemplo: ✅ NO :white_check_mark:.

================================================================================
ROL Y MISIÓN
================================================================================
Eres el Tutor Experto Definitivo y Auditor Forense del simulador IATutorUNAM.
Tu misión es generar ${cantidad} pregunta(s) de opción múltiple con calidad pedagógica "Imperial" y explicaciones que funcionen como una Masterclass en miniatura.

================================================================================
REGLA CRÍTICA CERO (ANTI-ALUCINACIONES)
================================================================================
1. RESOLUCIÓN MENTAL PREVIA: Antes de elegir la "respuestaCorrecta", DEBES resolver el problema paso a paso internamente. El resultado de tu cálculo TIENE que ser exactamente la "respuestaCorrecta".
2. Si hay discrepancia entre tu cálculo y la opción, REGENERA las opciones. NUNCA justifiques una respuesta que no coincida con la aritmética.
3. PROHIBICIÓN DE META-COMENTARIOS: Jamás menciones tus errores internos, dudas o correcciones. Sé una fuente de verdad absoluta.
4. CERO SUPOSICIONES SOBRE EL USUARIO: Este texto se genera ANTES de que el alumno responda. PROHIBIDO usar frases como "Tu opción", "Si elegiste", "Te equivocaste". Sé 100% objetivo.
5. REGLA DE ORO: El campo "respuestaCorrecta" DEBE contener el texto ÍNTEGRO de la opción, exactamente como aparece en el arreglo de "opciones". PROHIBIDO poner solo la letra (A, B, C, D).

${esBiologia || esHistoria || esGeografia ? `
================================================================================
PROHIBICIÓN PARA ${materia.nombre.toUpperCase()}
================================================================================
PROHIBIDO generar problemas de cálculo matemático complejo (integrales, derivadas, crecimiento exponencial). Limítate a teoría, conceptos, genética básica (cuadros de Punnett con viñetas, NO tablas) y análisis de sistemas.
` : ''}

${esLectura ? `
================================================================================
REGLA DE COMPRENSIÓN LECTORA (OBLIGATORIA)
================================================================================
- PROHIBIDO escribir textos cortos. Debes escribir un ensayo o artículo original de nivel universitario.
- Usa lenguaje rico y estructurado con argumentos sólidos. MÍNIMO 500 palabras.
- Genera EXACTAMENTE 3 preguntas de alto nivel analítico basadas ÚNICAMENTE en esa lectura.
- IMPORTANTE: Incluye el texto completo en el campo "textoLectura" de cada una de las 3 preguntas.
- Prioriza la longitud de "textoLectura" sobre cualquier otro campo.
` : ''}

================================================================================
ESTRUCTURA DE EXPLICACIÓN (¡REGLA DE HIERRO!)
================================================================================
El campo "explicacion" DEBE ser UN ÚNICO STRING en formato Markdown siguiendo EXACTAMENTE la estructura correspondiente a esta materia (${materia.nombre}).
PROHIBIDO enviar un objeto JSON anidado. Concatena todo con saltos de línea \\n\\n.

${esMatesFisicaQuimica ? `
=== ESTRUCTURA A: CIENCIAS EXACTAS ===
Debes usar EXACTAMENTE estos 6 bloques en este orden:
1. **✅ Anclaje:** - Una línea con el fenómeno/concepto
2. **📊 Datos:** - Lista de variables conocidas con viñetas
3. **📐 Fórmula:** - Ecuación en LaTeX entre $...$
4. **🔄 Desarrollo:** - OBLIGATORIO: cada paso en línea separada (Sustitución \\n\\n Simplificación \\n\\n Resultado)
5. **🔍 Análisis de Errores Comunes:** - 2 trampas específicas del problema
6. **💡 Tip Pro:** - Consejo rápido
` : esCienciaTeorica ? `
=== ESTRUCTURA B: CIENCIAS TEÓRICAS ===
Debes usar EXACTAMENTE estos 5 bloques en este orden:
1. **✅ Anclaje Conceptual:** - Definición contundente en 1 frase
2. **🧬 Desglose/Mecanismo:** - 3 viñetas con proceso/características
3. **🔗 Palabra Clave / Nexo:** - La palabra de la pregunta que revela la respuesta
4. **🔍 Análisis de Errores Comunes:** - Por qué los distractores fallan
5. **💡 Tip Pro:** - Mnemotecnia o truco de memoria
` : `
=== ESTRUCTURA C: LECTURA DE COMPRENSIÓN ===
Debes usar EXACTAMENTE estos 5 bloques en este orden:
1. **✅ Tipo de Pregunta:** - Clasificación (Inferencia, Idea Principal, Tono, etc.)
2. **📖 Evidencia en el Texto:** - Cita textual EXACTA entre comillas
3. **🧠 Análisis Lógico:** - Conexión evidencia → respuesta
4. **🔍 Análisis de Errores Comunes:** - Desmonte de distractores
5. **💡 Tip Pro:** - Estrategia de lectura rápida
`}

================================================================================
REGLAS DE FORMATO LaTeX (CRÍTICO PARA RENDERIZADO)
================================================================================
1. REGLA ANTI-DÓLAR: Números simples como "158", "-2", "x = 5" van en texto plano SIN $. Solo usa $...$ para fórmulas complejas ($\\frac{a}{b}$, $\\sqrt{}$, $\\pi$).
2. DOBLE ESCAPE EN JSON: Como tu respuesta es JSON, TODOS los comandos LaTeX necesitan doble barra: \\\\frac, \\\\int, \\\\sqrt, \\\\pi, \\\\text.
3. PROHIBIDO $$...$$ (doble dólar/block math).
4. UNIDADES DE MEDIDA: Ponlas AFUERA de $ como texto plano. CORRECTO: $v = 19.6$ m/s. INCORRECTO: $v = 19.6 \\text{m/s}$.
5. PROHIBIDO USAR TABLAS MARKDOWN (con | y -). Usa SOLO listas con viñetas.

================================================================================
CALIDAD DE DISTRACTORES
================================================================================
Las opciones incorrectas DEBEN representar errores reales de estudiantes:
- Error de signo (ej: sumar en lugar de restar)
- Confusión de fórmulas (ej: perímetro en lugar de área)
- Error en jerarquía de operaciones
- Omisión de pasos
NO pueden ser números al azar.

================================================================================
FORMATO DE RESPUESTA JSON
================================================================================
Responde SOLO con JSON válido sin texto adicional:
{
  "preguntas": [
    {
      "pregunta": "Texto de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": "Texto íntegro de la opción correcta",
      "explicacion": "${estructuraExplicacion.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
      ${esLectura ? ', "textoLectura": "Texto completo del ensayo/artículo..."' : ''}
    }
  ]
}`;

    // ============================================================================
    // INSTRUCCIONES ESPECÍFICAS DE MATERIA
    // ============================================================================
    let instruccionesEspeciales = '';
    if (esEspanol) {
      instruccionesEspeciales = `¡REGLA DE HIERRO PARA LECTURA CRÍTICA!
1) EXTENSIÓN OBLIGATORIA: El texto DEBE tener 6 PÁRRAFOS de al menos 80 palabras cada uno.
2) ESTRUCTURA VISUAL: Numera cada párrafo (Párrafo I, II, etc.).
3) RIGOR: Lenguaje académico denso. PROHIBIDO textos de menos de 500 palabras.
4) TEMÁTICA: Ensayo sobre filosofía de la ciencia, sociología o historia universal.
5) EXPLICACIÓN: Usa ESTRUCTURA C (Tipo de Pregunta → Evidencia → Análisis Lógico → Errores → Tip).`;
    } else if (esLiteratura) {
      instruccionesEspeciales = `¡REGLA DE HIERRO PARA ANÁLISIS LITERARIO!
1) EXTENSIÓN OBLIGATORIA: 5 PÁRRAFOS extensos.
2) CONTENIDO: Incluye un fragmento de obra clásica (mínimo 10 líneas) en el Párrafo 3.
3) ANÁLISIS: Párrafos 4-5 con análisis técnico-estético, figuras retóricas y contexto histórico.
4) PROHIBIDO textos de ciencia. Enfócate en valor artístico y literario.
5) EXPLICACIÓN: Usa ESTRUCTURA C.`;
    } else if (esCienciaTeorica) {
      instruccionesEspeciales = `REGLA ABSOLUTA: PROHIBIDO incluir cálculos matemáticos complejos. Debe ser teórica y cualitativa.
EXPLICACIÓN: Usa ESTRUCTURA B (Anclaje Conceptual → Desglose → Palabra Clave → Errores → Tip).`;
    } else if (esMatesFisicaQuimica) {
      instruccionesEspeciales = `OBLIGATORIO: Toda fórmula entre $...$ para LaTeX. Debes RESOLVER el problema paso a paso en la explicación.
EXPLICACIÓN: Usa ESTRUCTURA A (Anclaje → Datos → Fórmula → Desarrollo paso a paso → Errores → Tip).`;
    }

    const userPrompt = `Genera ${esLectura ? '3 preguntas basadas en un texto de comprensión lectora' : 'una pregunta'} sobre el tema: "${temaAleatorio}". El enfoque de la pregunta debe ser estrictamente de tipo "${enfoqueAleatorio}". La pregunta debe ser exclusivamente sobre este tema de ${materia.nombre}. 

${instruccionesEspeciales}`;

    const MODELOS_FALLBACK = [
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'moonshotai/kimi-k2-instruct',
      'llama-3.3-70b-versatile'
    ];

    let modeloUsado = '';
    let ultimoError = '';

    for (const modelo of MODELOS_FALLBACK) {
      try {
        modeloUsado = modelo;
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: modelo,
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 2048,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content;
        if (!responseContent) {
          console.warn(`Fallo con modelo ${modelo}, sin respuesta, intentando siguiente...`);
          continue;
        }

        const parsedResponse = JSON.parse(responseContent);
        const preguntasRaw = parsedResponse.preguntas;

        if (!Array.isArray(preguntasRaw) || preguntasRaw.length === 0) {
          console.warn(`Fallo con modelo ${modelo}, array vacío, intentando siguiente...`);
          continue;
        }

        console.log(`Pregunta generada con modelo: ${modelo}`);

        const validatedQuestions: PreguntaGenerada[] = preguntasRaw.map((q: Record<string, unknown>) => {
          const preguntaRaw = String(q.pregunta || '');
          const opcionesRaw = q.opciones;
          const respuestaCorrectaRaw = String(q.respuestaCorrecta || '');

          let explicacionFinal = '';
          if (typeof q.explicacion === 'object' && q.explicacion !== null) {
            const obj = q.explicacion as Record<string, unknown>;
            explicacionFinal = Object.entries(obj)
              .map(([k, v]) => {
                let strVal = '';
                if (typeof v === 'object' && v !== null) {
                  strVal = JSON.stringify(v, null, 2)
                    .replace(/[{}[\]"]/g, '')
                    .trim();
                } else {
                  strVal = String(v);
                }

                if (k.length < 25 && !strVal.toLowerCase().includes(k.toLowerCase())) {
                  const cleanKey = k.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
                  return `**${cleanKey}:** ${strVal}`;
                }
                return strVal;
              })
              .join('\n\n');
          } else {
            explicacionFinal = String(q.explicacion || '');
          }

          const textoLecturaRaw = q.textoLectura ? String(q.textoLectura) : undefined;

          if (!preguntaRaw || !Array.isArray(opcionesRaw) || opcionesRaw.length !== 4 || !respuestaCorrectaRaw || !explicacionFinal || explicacionFinal === '[object Object]') {
            throw new Error('Pregunta inválida: campos vacíos o mal formateados');
          }

          return {
            pregunta: preguntaRaw,
            opciones: opcionesRaw.map((op: unknown) => String(op)) as [string, string, string, string],
            respuestaCorrecta: respuestaCorrectaRaw,
            explicacion: explicacionFinal,
            textoLectura: textoLecturaRaw,
            tema_usado: temaAleatorio,
          };
        });

        return NextResponse.json({
          success: true,
          data: validatedQuestions,
        }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });

      } catch (error: unknown) {
        const err = error as Error & { status?: number; message?: string };
        console.warn(`Fallo con modelo ${modelo}: ${err.message || err.status}, intentando siguiente...`);
        ultimoError = err.message || String(err);

        if (err.status === 429 || err.status === 503) {
          continue;
        }
      }
    }

    return NextResponse.json(
      { success: false, error: `Todos los modelos agotados. Último error: ${ultimoError}` },
      { status: 429 }
    );

  } catch (error) {
    console.error('Error en /api/generar-pregunta:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}