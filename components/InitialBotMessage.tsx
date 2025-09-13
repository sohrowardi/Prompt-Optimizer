import React, { useState, useMemo } from 'react';
import { InfoIcon, BotIcon } from './icons';

interface InitialBotMessageProps {
  content: string;
}

const InitialBotMessage: React.FC<InitialBotMessageProps> = ({ content }) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const { details, questions } = useMemo(() => {
    const parts = content.split('**Questions to Improve:**');
    let detailsContent = (parts[0] || '').trim();
    const questionsContent = parts[1] ? `**Questions to Improve:**${parts[1]}`.trim() : '';
    
    // If the details part is empty (e.g., model forgot the critique), provide a helpful fallback.
    // This ensures the "Prompt Analysis" button is always visible.
    if (!detailsContent && questionsContent) {
        detailsContent = `**Critique:**\n[My apologies, I did not provide a critique in my analysis. You can ask for one in the chat.]`;
    } else if (!detailsContent && !questionsContent) {
        // This case handles a more severe failure where neither part is present.
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
          >
            <InfoIcon className="h-5 w-5" />
            <span>{isDetailsVisible ? 'Hide' : 'Show'} Prompt Analysis</span>
          </button>
          {isDetailsVisible && (
            <div className="mt-2 pl-1 border-l-2 border-rose-200">
              <p className="text-sm whitespace-pre-wrap pl-3">{details}</p>
            </div>
          )}
        </div>
        {questions && <p className="text-sm whitespace-pre-wrap">{questions}</p>}
      </div>
    </div>
  );
};

export default InitialBotMessage;