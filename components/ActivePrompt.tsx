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

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl p-6 relative flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-800">Active Prompt (Version {prompt.id})</h3>
        <button 
            onClick={handleCopy} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 bg-rose-100/50 rounded-md hover:bg-rose-100 transition-colors"
            title="Copy the active prompt to your clipboard"
        >
          {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-slate-700 text-sm bg-rose-50/70 p-4 rounded-lg overflow-y-auto scrollbar-thin">
        <code>{displayedContent}</code>
        <span ref={endOfContentRef} />
      </pre>
    </div>
  );
};

export default ActivePrompt;
