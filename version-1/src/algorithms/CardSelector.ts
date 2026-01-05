import { Problem, SessionState, Response } from '../types';

export interface CardSelector {
  selectNext(
    problems: Problem[],
    sessionState: SessionState,
    responseHistory: Response[]
  ): Problem | null;
}
