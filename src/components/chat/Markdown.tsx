import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  // Code blocks & inline code
  code({ className, children, ...props }) {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <div className="my-2 rounded-md bg-[#1a1a1a] border border-[#333] overflow-x-auto">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#333]">
            <span className="text-[10px] text-[#555] font-mono">{className?.replace('language-', '')}</span>
          </div>
          <pre className="p-3 text-xs leading-relaxed overflow-x-auto">
            <code className="text-[#e4e4e7]" {...props}>{children}</code>
          </pre>
        </div>
      )
    }
    return (
      <code className="bg-[#1a1a1a] border border-[#333] text-[#e4e4e7] rounded px-1.5 py-0.5 text-xs" {...props}>
        {children}
      </code>
    )
  },
  // Paragraphs
  p({ children }) {
    return <p className="mb-2 last:mb-0">{children}</p>
  },
  // Headings
  h1({ children }) { return <h1 className="text-base font-bold mt-4 mb-2 text-text-primary">{children}</h1> },
  h2({ children }) { return <h2 className="text-sm font-bold mt-3 mb-1.5 text-text-primary">{children}</h2> },
  h3({ children }) { return <h3 className="text-sm font-semibold mt-2 mb-1 text-text-primary">{children}</h3> },
  // Lists
  ul({ children }) { return <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul> },
  ol({ children }) { return <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol> },
  li({ children }) { return <li className="text-sm">{children}</li> },
  // Blockquotes
  blockquote({ children }) {
    return <blockquote className="border-l-2 border-[#555] pl-3 my-2 text-[#a1a1aa] italic">{children}</blockquote>
  },
  // Tables
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto rounded-md border border-[#333]">
        <table className="w-full text-xs">{children}</table>
      </div>
    )
  },
  thead({ children }) { return <thead className="bg-[#1a1a1a] border-b border-[#333]">{children}</thead> },
  th({ children }) { return <th className="px-3 py-1.5 text-left font-semibold text-[#a1a1aa]">{children}</th> },
  td({ children }) { return <td className="px-3 py-1.5 border-t border-[#222]">{children}</td> },
  // Links
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>
  },
  // Horizontal rule
  hr() { return <hr className="border-[#333] my-3" /> },
  // Bold / emphasis
  strong({ children }) { return <strong className="font-semibold text-text-primary">{children}</strong> },
  em({ children }) { return <em className="italic text-[#a1a1aa]">{children}</em> },
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
