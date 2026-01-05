import React from 'react';
import { Response } from '../types';
import './Stats.css';

interface StatsProps {
  responses: Response[];
}

export const Stats: React.FC<StatsProps> = ({ responses }) => {
  return (
    <div className="stats-container">
      <h1>Statistics</h1>
      <p className="placeholder-message">
        Statistics visualization coming soon!
      </p>
      <div className="stats-preview">
        <p>Total responses: {responses.length}</p>
      </div>
    </div>
  );
};
