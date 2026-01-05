import { CardSelector } from './CardSelector';
import { Problem, SessionState, Response } from '../types';

export class RandomSelector implements CardSelector {
  selectNext(
    problems: Problem[],
    sessionState: SessionState,
    responseHistory: Response[]
  ): Problem | null {
    const nonGraduatedProblems = problems.filter(
      p => !sessionState.cardStates.get(p.id)?.graduated
    );

    if (nonGraduatedProblems.length === 0) {
      return null;
    }

    // First, check if there are any priority cards that need to be shown
    const priorityCardIds = sessionState.priorityCards.map(p => p.problemId);
    const priorityProblems = nonGraduatedProblems.filter(
      p => priorityCardIds.includes(p.id)
    );

    // If there are priority cards, select from those
    const pool = priorityProblems.length > 0 ? priorityProblems : nonGraduatedProblems;

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }
}
