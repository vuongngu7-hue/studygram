
import React, { useEffect, useRef } from 'react';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 1. Render Math using KaTeX manually on updated content
      renderMathAndMarkdown(containerRef.current, text);
    }
  }, [text]);

  const renderMathAndMarkdown = (container: HTMLDivElement, rawText: string) => {
    // Basic Markdown Parser enhanced with Math logic
    const lines = rawText.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach((line) => {
      let processedLine = line.trim();
      
      if (!processedLine) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += '<div class="h-2"></div>'; // Spacer
        return;
      }

      // Headers
      if (processedLine.startsWith('### ')) {
        htmlContent += `<h3 class="text-lg font-black text-indigo-700 mt-4 mb-2 tracking-tight">${processInlineStyles(processedLine.replace('### ', ''))}</h3>`;
      } else if (processedLine.startsWith('## ')) {
        htmlContent += `<h2 class="text-xl font-black text-slate-800 mt-5 mb-3 tracking-tight">${processInlineStyles(processedLine.replace('## ', ''))}</h2>`;
      } else if (processedLine.startsWith('# ')) {
        htmlContent += `<h1 class="text-2xl font-black text-slate-900 mt-6 mb-4 tracking-tight">${processInlineStyles(processedLine.replace('# ', ''))}</h1>`;
      } 
      // Lists
      else if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
        if (!inList) { htmlContent += '<ul class="space-y-2 mb-4">'; inList = true; }
        htmlContent += `<li class="flex items-start gap-2 text-slate-700"><span class="mt-2 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span><span>${processInlineStyles(processedLine.substring(2))}</span></li>`;
      }
      // Normal Text
      else {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<p class="text-slate-700 font-medium leading-relaxed mb-3 text-[15px]">${processInlineStyles(processedLine)}</p>`;
      }
    });

    if (inList) htmlContent += '</ul>';
    
    container.innerHTML = htmlContent;

    // Post-process: Find all math elements and render KaTeX
    // We look for spans we created with class 'math-tex'
    // @ts-ignore
    if (window.katex) {
       const mathElements = container.querySelectorAll('.math-tex');
       mathElements.forEach((elem) => {
         try {
            const tex = elem.getAttribute('data-tex') || '';
            const isDisplay = elem.getAttribute('data-display') === 'true';
            // @ts-ignore
            window.katex.render(tex, elem, {
              throwOnError: false,
              displayMode: isDisplay
            });
         } catch (e) {
           console.error("KaTeX error", e);
         }
       });
    }
  };

  const processInlineStyles = (str: string) => {
    // 1. Protect Math ($...$ and $$...$$) by converting to placeholders
    // We replace them with <span class="math-tex" data-tex="..."></span>
    let out = str;

    // Block Math $$...$$
    out = out.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
        return `<div class="math-tex my-4 flex justify-center overflow-x-auto py-2" data-tex="${tex.replace(/"/g, '&quot;')}" data-display="true"></div>`;
    });

    // Inline Math $...$
    out = out.replace(/\$([^$]+?)\$/g, (match, tex) => {
        return `<span class="math-tex px-1" data-tex="${tex.replace(/"/g, '&quot;')}" data-display="false"></span>`;
    });

    // 2. Bold **text**
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>');
    
    // 3. Italic *text* (careful not to break math, but math is already hidden)
    out = out.replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>');

    return out;
  };

  return (
    <div ref={containerRef} className={`markdown-body ${className}`} />
  );
};

export default MarkdownText;
