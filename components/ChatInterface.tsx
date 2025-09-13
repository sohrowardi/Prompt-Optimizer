

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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

  useLayoutEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isStreaming, chatHistory[chatHistory.length - 1]?.content]);
  
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
          // A bot message with structured content gets the special interactive rendering
          if (chat.role === 'model' && chat.structuredContent) {
             return <InitialBotMessage 
                key={index} 
                structuredContent={chat.structuredContent}
             />;
          }

          // Handle the streaming case for the last message
          const isLastMessageStreaming = isStreaming && index === chatHistory.length - 1;

          return (
            <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
              {chat.role === 'model' && <BotIcon className="h-8 w-8 flex-shrink-0 text-[#ff91af] bg-[#ff91af]/20 p-1.5 rounded-full" />}
              {/* FIX: Replaced subtraction operator `-` with colon `:` in the ternary for correct className assignment. */}
              <div className={`max-w-xl p-3 rounded-xl shadow-sm ${
                chat.role === 'user'
                  ? 'bg-[#ff91af] text-gray-900'
                  : 'bg-gray-700 text-gray-200 border border-gray-600'
              }`}>
                <p className="text-sm whitespace-pre-wrap">
                  {chat.content}
                  {isLastMessageStreaming && <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" aria-hidden="true"></span>}
                </p>
              </div>
              {chat.role === 'user' && <UserIcon className="h-8 w-8 flex-shrink-0 text-gray-500 bg-gray-100 p-1.5 rounded-full" />}
            </div>
          );
        })}
        {isStreaming && chatHistory[chatHistory.length -1]?.role !== 'model' && (
           <div className="flex items-start gap-3">
             <BotIcon className="h-8 w-8 flex-shrink-0 text-[#ff91af] bg-[#ff91af]/20 p-1.5 rounded-full" />
             <div className="max-w-md p-3 rounded-xl bg-gray-700 border border-gray-600">
                <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-[#ff91af] rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-[#ff91af] rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-[#ff91af] rounded-full animate-pulse"></span>
                </div>
            </div>
           </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your refinement here... (Ctrl+Enter to send)"
            className="w-full pl-4 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-[#ff91af] focus:border-[#ff91af] resize-none overflow-hidden"
            style={{maxHeight: '200px'}}
            disabled={isStreaming}
          />
          <button 
            type="submit" 
            disabled={isStreaming || !message.trim()} 
            className="absolute right-3 bottom-3 p-2 bg-[#ff91af] text-white rounded-full hover:bg-[#f76a94] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            title="Send Message (Ctrl+Enter)"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;