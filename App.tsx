import React, { useState, useCallback } from 'react';
import { AppState, PromptVersion, ChatMessage, ImprovementLog } from './types';
import { initialEnhance, refineInChat, runEvaluation, runRefinement } from './services/geminiService';
import HistoryPanel from './components/HistoryPanel';
import WelcomeView from './components/WelcomeView';
import WorkspaceView from './components/WorkspaceView';
import ImprovementCycleView from './components/ImprovementCycleView';
import { LogoIcon, HistoryIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>([]);
  const [activePromptId, setActivePromptId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [improvementLog, setImprovementLog] = useState<ImprovementLog[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  const getActivePrompt = () => promptHistory.find(p => p.id === activePromptId);

  const handleInitialSubmit = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    const originalPrompt: PromptVersion = { id: 1, content: prompt, type: 'Original' };
    setPromptHistory([originalPrompt]);

    try {
      const { enhancedPrompt, initialBotMessage } = await initialEnhance(prompt);
      const enhanced: PromptVersion = { id: 2, content: enhancedPrompt, type: 'Enhanced' };
      
      setPromptHistory([enhanced, originalPrompt]);
      setActivePromptId(2);
      setChatHistory([{ role: 'model', content: initialBotMessage }]);
      setAppState(AppState.REFINING);
    } catch (e) {
      setError('Failed to generate initial prompt. Please check your API key and try again.');
      console.error(e);
      setPromptHistory([]); // Clear history on failure
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleChatSubmit = useCallback(async (message: string) => {
    const activePrompt = getActivePrompt();
    if (!activePrompt) return;
    
    setIsStreaming(true);
    setError(null);
    const updatedChatHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(updatedChatHistory);

    try {
      const { response, newPrompt } = await refineInChat(activePrompt.content, updatedChatHistory);
      setChatHistory([...updatedChatHistory, { role: 'model', content: response }]);
      
      if (newPrompt) {
        const newId = promptHistory.length + 1;
        const version: PromptVersion = { id: newId, content: newPrompt, type: 'Refined' };
        setPromptHistory(prev => [version, ...prev]);
        setActivePromptId(newId);
      }
    } catch (e) {
      setError('Failed to get chat response. Please try again.');
      console.error(e);
    } finally {
      setIsStreaming(false);
    }
  }, [chatHistory, getActivePrompt, promptHistory]);
  
  const handleStartImprovement = () => {
    setAppState(AppState.IMPROVING);
    setImprovementLog([]);
    handleRunImprovementCycle();
  };
  
  const handleRunImprovementCycle = useCallback(async () => {
    const activePrompt = getActivePrompt();
    if (!activePrompt) return;

    setIsLoading(true);
    setError(null);
    
    const cycleNumber = improvementLog.filter(log => log.type === 'evaluation').length + 1;
    
    try {
      setImprovementLog(prev => [...prev, { type: 'evaluation', title: `Cycle ${cycleNumber}: Evaluating Prompt...`, content: '' }]);
      const evaluation = await runEvaluation(activePrompt.content);
      setImprovementLog(prev => prev.map(l => l.title.startsWith(`Cycle ${cycleNumber}: Evaluating`) ? { ...l, content: evaluation } : l));
      
      setImprovementLog(prev => [...prev, { type: 'refinement', title: `Cycle ${cycleNumber}: Refining Prompt...`, content: '' }]);
      const { improvedPrompt, fullResponse } = await runRefinement(activePrompt.content, evaluation);
      setImprovementLog(prev => prev.map(l => l.title.startsWith(`Cycle ${cycleNumber}: Refining`) ? { ...l, content: fullResponse } : l));

      const newId = promptHistory.length + 1;
      const version: PromptVersion = { id: newId, content: improvedPrompt, type: '10x' };
      setPromptHistory(prev => [version, ...prev]);
      setActivePromptId(newId);

    } catch (e) {
      setError('The improvement cycle failed. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [getActivePrompt, promptHistory.length, improvementLog]);

  const handleFinishImprovement = () => {
    setAppState(AppState.REFINING);
    setChatHistory([]); // Reset chat for the new prompt
  };

  const handleSelectHistory = (id: number) => {
    setActivePromptId(id);
    setChatHistory([]); // Reset chat when loading from history
    if (appState === AppState.IMPROVING) {
        setAppState(AppState.REFINING);
    }
  };
  
  const handleReset = () => {
    setAppState(AppState.INITIAL);
    setPromptHistory([]);
    setActivePromptId(null);
    setChatHistory([]);
    setImprovementLog([]);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
  };
  
  const renderContent = () => {
    switch(appState) {
      case AppState.INITIAL:
        return <WelcomeView onSubmit={handleInitialSubmit} isLoading={isLoading} />;
      case AppState.REFINING:
        const activePrompt = getActivePrompt();
        if (!activePrompt) return <div className="text-center text-red-400">Error: No active prompt found.</div>;
        return (
          <WorkspaceView 
            activePrompt={activePrompt}
            chatHistory={chatHistory}
            onChatSubmit={handleChatSubmit}
            onStartImprovement={handleStartImprovement}
            isStreaming={isStreaming}
          />
        );
      case AppState.IMPROVING:
         if (!getActivePrompt()) return <div className="text-center text-red-400">Error: No active prompt found.</div>;
         return (
            <ImprovementCycleView 
                log={improvementLog}
                onRunAgain={handleRunImprovementCycle}
                onFinish={handleFinishImprovement}
                isLoading={isLoading}
            />
         );
    }
  }

  return (
    <div className="flex h-screen font-sans text-slate-300">
       <HistoryPanel
        history={promptHistory}
        onSelect={handleSelectHistory}
        activePromptId={activePromptId}
        onReset={handleReset}
        isOpen={isHistoryPanelOpen}
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto relative">
         <header className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" title="Toggle History Panel">
                <HistoryIcon className="h-6 w-6 text-slate-400" />
            </button>
            <LogoIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Prompt Optimizer Pro</h1>
          </div>
        </header>
        {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md mb-4 flex-shrink-0" role="alert">{error}</div>}
        <div className="flex-1 flex flex-col min-h-0">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;