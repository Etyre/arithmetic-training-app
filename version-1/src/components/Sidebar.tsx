import React from 'react';
import './Sidebar.css';

type View = 'practice' | 'settings' | 'stats';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="sidebar">
      <button
        className={`sidebar-button ${currentView === 'practice' ? 'active' : ''}`}
        onClick={() => onViewChange('practice')}
        title="Practice"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
      <button
        className={`sidebar-button ${currentView === 'settings' ? 'active' : ''}`}
        onClick={() => onViewChange('settings')}
        title="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
        </svg>
      </button>
      <button
        className={`sidebar-button ${currentView === 'stats' ? 'active' : ''}`}
        onClick={() => onViewChange('stats')}
        title="Statistics"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M18 17l-5-5-4 4-6-6" />
        </svg>
      </button>
    </div>
  );
};
