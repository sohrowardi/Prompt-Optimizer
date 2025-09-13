
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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ImprovementLog {
    type: 'evaluation' | 'refinement';
    title: string;
    content: string;
}
