import { Operation } from '../types';

// Percent values used for the percentage-multiplication set:
// 0%, 1%, 2%, then every 5% up to 100%.
export const PERCENT_VALUES: number[] = [0, 1, 2, ...Array.from({ length: 20 }, (_, i) => (i + 1) * 5)];

export const OPERATION_PREFIX: Record<Operation, string> = {
  '+': 'add',
  '-': 'sub',
  '*': 'mul',
  '/': 'div',
  '%': 'pct',
};

export const OPERATION_LABEL: Record<Operation, string> = {
  '+': 'Addition',
  '-': 'Subtraction',
  '*': 'Multiplication',
  '/': 'Division',
  '%': 'Percent × Percent',
};

export const OPERATION_SYMBOL: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '%': '%×%',
};

/** Compute the answer for an operation. Percent answers are expressed in percent (50% × 5% = 2.5). */
export function computeAnswer(operation: Operation, op1: number, op2: number): number {
  switch (operation) {
    case '+': return op1 + op2;
    case '-': return op1 - op2;
    case '*': return op1 * op2;
    case '/': return op1 / op2;
    case '%': return Math.round((op1 * op2) / 100 * 10000) / 10000;
  }
}

const PREFIX_TO_OPERATION: Record<string, Operation> = Object.fromEntries(
  Object.entries(OPERATION_PREFIX).map(([op, prefix]) => [prefix, op as Operation])
);

export function parseProblemId(problemId: string): { operation: Operation; op1: number; op2: number } {
  const [prefix, a, b] = problemId.split('-');
  return { operation: PREFIX_TO_OPERATION[prefix] ?? '+', op1: parseFloat(a), op2: parseFloat(b) };
}

export function getCorrectAnswer(problemId: string): number {
  const { operation, op1, op2 } = parseProblemId(problemId);
  return computeAnswer(operation, op1, op2);
}

export function formatOperand(operation: Operation, value: number): string {
  return operation === '%' ? `${value}%` : `${value}`;
}

export function getProblemDisplay(problemId: string): string {
  const { operation, op1, op2 } = parseProblemId(problemId);
  const symbol = operation === '%' ? '×' : OPERATION_SYMBOL[operation];
  return `${formatOperand(operation, op1)} ${symbol} ${formatOperand(operation, op2)}`;
}
