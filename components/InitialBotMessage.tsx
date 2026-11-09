
import React, { useState } from 'react';
import { CritiqueAndQuestions } from '../types';
import { InfoIcon, BotIcon } from './icons';

interface InitialBotMessageProps {
  structuredContent: CritiqueAndQuestions;
}

const InitialBotMessage: React.FC<InitialBotMessageProps> = ({ structuredContent }) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const { critique, questions } = structuredContent;

  if (!critique && (!questions || questions.length === 0)) {
    return null; // Don't render an empty message
  }

  return (
    <div className="flex items-start gap-3">
      <BotIcon className="h-8 w-8 flex-shrink-0 text-[#ff91af] bg-[#ff91af]/20 p-1.5 rounded-full" />
      <div className="max-w-xl p-3 rounded-xl shadow-sm bg-gray-700 text-gray-200 border border-gray-600 w-full">
        <div className="mb-3">
          <button
            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
            aria-expanded={isDetailsVisible}
            title="Toggle visibility of the prompt critique and analysis"
          >
            <InfoIcon className="h-5 w-5" />
            <span>{isDetailsVisible ? 'Hide' : 'Show'} Prompt Analysis</span>
          </button>
          {isDetailsVisible && (
            <div className="mt-2 pl-1 border-l-2 border-gray-600">
              <div className="text-sm whitespace-pre-wrap pl-3 text-gray-300">
                {critique}
              </div>
            </div>
          )}
        </div>
        
        {questions && questions.length > 0 && (
          <div>
            <p className="font-semibold text-sm text-gray-200 mb-2">Questions to improve this prompt:</p>
            <ul className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              {questions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialBotMessage;