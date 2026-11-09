import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { PromptVersion } from '../types';
import { CopyIcon, CheckIcon } from './icons';

// A custom hook for the fast typewriter effect.
const useFastTypewriter = (text: string) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        if (!text) return;

        let index = 0;
        // Render larger chunks per frame for a very fast "typing" feel.
        const CHUNK_SIZE = Math.max(10, Math.floor(text.length / 15));
        let animationFrameId: number;

        const animate = () => {
            const nextIndex = Math.min(index + CHUNK_SIZE, text.length);
            setDisplayedText(text.substring(0, nextIndex));
            index = nextIndex;

            if (index < text.length) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [text]);

    return displayedText;
};

// fix: Define the missing ActivePromptProps interface.
interface ActivePromptProps {
  prompt: PromptVersion;
}

const ActivePrompt: React.FC<ActivePromptProps> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);
  const displayedContent = useFastTypewriter(prompt.content);
  const endOfContentRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    // Auto-scroll to the bottom as the text "types" out.
    endOfContentRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [displayedContent]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt.content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = prompt.content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = prompt.content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // no-op
      }
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 relative flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-semibold text-gray-200">Active Prompt</h3>
          {prompt.type && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#ff91af]/15 text-[#ff91af] border border-[#ff91af]/30">
              {prompt.type}
            </span>
          )}
        </div>
        <button 
            type="button"
            onClick={handleCopy} 
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-gray-200 bg-gray-700/60 hover:bg-gray-700 hover:text-white border border-gray-600 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#ff91af]/50 active:scale-95 cursor-pointer"
            title="Copy to Clipboard"
            aria-label="Copy to Clipboard"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4 text-gray-300" />
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>
      </div>
      <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-gray-300 text-sm bg-gray-900/50 p-4 rounded-lg overflow-y-auto scrollbar-thin">
        <code>{displayedContent}</code>
        <span ref={endOfContentRef} />
      </pre>
    </div>
  );
};

export default ActivePrompt;
