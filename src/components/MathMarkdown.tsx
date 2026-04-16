'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

export default function MathMarkdown({ content, className = '' }: MathMarkdownProps) {
  const contentLimpio = content
    // ═══════════════════════════════════════════════════════════════════
    // FASE -1: Limpieza de etiquetas estructurales
    // ═══════════════════════════════════════════════════════════════════
    .replace(/(?:###\s*)?\[(?:CORRECTO|AN[AÁ]LISIS|TIP)\]/gi, '')
    // ═══════════════════════════════════════════════════════════════════
    // FASE 0: Recuperación de caracteres de control
    // Cuando el LLM olvida el doble-escape en JSON, JS interpreta:
    //   \t → Tab (U+0009)  → se come la "t" de \tan, \text, \theta
    //   \b → BS  (U+0008)  → se come la "b" de \beta, \bar, \binom
    //   \f → FF  (U+000C)  → se come la "f" de \frac
    //   \v → VT  (U+000B)  → se come la "v" de \vec, \varphi
    //   \a → BEL (U+0007)  → se come la "a" de \alpha, \arctan
    //   \n → LF  (U+000A)  → se come la "n" de \neq, \nabla
    // Esta fase los restaura ANTES de cualquier otro procesamiento.
    // ═══════════════════════════════════════════════════════════════════
    .replace(/\x09/g, '\\t')             // Tab    → \t (restaura \tan, \text, \theta, \times)
    .replace(/\x08/g, '\\b')             // BS     → \b (restaura \beta, \bar, \binom, \boldsymbol)
    .replace(/\x0Crac\{/g, '\\frac{')    // FF+rac → \frac{ (caso específico de \frac)
    .replace(/\x0C/g, '\\f')             // FF     → \f (restaura otros: \flat, etc.)
    .replace(/\x0B/g, '\\v')             // VT     → \v (restaura \vec, \varphi)
    .replace(/\x07/g, '\\a')             // BEL    → \a (restaura \alpha, \arctan)
    .replace(/\n(?=eq|abla|earrow|warrow)/g, '\\n') // LF → \n (restaura \neq, \nabla...)
    // 1. Eliminar basura unicode
    .replace(/\?{2,}/g, '')
    .replace(/<U\+[A-F0-9]+>/g, '')
    // 2. Normalizar signos de dólar escapados
    .replace(/\\\\\$/g, '$')
    .replace(/\\\$/g, '$')
    // 3. Convertir doble-backslash LaTeX → un solo backslash (formato KaTeX)
    //    \\frac → \frac, \\int → \int, etc.
    .replace(/\\\\([a-zA-Z])/g, '\\$1')
    // 4. Parches de emergencia: comandos LaTeX sin backslash por error del modelo
    //    Lookbehind para no romper \frac{ ya existente
    .replace(/(?<![\\a-zA-Z])rac\{/g, '\\frac{')
    .replace(/(?<![\\a-zA-Z])imes(?=[^a-zA-Z])/g, '\\times ')
    // 5. Limpiar duplicados \frac\frac que pudieran quedar
    .replace(/\\frac\\frac/g, '\\frac')
    // 6. Normalizar secuencias \n literales a saltos de línea reales (cuidando no romper \neq, \nabla, etc)
    .replace(/\\n(?![a-zA-Z])/g, '\n');

  return (
    <div className={`math-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { errorColor: '#ffffff', strict: false }]]}
        components={{
          p: ({ children }) => <p className="mb-2">{children}</p>,
        }}
      >
        {contentLimpio}
      </ReactMarkdown>
    </div>
  );
}