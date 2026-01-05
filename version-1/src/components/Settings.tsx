import React, { useState, useEffect } from 'react';
import { Operation, Settings as SettingsType } from '../types';
import './Settings.css';

interface SettingsProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const toggleOperation = (operation: Operation) => {
    const newPracticeSet = localSettings.practiceSet.includes(operation)
      ? localSettings.practiceSet.filter(op => op !== operation)
      : [...localSettings.practiceSet, operation];

    if (newPracticeSet.length === 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
      return;
    }

    const newSettings = { ...localSettings, practiceSet: newPracticeSet };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleIntervalChange = (value: number) => {
    const newSettings = { ...localSettings, graduationInterval: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const operations: { op: Operation; label: string; symbol: string }[] = [
    { op: '+', label: 'Addition', symbol: '+' },
    { op: '-', label: 'Subtraction', symbol: '−' },
    { op: '*', label: 'Multiplication', symbol: '×' },
    { op: '/', label: 'Division', symbol: '÷' },
  ];

  return (
    <div className="settings-container">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Practice Set</h2>
        <p className="section-description">Select which types of problems to practice</p>

        <div className="operation-grid">
          {operations.map(({ op, label, symbol }) => (
            <button
              key={op}
              className={`operation-button ${localSettings.practiceSet.includes(op) ? 'selected' : ''}`}
              onClick={() => toggleOperation(op)}
            >
              <div className="operation-symbol">{symbol}</div>
              <div className="operation-label">{label}</div>
            </button>
          ))}
        </div>

        {showWarning && (
          <div className="warning">
            At least one operation must be selected
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Graduation Interval</h2>
        <p className="section-description">
          Time limit for "fast" answers (in seconds)
        </p>

        <div className="slider-container">
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={localSettings.graduationInterval}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
            className="interval-slider"
          />
          <div className="interval-value">
            {(localSettings.graduationInterval / 1000).toFixed(1)}s
          </div>
        </div>
      </section>
    </div>
  );
};
