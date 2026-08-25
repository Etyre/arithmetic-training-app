import { Problem, Operation } from '../types';
import { PERCENT_VALUES, computeAnswer } from '../utils/problems';

export class ProblemGenerator {
  private allProblems: Problem[] = [];

  constructor() {
    this.generateAllProblems();
  }

  private generateAllProblems(): void {
    this.allProblems = [
      ...this.generateAddition(),
      ...this.generateSubtraction(),
      ...this.generateMultiplication(),
      ...this.generateDivision(),
      ...this.generatePercentMultiplication(),
    ];
  }

  private generateAddition(): Problem[] {
    const problems: Problem[] = [];
    for (let i = 1; i <= 12; i++) {
      for (let j = 1; j <= 12; j++) {
        problems.push({
          id: `add-${i}-${j}`,
          operation: '+',
          operand1: i,
          operand2: j,
          answer: i + j,
        });
      }
    }
    return problems;
  }

  private generateSubtraction(): Problem[] {
    const problems: Problem[] = [];
    for (let i = 1; i <= 12; i++) {
      for (let j = 1; j <= 12; j++) {
        if (i - j >= 0) {
          problems.push({
            id: `sub-${i}-${j}`,
            operation: '-',
            operand1: i,
            operand2: j,
            answer: i - j,
          });
        }
      }
    }
    return problems;
  }

  private generateMultiplication(): Problem[] {
    const problems: Problem[] = [];
    for (let i = 1; i <= 12; i++) {
      for (let j = 1; j <= 12; j++) {
        problems.push({
          id: `mul-${i}-${j}`,
          operation: '*',
          operand1: i,
          operand2: j,
          answer: i * j,
        });
      }
    }
    return problems;
  }

  private generateDivision(): Problem[] {
    const problems: Problem[] = [];
    for (let i = 1; i <= 12; i++) {
      for (let j = 1; j <= 12; j++) {
        if (i % j === 0) {
          problems.push({
            id: `div-${i}-${j}`,
            operation: '/',
            operand1: i,
            operand2: j,
            answer: i / j,
          });
        }
      }
    }
    return problems;
  }

  // Percent × percent, answer expressed in percent (e.g. 50% × 5% = 2.5%)
  private generatePercentMultiplication(): Problem[] {
    const problems: Problem[] = [];
    for (const i of PERCENT_VALUES) {
      for (const j of PERCENT_VALUES) {
        problems.push({
          id: `pct-${i}-${j}`,
          operation: '%',
          operand1: i,
          operand2: j,
          answer: computeAnswer('%', i, j),
        });
      }
    }
    return problems;
  }

  getProblems(operations: Operation[]): Problem[] {
    return this.allProblems.filter(p => operations.includes(p.operation));
  }

  getAllProblems(): Problem[] {
    return this.allProblems;
  }
}
