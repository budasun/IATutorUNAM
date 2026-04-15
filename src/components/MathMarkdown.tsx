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
    .replace(/\\\\\$/g, '$')
    .replace(/\\\$/g, '$')
    .replace(/\\\\([a-zA-Z])/g, '\\$1')
    .replace(/rac{/g, '\\frac{')
    .replace(/\\n/g, '\n');

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