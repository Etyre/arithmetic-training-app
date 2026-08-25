import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  totalCards: number;
  graduatedCount: number;
  inProgressCount: number; // Cards with streak 1-2
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalCards,
  graduatedCount,
  inProgressCount,
}) => {
  if (totalCards === 0) return null;

  const graduatedPercent = (graduatedCount / totalCards) * 100;
  const inProgressPercent = (inProgressCount / totalCards) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className="progress-section graduated"
          style={{ width: `${graduatedPercent}%` }}
        />
        <div
          className="progress-section in-progress"
          style={{ width: `${inProgressPercent}%` }}
        />
      </div>
      <div className="progress-label">
        {graduatedCount} / {totalCards} graduated
      </div>
    </div>
  );
};
