'use client';

import MathMarkdown from '@/components/MathMarkdown';

interface ExplicacionPedagogicaProps {
  explicacion: string;
}

interface SeccionExplicacion {
  emoji: string;
  titulo: string;
  contenido: string;
  tipo: 'principal' | 'errores' | 'tip';
}

/**
 * Parsea la explicación de la IA en secciones estructuradas.
 * Soporta las 3 estructuras:
 *   A) Ciencias Exactas: [ANCLAJE] → [DATOS] → [FÓRMULA] → [DESARROLLO] → [ANÁLISIS] → [TIP]
 *   B) Ciencias Teóricas: [ANCLAJE] → [DESGLOSE] → 🔗 → [ANÁLISIS] → [TIP]
 *   C) Lectura: [ANCLAJE] → 📖 → 🧠 → [ANÁLISIS] → [TIP]
 */
function parseSecciones(explicacion: string): SeccionExplicacion[] {
  const secciones: SeccionExplicacion[] = [];

  // Patrón nuevo: etiquetas de texto [ANCLAJE], [ANÁLISIS], [TIP], etc.
  const regex = /\*\*\[([A-ZÁÉÍÓÚÑ]+)\]\*?/g;
  const matches: { emoji: string; titulo: string; start: number; end: number }[] = [];

  let match;
  while ((match = regex.exec(explicacion)) !== null) {
    const etiqueta = match[1].toUpperCase();
    let emoji = '';
    let titulo = '';
    switch (etiqueta) {
      case 'ANCLAJE': emoji = '✔'; titulo = 'Anclaje'; break;
      case 'ANÁLISIS': emoji = '🔎'; titulo = 'Análisis de Errores'; break;
      case 'TIP': emoji = '💡'; titulo = 'Tip Pro'; break;
      case 'DATOS': emoji = '📊'; titulo = 'Datos'; break;
      case 'FÓRMULA': emoji = '📐'; titulo = 'Fórmula'; break;
      case 'DESARROLLO': emoji = '⚙'; titulo = 'Desarrollo'; break;
      case 'DESGLOSE': emoji = '🧬'; titulo = 'Desglose'; break;
      default: emoji = '📌'; titulo = etiqueta;
    }
    matches.push({
      emoji,
      titulo,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Si no encontramos el formato nuevo, intentamos con emojis antiguos
  if (matches.length === 0) {
    const regexLegacy = /\*\*([✅📊📐🔄🔍💡🧬🔗📖🧠])\s*([^*]+?):\*\*/g;
    while ((match = regexLegacy.exec(explicacion)) !== null) {
      matches.push({
        emoji: match[1],
        titulo: match[2].trim(),
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Si no hay ningún patrón reconocido, devolver todo como una sola sección
  if (matches.length === 0) {
    return [{
      emoji: '📖',
      titulo: 'Explicación',
      contenido: explicacion.trim(),
      tipo: 'principal',
    }];
  }

  // Extraer contenido entre encabezados
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = i < matches.length - 1 ? matches[i + 1].start : explicacion.length;
    const contenido = explicacion.slice(current.end, nextStart).trim();

    let tipo: SeccionExplicacion['tipo'] = 'principal';
    if (current.emoji === '🔎' || current.emoji === '🔍') tipo = 'errores';
    if (current.emoji === '💡') tipo = 'tip';

    secciones.push({
      emoji: current.emoji,
      titulo: current.titulo,
      contenido,
      tipo,
    });
  }

  return secciones;
}

export default function ExplicacionPedagogica({ explicacion }: ExplicacionPedagogicaProps) {
  const secciones = parseSecciones(explicacion);

  return (
    <div className="space-y-4">
      {secciones.map((seccion, index) => {
        // Sección de errores → colapsable
        if (seccion.tipo === 'errores') {
          return (
            <details
              key={index}
              className="group bg-black/20 rounded-xl border border-white/10 overflow-hidden"
            >
              <summary className="cursor-pointer p-4 font-semibold text-blue-300 list-none flex justify-between items-center hover:bg-white/5 transition">
                <span className="flex items-center gap-2">
                  {seccion.emoji} {seccion.titulo}
                </span>
                <span className="group-open:rotate-180 transition-transform duration-300">▼</span>
              </summary>
              <div className="p-4 pt-0">
                <MathMarkdown
                  content={seccion.contenido}
                  className="text-gray-300 text-sm leading-relaxed"
                />
              </div>
            </details>
          );
        }

        // Sección de tip → resaltada con borde dorado
        if (seccion.tipo === 'tip') {
          return (
            <div
              key={index}
              className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4"
            >
              <p className="text-[#D4AF37] font-semibold mb-2 flex items-center gap-2">
                {seccion.emoji} {seccion.titulo}
              </p>
              <MathMarkdown
                content={seccion.contenido}
                className="text-[#D4AF37]/90 text-sm leading-relaxed"
              />
            </div>
          );
        }

        // Sección principal → contenido normal
        return (
          <div key={index}>
            <p className="text-[#D4AF37] font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
              {seccion.emoji} {seccion.titulo}
            </p>
            <MathMarkdown
              content={seccion.contenido}
              className="text-gray-300 text-sm leading-relaxed"
            />
          </div>
        );
      })}
    </div>
  );
}
