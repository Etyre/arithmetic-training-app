import React, { useState, useEffect, useRef } from 'react';
import { Problem, FeedbackType } from '../types';
import './Flashcard.css';

interface FlashcardProps {
  problem: Problem | null;
  onSubmitAnswer: (answer: number) => void;
  feedback: FeedbackType;
  isComplete: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  problem,
  onSubmitAnswer,
  feedback,
  isComplete,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput('');
    inputRef.current?.focus();
  }, [problem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(input, 10);
    if (!isNaN(answer)) {
      onSubmitAnswer(answer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  const getOperationSymbol = (op: string) => {
    switch (op) {
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  if (isComplete) {
    return (
      <div className="flashcard-container">
        <div className="celebration">
          <h1>🎉 Congratulations! 🎉</h1>
          <p>You've completed all problems in this practice set!</p>
          <p className="celebration-message">
            All arithmetic facts have been mastered. Great work!
          </p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flashcard-container">
        <div className="flashcard">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${feedback || ''}`}>
        <div className="problem">
          <span className="operand">{problem.operand1}</span>
          <span className="operation">{getOperationSymbol(problem.operation)}</span>
          <span className="operand">{problem.operand2}</span>
          <span className="equals">=</span>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="answer-input"
            placeholder="?"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};
