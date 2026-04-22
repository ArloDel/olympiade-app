import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import { useEffect, useRef } from 'react';

interface QuestionRendererProps {
  content: string;
}

export function QuestionRenderer({ content }: QuestionRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
