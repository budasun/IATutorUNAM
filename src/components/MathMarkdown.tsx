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
  return (
    <div className={`math-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}