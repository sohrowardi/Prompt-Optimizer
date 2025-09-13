
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  isStreaming: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onChatSubmit, isStreaming }) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isStreaming) {
      onChatSubmit(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
        {chatHistory.map((chat, index) => (
          <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
            {chat.role === 'model' && <BotIcon className="h-8 w-8 flex-shrink-0 text-indigo-400 bg-gray-700 p-1.5 rounded-full" />}
            <div className={`max-w-xl p-3 rounded-xl ${
              chat.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
            </div>
             {chat.role === 'user' && <UserIcon className="h-8 w-8 flex-shrink-0 text-gray-300 bg-gray-600 p-1.5 rounded-full" />}
          </div>
        ))}
        {isStreaming && (
           <div className="flex items-start gap-3">
             <BotIcon className="h-8 w-8 flex-shrink-0 text-indigo-400 bg-gray-700 p-1.5 rounded-full" />
             <div className="max-w-md p-3 rounded-xl bg-gray-700 text-gray-300">
                <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-indigo-300 rounded-full animate-pulse"></span>
                </div>
            </div>
           </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your refinement here..."
            className="w-full pl-4 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-full text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming || !message.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
