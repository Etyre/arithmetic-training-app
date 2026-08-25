export type Operation = '+' | '-' | '*' | '/' | '%';

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
  answeredCorrectly: boolean; // Has been answered correctly at least once (regardless of speed)
}

export interface PriorityCard {
  problemId: string;
  remainingCards: number;
  type: 'incorrect' | 'slow';
}

export interface SessionState {
  cardStates: Map<string, CardState>;
  recentIncorrect: string[];
  recentCards: string[]; // Last 2 cards shown, to prevent immediate repeats
  priorityCards: PriorityCard[];
  practiceSet: Operation[];
  graduationInterval: number;
}

export interface Settings {
  practiceSet: Operation[];
  graduationInterval: number;
}

export type FeedbackType = 'correct' | 'slow' | 'incorrect' | null;

export interface Session {
  id: number;
  responses: Response[];
  practiceSet: Operation[];
  startTime: number;
  endTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  avgResponseTime: number;
}

export type StatsView = 'timeSeries' | 'table' | 'sessionDetail';
