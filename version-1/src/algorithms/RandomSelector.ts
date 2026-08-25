import { CardSelector } from './CardSelector';
import { Problem, SessionState, Response } from '../types';

export class RandomSelector implements CardSelector {
  // Starting max operand (0-5 = 36 problems per operation)
  private static readonly INITIAL_MAX_OPERAND = 5;
  // Final max operand
  private static readonly FINAL_MAX_OPERAND = 12;
  // How many graduations before unlocking the next operand level
  private static readonly GRADUATIONS_PER_LEVEL = 10;
  // Graduated cards have 10x lower probability
  private static readonly GRADUATED_WEIGHT = 0.1;

  private getDifficulty(problem: Problem): number {
    // Difficulty is the max operand value
    return Math.max(problem.operand1, problem.operand2);
  }

  private getCurrentMaxOperand(sessionState: SessionState): number {
    // Count graduated cards
    let graduatedCount = 0;
    sessionState.cardStates.forEach(state => {
      if (state.graduated) {
        graduatedCount++;
      }
    });

    // Calculate unlock level based on graduations
    const additionalLevels = Math.floor(
      graduatedCount / RandomSelector.GRADUATIONS_PER_LEVEL
    );

    return Math.min(
      RandomSelector.INITIAL_MAX_OPERAND + additionalLevels,
      RandomSelector.FINAL_MAX_OPERAND
    );
  }

  private weightedRandomSelect(
    problems: Problem[],
    sessionState: SessionState
  ): Problem {
    const recentCards = sessionState.recentCards || [];

    // Build weighted list considering:
    // - Graduated cards: 0.1x weight
    // - Recently shown cards: lower weight based on recency
    const weights: number[] = problems.map(p => {
      let weight = 1.0;

      // Graduated cards have lower base weight
      const isGraduated = sessionState.cardStates.get(p.id)?.graduated;
      if (isGraduated) {
        weight = RandomSelector.GRADUATED_WEIGHT;
      }

      // Reduce weight based on recency (more recent = lower weight)
      const recencyIndex = recentCards.indexOf(p.id);
      if (recencyIndex !== -1) {
        // Card was shown recently - reduce weight significantly
        // Most recent (index = length-1) gets lowest weight
        const recencyFactor = (recencyIndex + 1) / (recentCards.length + 1);
        weight *= recencyFactor * 0.3; // Scale down recent cards significantly
      }

      return weight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight === 0) {
      // All weights are zero, fall back to uniform random
      return problems[Math.floor(Math.random() * problems.length)];
    }

    let random = Math.random() * totalWeight;

    for (let i = 0; i < problems.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return problems[i];
      }
    }

    // Fallback (shouldn't happen)
    return problems[problems.length - 1];
  }

  selectNext(
    problems: Problem[],
    sessionState: SessionState,
    responseHistory: Response[],
    currentProblemId?: string | null
  ): Problem | null {
    const currentMaxOperand = this.getCurrentMaxOperand(sessionState);

    // Filter to problems within current difficulty level
    const availableByDifficulty = problems.filter(
      p => this.getDifficulty(p) <= currentMaxOperand
    );

    if (availableByDifficulty.length === 0) {
      // No problems at current level, try to unlock next level
      const sorted = [...problems].sort(
        (a, b) => this.getDifficulty(a) - this.getDifficulty(b)
      );
      return sorted[0] || null;
    }

    // Build exclusion list: recent cards + current card
    const recentCards = sessionState.recentCards || [];
    const excludeIds = new Set(recentCards);
    if (currentProblemId) {
      excludeIds.add(currentProblemId);
    }

    // First, check if there are any priority cards that need to be shown
    const priorityCardIds = sessionState.priorityCards.map(p => p.problemId);
    const priorityProblems = availableByDifficulty.filter(
      p => priorityCardIds.includes(p.id) && !excludeIds.has(p.id)
    );

    // Filter problems by exclusion list
    const availableProblems = availableByDifficulty.filter(p => !excludeIds.has(p.id));

    // Determine which pool to use
    let pool: Problem[];
    if (priorityProblems.length > 0) {
      // Use priority cards if any are available (after exclusions)
      pool = priorityProblems;
    } else if (availableProblems.length > 0) {
      // Otherwise use any available card (with weighted selection)
      pool = availableProblems;
    } else {
      // Last resort: use all at current difficulty (ignore exclusions)
      pool = availableByDifficulty;
    }

    // Use weighted random selection (graduated cards have lower probability)
    return this.weightedRandomSelect(pool, sessionState);
  }
}
