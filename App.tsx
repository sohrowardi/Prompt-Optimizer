import React, { useState, useCallback } from 'react';
import { AppState, ChatMessage } from './types';
import { enhanceInitialPrompt, critiquePrompt, improvePrompt, continueChat } from './services/geminiService';
import HistoryPanel from './components/HistoryPanel';
import PromptInput from './components/PromptInput';
import MainInterface from './components/MainInterface';
import LoadingOverlay from './components/LoadingOverlay';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [improvementSteps, setImprovementSteps] = useState<string[]>([]);

  const handleInitialSubmit = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setInitialPrompt(prompt);
    setPromptHistory([]);
    setChatHistory([]);
    try {
      const { enhancedPrompt, initialBotMessage } = await enhanceInitialPrompt(prompt);
      setCurrentPrompt(enhancedPrompt);
      setPromptHistory([enhancedPrompt]);
      if (initialBotMessage) {
        setChatHistory([{ role: 'model', content: initialBotMessage }]);
      }
      setAppState(AppState.REFINING);
    } catch (e) {
      setError('Failed to generate professional prompt. Please check your API key and try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChatSubmit = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);
    const updatedChatHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(updatedChatHistory);

    try {
      const { response, newPrompt } = await continueChat(currentPrompt, updatedChatHistory);
      setChatHistory([...updatedChatHistory, { role: 'model', content: response }]);
      if (newPrompt && newPrompt !== currentPrompt) {
        setCurrentPrompt(newPrompt);
        setPromptHistory(prev => [newPrompt, ...prev]);
      }
    } catch (e) {
      setError('Failed to get chat response. Please try again.');
      setChatHistory(updatedChatHistory); // revert to user message only
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, currentPrompt]);

  const handleImprovementCycle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAppState(AppState.IMPROVING_10X);
    setImprovementSteps([]);

    try {
      setImprovementSteps(prev => [...prev, 'Performing detailed 35-point evaluation...']);
      const critique = await critiquePrompt(currentPrompt);

      setImprovementSteps(prev => [...prev, 'Revising prompt based on evaluation report...']);
      const improvedPrompt = await improvePrompt(currentPrompt, critique);
      
      setImprovementSteps(prev => [...prev, 'Finalizing 10x enhanced prompt!']);
      setCurrentPrompt(improvedPrompt);
      setPromptHistory(prev => [improvedPrompt, ...prev]);

      // Reset chat for the new prompt version
      setChatHistory([]);

    } catch (e) {
      setError('Failed to improve the prompt. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
      setAppState(AppState.REFINING);
    }
  }, [currentPrompt]);

  const handleSelectHistory = (prompt: string) => {
    setCurrentPrompt(prompt);
    setChatHistory([]); // Reset chat when loading from history
  };
  
  const handleReset = () => {
    setAppState(AppState.INITIAL);
    setInitialPrompt('');
    setCurrentPrompt('');
    setPromptHistory([]);
    setChatHistory([]);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="flex h-screen font-sans bg-gray-900 text-gray-200">
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-100">Make Any Prompt 10x Better</h1>
          </div>
          {appState !== AppState.INITIAL && (
            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
              Start New
            </button>
          )}
        </header>
        
        <main className="flex-1 flex flex-col">
          {error && <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}

          {isLoading && appState === AppState.IMPROVING_10X && <LoadingOverlay steps={improvementSteps} />}
          
          {appState === AppState.INITIAL && <PromptInput onSubmit={handleInitialSubmit} isLoading={isLoading} />}

          {appState === AppState.REFINING && currentPrompt && (
            <MainInterface
              currentPrompt={currentPrompt}
              chatHistory={chatHistory}
              onChatSubmit={handleChatSubmit}
              onImprove={handleImprovementCycle}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      <HistoryPanel
        history={promptHistory}
        onSelect={handleSelectHistory}
        currentPrompt={currentPrompt}
      />
    </div>
  );
};

export default App;