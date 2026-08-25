import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Problem, FeedbackType, Response } from '../types';
import { getCorrectAnswer, formatOperand, OPERATION_SYMBOL } from '../utils/problems';
import './Flashcard.css';

const ONE_MINUTE_MS = 60 * 1000;

interface FlashcardProps {
  problem: Problem | null;
  onSubmitAnswer: (answer: number) => void;
  feedback: FeedbackType;
  isComplete: boolean;
  sessionResponses?: Response[];
  onPauseResume?: () => void;
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}


export const Flashcard: React.FC<FlashcardProps> = ({
  problem,
  onSubmitAnswer,
  feedback,
  isComplete,
  sessionResponses = [],
  onPauseResume,
}) => {
  const [input, setInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInput('');
    setIsPaused(false);
    inputRef.current?.focus();

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set up 1-minute timeout for pause
    if (problem && !isComplete) {
      timerRef.current = setTimeout(() => {
        setIsPaused(true);
      }, ONE_MINUTE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [problem, isComplete]);

  const handleContinue = () => {
    setIsPaused(false);
    if (onPauseResume) {
      onPauseResume();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseFloat(input);
    if (!isNaN(answer)) {
      onSubmitAnswer(answer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  const sessionChartData = useMemo(() => {
    return sessionResponses.map((r, i) => ({
      index: i + 1,
      time: r.responseTimestamp - r.queryTimestamp,
      isCorrect: r.givenAnswer === getCorrectAnswer(r.problemId),
    }));
  }, [sessionResponses]);

  const sessionStats = useMemo(() => {
    if (sessionResponses.length === 0) return null;
    const times = sessionResponses.map(r => r.responseTimestamp - r.queryTimestamp);
    const correctCount = sessionResponses.filter(
      r => r.givenAnswer === getCorrectAnswer(r.problemId)
    ).length;
    return {
      total: sessionResponses.length,
      correct: correctCount,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }, [sessionResponses]);

  if (isComplete) {
    return (
      <div className="flashcard-container celebration-view">
        <div className="celebration">
          <h1>Congratulations!</h1>
          <p>You've completed all problems in this practice set!</p>

          {sessionStats && (
            <div className="session-stats">
              <div className="stat">
                <span className="stat-value">{sessionStats.total}</span>
                <span className="stat-label">Problems</span>
              </div>
              <div className="stat">
                <span className="stat-value">{((sessionStats.correct / sessionStats.total) * 100).toFixed(0)}%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatTime(sessionStats.avgTime)}</span>
                <span className="stat-label">Avg Time</span>
              </div>
            </div>
          )}

          {sessionChartData.length > 0 && (
            <div className="session-chart">
              <h3>Session Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="index"
                    type="number"
                    label={{ value: 'Problem #', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    dataKey="time"
                    tickFormatter={formatTime}
                    label={{ value: 'Time', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatTime(value)}
                    labelFormatter={(label) => `Problem #${label}`}
                  />
                  <Scatter data={sessionChartData}>
                    {sessionChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCorrect ? '#22c55e' : '#ef4444'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="dot correct"></span> Correct
                </span>
                <span className="legend-item">
                  <span className="dot incorrect"></span> Incorrect
                </span>
              </div>
            </div>
          )}
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

  if (isPaused) {
    return (
      <div className="flashcard-container">
        <div className="pause-overlay">
          <div className="pause-modal">
            <p>Press continue when you're ready</p>
            <button onClick={handleContinue} className="continue-button">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${feedback || ''}`}>
        <div className="problem">
          <span className="operand">{formatOperand(problem.operation, problem.operand1)}</span>
          <span className="operation">{OPERATION_SYMBOL[problem.operation === '%' ? '*' : problem.operation]}</span>
          <span className="operand">{formatOperand(problem.operation, problem.operand2)}</span>
          <span className="equals">=</span>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="number"
            step="any"
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
