import React, { useState, useMemo, useEffect } from 'react';
import { InfoIcon, BotIcon } from './icons';

// A custom hook for the fast typewriter effect.
const useFastTypewriter = (text: string) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        if (!text) return;

        let index = 0;
        const CHUNK_SIZE = 20; // Fast chunk size
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

const StreamingMessagePart: React.FC<{ content: string }> = ({ content }) => {
    const displayedContent = useFastTypewriter(content);
    return <p className="text-sm whitespace-pre-wrap">{displayedContent}</p>;
};

const InitialBotMessage: React.FC<{ content: string }> = ({ content }) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const { details, questions } = useMemo(() => {
    const parts = content.split('**Questions to Improve:**');
    let detailsContent = (parts[0] || '').trim();
    const questionsContent = parts[1] ? `**Questions to Improve:**${parts[1]}`.trim() : '';
    
    if (!detailsContent && questionsContent) {
        detailsContent = `**Critique:**\n[My apologies, I did not provide a critique in my analysis. You can ask for one in the chat.]`;
    } else if (!detailsContent && !questionsContent) {
        detailsContent = `[My apologies, I was unable to generate an analysis for this prompt.]`;
    }

    return {
      details: detailsContent,
      questions: questionsContent,
    };
  }, [content]);

  return (
    <div className="flex items-start gap-3">
      <BotIcon className="h-8 w-8 flex-shrink-0 text-rose-500 bg-rose-100 p-1.5 rounded-full" />
      <div className="max-w-xl p-3 rounded-xl shadow-sm bg-white text-slate-700 border border-rose-200/80 w-full">
        <div className="mb-2">
          <button
            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            aria-expanded={isDetailsVisible}
            title="Toggle visibility of the prompt critique and analysis"
          >
            <InfoIcon className="h-5 w-5" />
            <span>{isDetailsVisible ? 'Hide' : 'Show'} Prompt Analysis</span>
          </button>
          {isDetailsVisible && (
            <div className="mt-2 pl-1 border-l-2 border-rose-200">
              <div className="text-sm whitespace-pre-wrap pl-3">
                <StreamingMessagePart content={details} />
              </div>
            </div>
          )}
        </div>
        {questions && <StreamingMessagePart content={questions} />}
      </div>
    </div>
  );
};

export default InitialBotMessage;
