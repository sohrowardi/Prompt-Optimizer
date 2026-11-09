
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, PromptVersion, ChatMessage, ImprovementLog, CritiqueAndQuestions } from './types';
import { initialEnhance, refineInChatStream, runEvaluationStream, runRefinementStream, generateCritiqueAndQuestions } from './services/geminiService';
import HistoryPanel from './components/HistoryPanel';
import WelcomeView from './components/WelcomeView';
import WorkspaceView from './components/WorkspaceView';
import ImprovementCycleView from './components/ImprovementCycleView';
import { LogoIcon, HistoryIcon, NewFileIcon } from './components/icons';

const formatStructuredResponseToMarkdown = (data: CritiqueAndQuestions): string => {
    let md = `**Critique:**\n${data.critique}\n\n`;
    if (data.questions && data.questions.length > 0) {
        md += `**Questions to Improve:**\n`;
        data.questions.forEach((q, i) => {
            md += `${i + 1}. ${q}\n`;
        });
    }
    return md.trim();
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>(() => {
    try {
      const savedHistory = localStorage.getItem('promptHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to parse prompt history from localStorage", error);
      return [];
    }
  });

  const [activePromptId, setActivePromptId] = useState<number | null>(() => {
    try {
      const savedId = localStorage.getItem('activePromptId');
      if (savedId) {
        const id = JSON.parse(savedId);
        // Check if a prompt with this ID actually exists in the loaded history
        const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
        if (history.some((p: PromptVersion) => p.id === id)) {
          return id;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to parse active prompt ID from localStorage", error);
      return null;
    }
  });
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [improvementLog, setImprovementLog] = useState<ImprovementLog[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  // Auto-save history and active prompt ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
    } catch (error) {
      console.error("Failed to save prompt history to localStorage", error);
    }
  }, [promptHistory]);

  useEffect(() => {
    try {
      if (activePromptId !== null) {
        localStorage.setItem('activePromptId', JSON.stringify(activePromptId));
      } else {
        localStorage.removeItem('activePromptId');
      }
    } catch (error) {
      console.error("Failed to save active prompt ID to localStorage", error);
    }
  }, [activePromptId]);

  // Determine initial app state based on loaded data
  useEffect(() => {
    if (activePromptId !== null && promptHistory.length > 0) {
      setAppState(AppState.REFINING);
    } else {
      setAppState(AppState.INITIAL);
    }
  }, []); // Run only once on mount

  const getActivePrompt = useCallback(() => {
    return promptHistory.find(p => p.id === activePromptId)
  }, [promptHistory, activePromptId]);

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
      setChatHistory([initialBotMessage]);
      setAppState(AppState.REFINING);
    } catch (e) {
      setError((e as Error).message);
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
    const currentChatHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
    setChatHistory([...currentChatHistory, { role: 'model', content: '' }]); // Add placeholder

    try {
      const { newPrompt } = await refineInChatStream(
        activePrompt.content,
        currentChatHistory,
        (chunk) => {
          setChatHistory(prev => {
            const newHistory = [...prev];
            const lastMessage = newHistory[newHistory.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
              lastMessage.content += chunk;
            }
            return newHistory;
          });
        }
      );

      setIsStreaming(false); // Streaming part is done.

      if (newPrompt) {
        // A new prompt was generated. Start a new refinement cycle for it.
        setIsLoading(true); // Show loading indicator while we fetch the critique.

        const newId = promptHistory.length > 0 ? Math.max(...promptHistory.map(p => p.id)) + 1 : 1;
        const version: PromptVersion = { id: newId, content: newPrompt, type: 'Refined' };
        setPromptHistory(prev => [version, ...prev]);
        setActivePromptId(newId);

        // Generate new critique and questions for the new prompt, replacing the current chat.
        const { structuredResponse } = await generateCritiqueAndQuestions(newPrompt);
        const botMessage: ChatMessage = {
            role: 'model',
            content: formatStructuredResponseToMarkdown(structuredResponse),
            structuredContent: structuredResponse,
        };
        setChatHistory([botMessage]);

        setIsLoading(false); // Done loading new cycle.
      }
    } catch (e) {
      setError((e as Error).message);
      console.error(e);
      // Remove placeholder on error
      setChatHistory(prev => prev.slice(0, -1));
      setIsStreaming(false); // Ensure streaming stops on error.
    }
  }, [chatHistory, getActivePrompt, promptHistory]);

  const handleStartImprovement = () => {
    setAppState(AppState.IMPROVING);
    setImprovementLog([]);
    handleRunImprovementCycle();
  };
  
  const handleRunImprovementCycle = useCallback(async () => {
    // FIX: Always use the most recent prompt in history as the input for a new cycle.
    const latestPrompt = promptHistory[0];
    if (!latestPrompt) return;

    setIsLoading(true);
    setError(null);
    
    const cycleNumber = improvementLog.filter(log => log.type === 'evaluation').length + 1;
    const evalLogId = `eval-${Date.now()}`;
    const refineLogId = `refine-${Date.now()}`;
    
    try {
      // Step 1: Add evaluation placeholder and stream
      setImprovementLog(prev => [...prev, { type: 'evaluation', id: evalLogId, title: `Cycle ${cycleNumber}: Evaluating Prompt...`, content: '' }]);
      const evaluation = await runEvaluationStream(latestPrompt.content, (chunk) => {
        setImprovementLog(prev => prev.map(l => l.id === evalLogId ? { ...l, content: l.content + chunk } : l));
      });
      
      // Step 2: Add refinement placeholder and stream
      setImprovementLog(prev => [...prev, { type: 'refinement', id: refineLogId, title: `Cycle ${cycleNumber}: Refining Prompt...`, content: '' }]);
      const { improvedPrompt } = await runRefinementStream(latestPrompt.content, evaluation, (chunk) => {
        setImprovementLog(prev => prev.map(l => l.id === refineLogId ? { ...l, content: l.content + chunk } : l));
      });

      // Step 3: Create new prompt version and set it as the active one for the next potential cycle or finish step.
      const newId = promptHistory.length > 0 ? Math.max(...promptHistory.map(p => p.id)) + 1 : 1;
      const version: PromptVersion = { id: newId, content: improvedPrompt, type: '10x' };
      setPromptHistory(prev => [version, ...prev]);
      setActivePromptId(newId);

    } catch (e) {
      setError((e as Error).message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [promptHistory, improvementLog]);

  const handleFinishImprovement = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAppState(AppState.REFINING); // Switch view immediately

    // getActivePrompt now correctly points to the latest prompt created in the last cycle.
    const latestPrompt = getActivePrompt();
    if (!latestPrompt) {
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      // Generate a new critique for the newly created 10x prompt
      const { structuredResponse } = await generateCritiqueAndQuestions(latestPrompt.content);
      const botMessage: ChatMessage = {
          role: 'model',
          content: formatStructuredResponseToMarkdown(structuredResponse),
          structuredContent: structuredResponse,
      };
      setChatHistory([botMessage]);
    } catch (e) {
      setError((e as Error).message);
      console.error(e);
      setChatHistory([]); // Reset on failure
    } finally {
      setIsLoading(false);
    }
  }, [getActivePrompt]);

  const handleSelectHistory = useCallback(async (id: number) => {
    const selectedPrompt = promptHistory.find(p => p.id === id);
    if (!selectedPrompt) return;

    setActivePromptId(id);
    if (appState === AppState.IMPROVING) {
      setAppState(AppState.REFINING);
    }

    // Generate a fresh critique for the selected historical prompt.
    setIsLoading(true);
    setError(null);
    setChatHistory([]); // Clear chat to show loading state
    try {
      const { structuredResponse } = await generateCritiqueAndQuestions(selectedPrompt.content);
      const botMessage: ChatMessage = {
          role: 'model',
          content: formatStructuredResponseToMarkdown(structuredResponse),
          structuredContent: structuredResponse,
      };
      setChatHistory([botMessage]);
    } catch (e) {
      setError((e as Error).message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [promptHistory, appState]);
  
  const handleReset = () => {
    setAppState(AppState.INITIAL);
    setPromptHistory([]);
    setActivePromptId(null);
    setChatHistory([]);
    setImprovementLog([]);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    // Clear localStorage
    localStorage.removeItem('promptHistory');
    localStorage.removeItem('activePromptId');
  };
  
  const renderContent = () => {
    switch(appState) {
      case AppState.INITIAL:
        return <WelcomeView onSubmit={handleInitialSubmit} isLoading={isLoading} />;
      case AppState.REFINING:
        const activePrompt = getActivePrompt();
        if (!activePrompt) {
            // This can happen if history is cleared or corrupted. Reset to a safe state.
             if (!isLoading) { handleReset(); }
             return <div className="text-center text-gray-400">Loading session...</div>;
        }
        return (
          <WorkspaceView 
            activePrompt={activePrompt}
            chatHistory={chatHistory}
            onChatSubmit={handleChatSubmit}
            onStartImprovement={handleStartImprovement}
            isLoading={isLoading}
            isStreaming={isStreaming}
          />
        );
      case AppState.IMPROVING:
         if (!getActivePrompt()) return <div className="text-center text-red-500">Error: No active prompt found.</div>;
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
    <div className="flex h-screen font-sans text-gray-200">
       <HistoryPanel
        history={promptHistory}
        onSelect={handleSelectHistory}
        activePromptId={activePromptId}
        isOpen={isHistoryPanelOpen}
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto relative">
         <header className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} className="p-2 rounded-md hover:bg-gray-800/80 transition-colors" title={isHistoryPanelOpen ? "Close History Panel" : "Open History Panel"}>
                <HistoryIcon className="h-6 w-6 text-gray-500" />
            </button>
            <LogoIcon className="h-8 w-8 text-[#ff91af]" />
            <h1 className="text-2xl font-bold text-gray-100">Prompt Optimizer Pro</h1>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
            title="Start a new session and clear history"
          >
            <NewFileIcon className="h-5 w-5" />
            New Session
          </button>
        </header>
        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-4 flex-shrink-0" role="alert">{error}</div>}
        <div className="flex-1 flex flex-col min-h-0">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
