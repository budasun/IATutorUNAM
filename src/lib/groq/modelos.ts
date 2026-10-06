export const MODELOS_GROQ = {
  razonamiento: 'openai/gpt-oss-120b',
  rapido: 'openai/gpt-oss-20b',
  matematico: 'qwen/qwen3.8-27b',
} as const;

const ORDEN_MATES_FISICA_QUIMICA: string[] = [
  MODELOS_GROQ.razonamiento,
  MODELOS_GROQ.matematico,
  MODELOS_GROQ.rapido,
];

const ORDEN_GENERAL: string[] = [
  MODELOS_GROQ.razonamiento,
  MODELOS_GROQ.rapido,
  MODELOS_GROQ.matematico,
];

export function obtenerModelosFallback(opts: {
  esMatesFisicaQuimica: boolean;
  modeloSolicitado?: string;
}): string[] {
  const base = opts.esMatesFisicaQuimica ? ORDEN_MATES_FISICA_QUIMICA : ORDEN_GENERAL;
  const solicitado = opts.modeloSolicitado;

  if (!solicitado) return base;

  const permitidos = new Set(base);
  return permitidos.has(solicitado) ? [solicitado, ...base.filter((m) => m !== solicitado)] : base;
}

// Los modelos gpt-oss son de razonamiento: sin limitarlo consumen el presupuesto
// de max_tokens pensando y la respuesta trunca antes de cerrar el JSON, lo que
// provoca errores json_validate_failed. "low" reduce el razonamiento a ~100 tokens.
// qwen NO acepta este parámetro, por eso se filtra por modelo.
export function obtenerParametrosModelo(modelo: string, maxTokens: number) {
  const esGptOss = modelo.startsWith('openai/gpt-oss');
  const limite = esGptOss ? Math.max(maxTokens, 4096) : maxTokens;

  return {
    model: modelo,
    max_tokens: limite,
    ...(esGptOss ? { reasoning_effort: 'low' as const } : {}),
  };
}

export function extraerJson(contenido: string): unknown | null {
  if (!contenido) return null;

  try {
    return JSON.parse(contenido);
  } catch {
    /* continua con la extraccion por delimitadores */
  }

  const limpio = contenido
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?```(?:json)?/i, '')
    .replace(/```[\s\S]*$/i, '');

  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin <= inicio) return null;

  try {
    return JSON.parse(limpio.slice(inicio, fin + 1));
  } catch {
    return null;
  }
}