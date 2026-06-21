import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import './MarkdownRenderer.css';

function CodeBlock({ lang, codeText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(codeText || ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="md-codeblock">
      <div className="md-code-header">
        {lang ? <span className="md-lang-tag">{lang}</span> : <span className="md-lang-tag">code</span>}
        <button className="md-copy-btn" type="button" onClick={handleCopy} aria-label="نسخ الكود">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'تم' : 'نسخ'}</span>
        </button>
      </div>
      <pre className="md-pre"><code>{codeText}</code></pre>
    </div>
  );
}

const components = {
  h1: ({ children }) => <h1 className="md-h1" dir="auto">{children}</h1>,
  h2: ({ children }) => <h2 className="md-h2" dir="auto">{children}</h2>,
  h3: ({ children }) => <h3 className="md-h3" dir="auto">{children}</h3>,
  p:  ({ children }) => <p  className="md-p"  dir="auto">{children}</p>,
  ul: ({ children }) => <ul className="md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="md-ol">{children}</ol>,
  li: ({ children }) => <li className="md-li" dir="auto">{children}</li>,
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  em:     ({ children }) => <em     className="md-em">{children}</em>,
  hr:     () => <hr className="md-hr" />,
  blockquote: ({ children }) => (
    <blockquote className="md-bq" dir="auto">{children}</blockquote>
  ),
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    const className = child?.props?.className || '';
    const lang = className.replace('language-', '') || '';
    const codeText = child?.props?.children;
    return <CodeBlock lang={lang} codeText={codeText} />;
  },
  code: ({ children }) => <code className="md-ic">{children}</code>,
  table: ({ children }) => (
    <div className="md-table-wrap"><table className="md-table">{children}</table></div>
  ),
  thead: ({ children }) => <thead className="md-thead">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:    ({ children }) => <tr className="md-tr">{children}</tr>,
  th:    ({ children }) => <th className="md-th" dir="auto">{children}</th>,
  td:    ({ children }) => <td className="md-td" dir="auto">{children}</td>,
};

export default function MarkdownRenderer({ content }) {
  if (!content) return null;
  return (
    <div className="md-root">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
