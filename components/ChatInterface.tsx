import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';
import InitialBotMessage from './InitialBotMessage';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  isStreaming: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onChatSubmit, isStreaming }) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isStreaming]);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [message]);

  const submitMessage = () => {
    if (message.trim() && !isStreaming) {
      onChatSubmit(message.trim());
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
        {chatHistory.map((chat, index) => {
          if (index === 0 && chat.role === 'model' && chat.content.includes('**Questions to Improve:**')) {
             return <InitialBotMessage key={index} content={chat.content} />;
          }
          return (
            <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
              {chat.role === 'model' && <BotIcon className="h-8 w-8 flex-shrink-0 text-rose-500 bg-rose-100 p-1.5 rounded-full" />}
              <div className={`max-w-xl p-3 rounded-xl shadow-sm ${
                chat.role === 'user'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-slate-700 border border-rose-200/80'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
              </div>
              {chat.role === 'user' && <UserIcon className="h-8 w-8 flex-shrink-0 text-slate-500 bg-slate-100 p-1.5 rounded-full" />}
            </div>
          );
        })}
        {isStreaming && (
           <div className="flex items-start gap-3">
             <BotIcon className="h-8 w-8 flex-shrink-0 text-rose-500 bg-rose-100 p-1.5 rounded-full" />
             <div className="max-w-md p-3 rounded-xl bg-white border border-rose-200/80">
                <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>
                </div>
            </div>
           </div>
        )}
      </div>
      <div className="p-4 border-t border-rose-200/80">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your refinement here... (Ctrl+Enter to send)"
            className="w-full pl-4 pr-12 py-3 bg-white border border-rose-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none overflow-hidden"
            style={{maxHeight: '200px'}}
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming || !message.trim()} className="absolute right-3 bottom-3 p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:bg-rose-200 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;