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
    // CLASIFICADOR CENTRAL DE MATERIAS (¡Cero duplicados!)
    // ============================================================================
    const materiaLower = id_materia.toLowerCase();
    const esEspanol = materiaLower.includes('espanol');
    const esLiteratura = materiaLower.includes('literatura');
    const esLectura = esEspanol || esLiteratura;
    const esBiologia = materiaLower.includes('biologia') || materiaLower.includes('biología');
    const esQuimica = materiaLower.includes('quimica') || materiaLower.includes('química');
    const esMatesFisicaQuimica = materiaLower.match(/(matemáticas?|matematica|física|fisica|química|quimica)/);
    const cantidad = esLectura ? 3 : 1;

    // ============================================================================
    // PLANTILLAS DINÁMICAS (Inyectadas en el ejemplo JSON)
    // ============================================================================
    let templateExplicacion = "### ✅ El Concepto Clave\\n(Tu explicación detallada)\\n\\n### 🔍 Análisis de Distractores\\n(Viñetas)\\n\\n### 💡 Tip Pro\\n(Consejo)";

    if (esBiologia) {
      templateExplicacion = "### ✅ El Concepto Clave\\n**Ubicación:** [Dónde ocurre]\\n**Proceso:** [Explicación detallada. Si es genética, incluye genotipos correctos. OJO: Las enfermedades recesivas requieren dos padres portadores]\\n**Impacto Vital:** [Importancia]\\n\\n### 🔍 Análisis de Distractores\\n(Viñetas)\\n\\n### 💡 Tip Pro\\n(Consejo)";
    } else if (esQuimica) {
      templateExplicacion = "### ✅ El Concepto Clave\\n**Visión Microscópica:** [Átomos y moléculas]\\n**Ecuación/Estructura:** [LaTeX]\\n**Contraste:** [Diferencia clave]\\n\\n### 🔍 Análisis de Distractores\\n(Viñetas)\\n\\n### 💡 Tip Pro\\n(Consejo)";
    }

    const systemPrompt = `
================================================================================
ROL Y OBJETIVO
================================================================================
Actúa como un Diseñador Instruccional Senior y Experto Evaluador de la UNAM.
Tu tarea es generar ${cantidad} pregunta(s) de opción múltiple con una calidad pedagógica "Imperial".
La retroalimentación debe ser una "Masterclass" en miniatura: constructiva, detallada, con refuerzo positivo y sin asumir las acciones del usuario.

================================================================================
PROTOCOLO ANTI-ALUCINACIONES Y RESOLUCIÓN OBLIGATORIA
================================================================================
1. RESOLUCIÓN MENTAL PREVIA: Antes de elegir la "respuestaCorrecta", DEBES resolver el problema paso a paso. El resultado de tu cálculo debe ser exactamente la "respuestaCorrecta".
2. PROHIBICIÓN DE META-COMENTARIOS: Jamás menciones tus propios errores, dudas o correcciones internas. Sé una fuente de verdad absoluta.
3. CERO SUPOSICIONES: Como este texto se genera ANTES de que el alumno responda, TIENES PROHIBIDO usar frases como "Tu opción", "Si elegiste esta", o "Te equivocaste". Sé 100% objetivo.
4. PROHIBICIÓN DE MATEMÁTICAS INVENTADAS: Si la materia es BIOLOGÍA, HISTORIA, GEOGRAFÍA o LITERATURA, TIENES ESTRICTAMENTE PROHIBIDO generar problemas de cálculo matemático complejo (como integrales, derivadas, o crecimiento exponencial). Limítate a teoría, conceptos, genética básica (cuadros de Punnett) y análisis de sistemas.

${esLectura ? `
================================================================================
REGLA DE COMPRENSIÓN LECTORA (OBLIGATORIA)
================================================================================
- Tienes PROHIBIDO escribir textos cortos. Debes escribir un ensayo o artículo original, de nivel universitario.
- Usa un lenguaje rico y estructurado con argumentos sólidos.
- Después del texto, genera EXACTAMENTE 3 preguntas de alto nivel analítico basadas ÚNICAMENTE en esa lectura.
- IMPORTANTE: Incluye el texto completo en el campo "textoLectura" de cada una de 3 preguntas generadas.

================================================================================
TEMPLATE DE EXPLICACIÓN FORZADO (¡REGLA DE HIERRO!)` : `
================================================================================
TEMPLATE DE EXPLICACIÓN FORZADO (¡REGLA DE HIERRO!)`}
================================================================================
El campo "explicacion" DEBE ser un string en formato Markdown siguiendo EXACTAMENTE esta estructura de 3 bloques. 
¡PROHIBIDO HACER RESÚMENES O EXPLICACIONES CORTAS!

================================================================================
CANDADO DE EXTENSIÓN Y FORMATO (OBLIGATORIO)
================================================================================
- PROHIBICIÓN DE EXPLICACIONES CORTAS: El bloque [✅ El Concepto Clave] DEBE ser detallado.
- PROHIBICIÓN DE TABLAS: ¡NUNCA uses tablas Markdown (con | y -). Usa SOLO listas con viñetas para explicar datos o cruces genéticos!

### ✅ El Concepto Clave
[ADAPTA ESTE BLOQUE A LA MATERIA ASÍ:]

PARA MATEMÁTICAS Y FÍSICA:
- SI ES CÁLCULO: 1. Anclaje, 2. Datos, 3. Fórmula, 4. Desarrollo (cada paso en línea nueva).
- SI ES ANÁLISIS/TABLAS: Escribe: 1. Patrón observado, 2. Comprobación matemática, 3. Conclusión.
- SI ES TEÓRICO: Explica el principio en 2 párrafos claros.

PARA QUÍMICA (LUPA MOLECULAR):
- SI ES CÁLCULO: Mismo formato que Matemáticas.
- SI ES TEÓRICO: Usa estos 3 subtítulos en negritas: **Visión Microscópica:**, **Ecuación/Estructura:**, **Contraste:**.

PARA BIOLOGÍA (ENFOQUE SISTÉMICO):
- Usa ESTRICTAMENTE estos 3 subtítulos en negritas:
  **Ubicación:** [Dónde ocurre celular o anatómicamente]
  **Proceso:** [Qué ocurre biológicamente paso a paso. NUNCA uses tablas de Punnett, explícalo con texto y viñetas]
  **Impacto Vital:** [Por qué es esencial]

PARA LAS DEMÁS MATERIAS:
- Explica a detalle en 2-3 párrafos estructurados.

================================================================================
REGLA DE SEPARACIÓN ABSOLUTA Y ENCABEZADOS (¡CRÍTICO!)
================================================================================
Tu explicación DEBE tener EXACTAMENTE 3 bloques separados por saltos de línea (\\n\\n). 
Tienes PROHIBIDO fusionarlos. DEBES usar estos textos literales:

### ✅ El Concepto Clave
(Tu explicación principal adaptada a la materia)

### 🔍 Análisis de Distractores
(Explica con viñetas por qué fallan las otras 3 opciones)

### 💡 Tip Pro
(Un consejo rápido)

================================================================================
REGLA DE ENCABEZADOS: ESTÁ ESTRICTAMENTE PROHIBIDO traducir los emojis a descripciones de texto o LaTeX como (\\checkmark), (\\warning) o (\\star). Debes imprimir los emojis literales (✅, 🔍, 💡) exactamente como se muestran en el template.

================================================================================
REGLAS DE FORMATO Y LaTeX (CRÍTICO PARA EL RENDERIZADO)
================================================================================
1. REGLA ANTI-DÓLAR (NÚMEROS SIMPLES): Si es un número o texto simple (ej. "158", "-2", "Opción A"), usa texto plano SIN signos de dólar. 
2. REGLA MATEMÁTICA: Solo usa "$...$" (dólar simple) para fórmulas complejas.Toda fórmula matemática DEBE estar dentro de$: $\\frac{a}{b}$, $\\int$, $\\sqrt{}$, $\\pi$.

3. DOBLE ESCAPE DE BACKSLASHES EN JSON (CRÍTICO):
**Como tu respuesta es un objeto JSON, TODOS los comandos de LaTeX deben tener doble barra invertida (\\\\). Si usas una sola, el JSON se rompe al parsearse.**

❌ MAL: \\frac{a}{b}, \\int, \\sqrt, \\pi

✅ BIEN: \\\frac{a}{b}, \\\int, \\\sqrt, \\\pi

Además, RECUERDA que toda fórmula matemática o fracción DEBE ir estrictamente dentro de signos de dólar simples ($ ... $). Si no pones los dólares, la plataforma no dibujará la ecuación.

- Si en la explicación dices "el resultado es 14", la respuestaCorrecta debe contener "14".
- Si dices "x = 5", la respuestaCorrecta debe ser exactamente "x = 5" o "5".
CUALQUIER discrepancia = FALLO CRÍTICO.

3. ESTÁNDAR PEDAGÓGICO "ANTI-FLOJERA":
Prohibido usar frases circulares como:
- "La opción X es incorrecta porque no es la solución"
- "La opción X es incorrecta porque no se utilizó la sustitución correcta"

La justificacionDescarte debe explicar el ERROR LÓGICO real del alumno:
- Error de signo (ej: sumar cuando debería restar)
- Confusión de fórmulas (ej: usar fórmula de perímetro en lugar de área)
- Error en jerarquía de operaciones (ej: resolver antes de paréntesis)
- Omisión de unidades o pasos

4. TEMPLATE FORZADO (OBLIGATORIO - USA ESTE EXACTO):

Tu respuesta DEBE seguir este esquema EXACTO. NO puedes omitir ningún bloque ni cambiar el orden:

### ✅ El Concepto Clave
[Aquí explicas la respuesta correcta: conceptos clave, fórmulas, desarrollo si hay.
Usa **negritas** para términos importantes. Ej: "La electronegatividad del **Na** es menor que la del **Cl**, por eso el **Na** cede electrones y se forma **NaCl**"]

### 🔍 Análisis de Distractores
[Explica brevemente los errores lógicos o matemáticos de las 3 opciones incorrectas generadas.
**REGLA ESTRICTA:** NUNCA uses frases como "Tu opción", "Si elegiste esta", o asumas lo que el usuario respondió, porque este texto se genera ANTES de que el usuario interactúe. Simplemente analiza las opciones de forma objetiva:
- **Opción incorrecta 1:** [Error - ej. "Asume que la pendiente es negativa cuando es positiva"]
- **Opción incorrecta 2:** [Error - ej. "Omite la constante de integración"]
- **Opción incorrecta 3:** [Error - ej. "Aplica mal la jerarquía de operaciones"]]

### 💡 Tip Pro
[Regla de oro en 1-2 líneas: "Metal + No Metal = Iónico", "En integrales,dx va FUERA"]

**REGLA DE HIERRO:** - PRIMERO ENSEÑAS, LUEGO CORRIGES
- PROHIBIDO empezar analizando opciones A, B, C o D
- Usa EXACTAMENTE los encabezados: ### ✅, ### 🔍, ### 💡

**REGLAS ANTI-ALUCINACIÓN (PROHIBIDO TOTAL):**

1. PROHIBICIÓN DE META-COMENTARIOS:
- ❌ PROHIBIDO mencionar: "mi cálculo anterior estaba mal", "el error fue...", "debería corregir..."
- ❌ PROHIBIDO discutir fallos internos del modelo
- ✅ La explicación debe ser DIRECTA, ASERTIVA y FINAL

2. CÁLCULO PREVIO MANDATORIO:
- ✅ El valor de respuestaCorrecta DEBE derivarse del cálculo final
- ✅ Si el cálculo da 10, la respuestaCorrecta DEBE ser "10" o "x = 10"
- ✅ NO puedes elegir una opción y luego justificar/ajustar el cálculo

3. AUTOCENSURA DE RAZONAMIENTO:
- ✅ El razonamiento paso a paso solo building la respuesta
- ✅ NO incluir discusiones sobre fallos del modelo en la explicación
- ✅ La explicación es SOLO para el alumno

4. REVISIÓN DE CONSISTENCIA:
- ✅ Si el valor calculado NO está en las opciones generadas, REGENERA las opciones
- ✅ NO intentes justificar errores en la explicación
- ✅ COHERENCIA: respuestaCorrecta = cálculo final

5. REGLAS DE FORMATEO (CRÍTICO):
- Negritas para términos clave: **Agua Neutra**, **Producto Iónico**
- Viñetas para cada opción incorrecta (NO párrafos largos)

6. REGLA ANTI-DÓLAR (CRÍTICO - PROHBE ERRORES COMUNES):

**NÚMEROS SIMPLES (texto plano - SIN $):**
- Para opciones como: "158", "-2", "x = 5", "Opción A", "3.14"
- USA texto plano, SIN signos de dólar
- MAL: ["$$158$$"] o ["\$158"] - BIEN: ["158"]

**MATEMÁTICAS COMPLEJAS (SÍ usa $):**
- Solo usa $...$ para fórmulas con:
  - Radicales: $\sqrt{x}$, $\sqrt{b^2-4ac}$
  - Fracciones: $\frac{a}{b}$, $\frac{-b \pm \sqrt{D}}{2a}$
  - Exponentes: $x^2$, $e^{-x}$
  - Símbolos especiales: $\pi$, $\theta$, $\alpha$, $\beta$
  - Notación química: $\mathrm{H_2O}$, $\mathrm{NaCl}$

**PROHIBIDO ABSOLUTO:**
- ❌ NO uses $$...$$ (doble dólar/block)
- ❌ NO uses \$ escapado
- ❌ NO pongas $ alredeor de números simples: NO "$\frac{1}{2}$" cuando es solo "1/2"

4. REGLA DE UNIDADES DE MEDIDA: NUNCA uses el comando \\text{} dentro de una fórmula matemática, ya que rompe el formato JSON. Si necesitas escribir unidades de medida (como m/s, kg, N), ponlas AFUERA de los signos de dólar como texto plano.
- Ej. CORRECTO: $v = 19.6$ m/s
- Ej. INCORRECTO: $v = 19.6 \text{m/s}$

8. REGLA DE INTEGRALES Y DIFERENCIALES:
**Símbolo DE integral DEBE ser \\\\int (CON DOBLE barra invertida, NO \int)**

**FORMATO CORRECTO de integrales:**
- MAL: $\int_{0}^{2} 3x^{2},dx$ (con coma + coma extra)
- MAL: $(\int_{0}^{2} 3x^{2} dx)$ (paréntesis innecesario)  
- BIEN: $\int_{0}^{2} 3x^{2}\ dx$ (sin coma, con espacio, $dx$ fuera)
- BIEN: $\int_{a}^{b} f(x)\ dx$
- BIEN: $\int_{0}^{3} (2x+1)\ dx$

**REGLAS ESPECÍFICAS:**
- USA SIEMPRE \\int para integrales (NO solo "int")
- NUNCA uses coma antes del diferencial: NO ",$dx$", usa "$dx$"
- NO uses coma antes de "$dx$" o cualquier diferencial
- El diferencial VA FUERA del integrando: $\int f(x)\ dx$, NO $\int f(x),dx$
- USA espacio entre integrando y diferencial: $x^2\ dx$ (con espacio escaping: \\)
- NO uses paréntesis a menos que sea operación compuesta: $\int (x+1)\ dx$ es OK, $\int x\ dx$ debe ser $\int x\ dx$

7. CALIDAD DE DISTRACTORES (OPCIONES INCORRECTAS):
Las opciones incorrectas NO deben ser números al azar.
Deben ser errores comunes reales:
- Si la respuesta es "x = 5", genera "x = -5" (error de signo)
- Si es "9 + 6 = 15", genera "9 + 6 = 3" (error de operación)
- Si el área es "25π", genera "50π" (olvidar π) o "25π/2" (dividir por 2)
- Si es "2a + 3b", genera "5ab" (multiplicar términos distintos)

================================================================================
FIN DEL PROTOCOLO ANTI-ALUCINACIONES
================================================================================

REGLA DE FORMATO MATEMÁTICO (CRÍTICO): 
- Está ESTRICTAMENTE PROHIBIDO usar el símbolo '^' para exponentes.
- DEBES usar caracteres Unicode para superíndices.
- Ejemplos CORRECTOS vs INCORRECTOS:
  * Correcto: x², y³, z⁴, 2ⁿ, eˣ
  * Incorrecto: x^2, y^3, z^4, 2^n, e^x
- Para TODO (matemáticas, química, física) USA SIMPRE $\mathrm{H_2O}$, $\mathrm{CO_2}$, $\mathrm{NaCl}$

IMPORTANTE: Para fórmulas matemáticas y químicas, USA SIEMPRE $\mathrm{LaTeX}$:
- $...$ para fórmulas en línea
- $$...$$ para fórmulas centradas
- El JSON debe ser compatible con renderizador KaTeX (no escapes barras invertidas incorrectamente)

IMPORTANTE: El campo "explicacion" DEBE SER UN ÚNICO STRING de texto plano. ESTÁ ESTRICTAMENTE PROHIBIDO enviar un objeto JSON anidado (ej. NO hagas {"concepto": "...", "tip": "..."}). Concatena todo con saltos de línea \\n\\n en una sola cadena.

Debes responder SOLO con JSON válido, sin texto adicional. Usa este formato exacto:
{
  "preguntas": [
    {
      "pregunta": "Texto de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": "Opción correcta exacta",
      "explicacion": "${templateExplicacion}"
      ${esLectura ? ', "textoLectura": "Aquí va el texto completo..."' : ''}
    }
  ]
}`

    // ============================================================================
    // INSTRUCCIONES ESPECÍFICAS DE MATERIA
    // ============================================================================
    let instruccionesEspeciales = '';
    if (esEspanol) {
      instruccionesEspeciales = `¡REGLA ABSOLUTA PARA ESPAÑOL (COMPRENSIÓN LECTORA UNAM)!
1) ESTRUCTURA DE 6 PÁRRAFOS (OBLIGATORIA): El texto DEBE seguir este esquema exacto: 
   - Párrafo 1: Introducción y tesis central.
   - Párrafo 2: Antecedentes históricos o contexto.
   - Párrafo 3: Desarrollo argumentativo A.
   - Párrafo 4: Desarrollo argumentativo B.
   - Párrafo 5: Perspectivas alternas o críticas.
   - Párrafo 6: Síntesis y conclusión final.
2) TEMÁTICA: Ensayo académico complejo (Ciencias, Humanidades o Epistemología).
3) PREGUNTAS: Evalúa inferencias y tesis. PROHIBIDO preguntas literales o distractores absurdos.`;
    } else if (esLiteratura) {
      instruccionesEspeciales = `¡REGLA ABSOLUTA PARA LITERATURA UNAM!
1) ESTRUCTURA DE 5 PÁRRAFOS (OBLIGATORIA): 
   - Párrafo 1: Contexto de la corriente literaria o biografía del autor.
   - Párrafo 2: Análisis de la estética, estilo y recursos predominantes.
   - Párrafo 3: Fragmento representativo de una obra o poema (OBLIGATORIO).
   - Párrafo 4: Interpretación técnica y simbólica del fragmento anterior.
   - Párrafo 5: Legado, trascendencia e influencia en la literatura.
2) TEMÁTICA: Estrictamente Corrientes Literarias, Autores Clásicos o Análisis de Géneros.
3) PREGUNTAS: Analiza figuras retóricas y valor estético. Distractores de alta dificultad.`;
    } else if (!esMatesFisicaQuimica) {
      instruccionesEspeciales = '¡REGLA ABSOLUTA: ESTÁ ESTRICTAMENTE PROHIBIDO INCLUIR NÚMEROS, CÁLCULOS O FÓRMULAS EN ESTA PREGUNTA O EN SUS OPCIONES! Debe ser teórica y cualitativa.';
    } else {
      instruccionesEspeciales = 'IMPORTANTE: Toda fórmula, ecuación o expresión matemática debe ir OBLIGATORIAMENTE entre signos de dólar simple ($...$) para LaTeX.';
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
        });

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