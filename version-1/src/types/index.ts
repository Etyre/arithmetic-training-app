export type Operation = '+' | '-' | '*' | '/';

export interface Problem {
  id: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  answer: number;
}

export interface Response {
  queryTimestamp: number;
  responseTimestamp: number;
  problemId: string;
  givenAnswer: number;
  practiceSet: Operation[];
}

export interface CardState {
  streak: number;
  lastShown: number;
  graduated: boolean;
}

export interface PriorityCard {
  problemId: string;
  remainingCards: number;
  type: 'incorrect' | 'slow';
}

export interface SessionState {
  cardStates: Map<string, CardState>;
  recentIncorrect: string[];
  priorityCards: PriorityCard[];
  practiceSet: Operation[];
  graduationInterval: number;
}

export interface Settings {
  practiceSet: Operation[];
  graduationInterval: number;
}

export type FeedbackType = 'correct' | 'slow' | 'incorrect' | null;
