
export enum AppState {
  INITIAL,
  REFINING,
  IMPROVING_10X,
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
