import React from 'react';
import { PromptVersion, ChatMessage } from '../types';
import ChatInterface from './ChatInterface';
import ActivePrompt from './ActivePrompt';
import { RocketIcon } from './icons';

interface WorkspaceViewProps {
  activePrompt: PromptVersion;
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  onStartImprovement: () => void;
  isStreaming: boolean;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  activePrompt,
  chatHistory,
  onChatSubmit,
  onStartImprovement,
  isStreaming,
}) => {
  return (
    <div className="flex-1 flex flex-row min-h-0 gap-6">
      <div className="flex-1 basis-1/2 flex flex-col">
        <ActivePrompt prompt={activePrompt} />
      </div>
      
      <div className="flex-1 basis-1/2 flex flex-col min-h-0 bg-white/60 backdrop-blur-md border border-rose-200/80 rounded-xl">
        <div className="p-4 border-b border-rose-200/80 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Refinement Studio</h3>
            <p className="text-sm text-slate-500">Chat with the AI to refine your prompt.</p>
          </div>
          <button
              onClick={onStartImprovement}
              disabled={isStreaming}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-md font-semibold text-white bg-rose-500 rounded-lg shadow-lg hover:bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              <RocketIcon className="h-5 w-5" />
              Start 10x Improvement
          </button>
        </div>
        <ChatInterface
          chatHistory={chatHistory}
          onChatSubmit={onChatSubmit}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default WorkspaceView;