
export enum AppState {
  INITIAL,
  REFINING,
  IMPROVING,
}

export type PromptType = 'Original' | 'Enhanced' | 'Refined' | '10x';

export interface PromptVersion {
  id: number;
  content: string;
  type: PromptType;
}

export interface CritiqueAndQuestions {
  critique: string;
  questions: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string; // This will hold a markdown-formatted version for display
  structuredContent?: CritiqueAndQuestions; // This will hold the parsed data for the interactive UI
}

export interface ImprovementLog {
    id: string;
    type: 'evaluation' | 'refinement';
    title: string;
    content: string;
}

export interface InitialEnhancement {
  enhancedPrompt: string;
  critique: string;
  questions: string[];
}