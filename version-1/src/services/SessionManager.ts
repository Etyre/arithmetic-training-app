import { SessionState, Problem, Response, Operation } from '../types';

export class SessionManager {
  private state: SessionState;

  constructor(graduationInterval: number, practiceSet: Operation[]) {
    this.state = {
      cardStates: new Map(),
      recentIncorrect: [],
      recentCards: [],
      priorityCards: [],
      practiceSet,
      graduationInterval,
    };
  }

  getState(): SessionState {
    return this.state;
  }

  setPracticeSet(practiceSet: Operation[]): void {
    this.state.practiceSet = practiceSet;
    this.resetSession();
  }

  setGraduationInterval(interval: number): void {
    this.state.graduationInterval = interval;
  }

  resetSession(): void {
    this.state.cardStates.clear();
    this.state.recentIncorrect = [];
    this.state.recentCards = [];
    this.state.priorityCards = [];
  }

  recordResponse(
    problem: Problem,
    givenAnswer: number,
    queryTimestamp: number,
    responseTimestamp: number
  ): { correct: boolean; fast: boolean } {
    const correct = givenAnswer === problem.answer;
    const responseTime = responseTimestamp - queryTimestamp;
    const fast = responseTime <= this.state.graduationInterval;

    let cardState = this.state.cardStates.get(problem.id);
    const isFirstAttempt = !cardState;

    if (!cardState) {
      cardState = { streak: 0, lastShown: queryTimestamp, graduated: false, answeredCorrectly: false };
      this.state.cardStates.set(problem.id, cardState);
    }

    cardState.lastShown = queryTimestamp;

    const wasGraduated = cardState.graduated;

    if (correct && fast) {
      // Correct and fast
      cardState.answeredCorrectly = true;
      if (isFirstAttempt) {
        // First time seeing this card and got it right+fast = auto-graduate
        cardState.graduated = true;
        cardState.streak = 3;
      } else {
        // Card was seen before (answered wrong or slow at some point) - need 3 consecutive
        cardState.streak++;
        if (cardState.streak >= 3) {
          cardState.graduated = true;
        }
      }
    } else if (correct && !fast) {
      // Correct but slow - ungraduate if graduated, reset streak
      cardState.answeredCorrectly = true;
      cardState.streak = 0;
      if (wasGraduated) {
        cardState.graduated = false;
      }
      this.addPriorityCard(problem.id, 'slow', 15);
    } else {
      // Incorrect - ungraduate if graduated, reset everything
      cardState.streak = 0;
      cardState.answeredCorrectly = false;
      if (wasGraduated) {
        cardState.graduated = false;
      }
      // Incorrect answer: show again within 10 cards
      this.state.recentIncorrect.push(problem.id);
      if (this.state.recentIncorrect.length > 10) {
        this.state.recentIncorrect.shift();
      }
      this.addPriorityCard(problem.id, 'incorrect', 10);
    }

    return { correct, fast };
  }

  private addPriorityCard(problemId: string, type: 'incorrect' | 'slow', remainingCards: number): void {
    // Remove any existing priority for this card
    this.state.priorityCards = this.state.priorityCards.filter(p => p.problemId !== problemId);

    // Add new priority
    this.state.priorityCards.push({
      problemId,
      remainingCards,
      type,
    });
  }

  decrementPriorityCards(): void {
    // Decrement remaining cards for all priority cards
    this.state.priorityCards = this.state.priorityCards
      .map(p => ({ ...p, remainingCards: p.remainingCards - 1 }))
      .filter(p => p.remainingCards > 0);
  }

  getPriorityCards(): string[] {
    return this.state.priorityCards.map(p => p.problemId);
  }

  getNonGraduatedCount(allProblems: Problem[]): number {
    return allProblems.filter(p => !this.state.cardStates.get(p.id)?.graduated).length;
  }

  isSessionComplete(allProblems: Problem[]): boolean {
    return this.getNonGraduatedCount(allProblems) === 0 && allProblems.length > 0;
  }

  trackShownCard(problemId: string): void {
    this.state.recentCards.push(problemId);
    // Keep only the last 10 cards to ensure more variation
    if (this.state.recentCards.length > 10) {
      this.state.recentCards.shift();
    }
  }
}
