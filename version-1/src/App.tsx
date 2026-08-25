import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Flashcard } from './components/Flashcard';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { ProgressBar } from './components/ProgressBar';
import { ProblemGenerator } from './services/ProblemGenerator';
import { SessionManager } from './services/SessionManager';
import { DataService } from './services/DataService';
import { RandomSelector } from './algorithms/RandomSelector';
import { Problem, Response, FeedbackType, Settings as SettingsType } from './types';
import './App.css';

const ONE_HOUR_MS = 60 * 60 * 1000;

type View = 'practice' | 'settings' | 'stats';

export const App: React.FC = () => {
  const [view, setView] = useState<View>('practice');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [queryTimestamp, setQueryTimestamp] = useState<number>(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [settings, setSettings] = useState<SettingsType>({
    practiceSet: ['+'],
    graduationInterval: 2000,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [shownCount, setShownCount] = useState(0);
  const [progressUpdate, setProgressUpdate] = useState(0); // Triggers re-render for progress bar

  const problemGenerator = React.useRef(new ProblemGenerator()).current;
  const sessionManager = React.useRef(
    new SessionManager(settings.graduationInterval, settings.practiceSet)
  ).current;
  const cardSelector = React.useRef(new RandomSelector()).current;
  const dataService = React.useRef(new DataService()).current;

  // Calculate progress for the progress bar
  const progressStats = useMemo(() => {
    // This useMemo depends on progressUpdate to trigger recalculation
    void progressUpdate; // Use the dependency

    const allProblems = problemGenerator.getProblems(settings.practiceSet);
    const sessionState = sessionManager.getState();

    let graduatedCount = 0;
    let inProgressCount = 0;

    for (const problem of allProblems) {
      const cardState = sessionState.cardStates.get(problem.id);
      if (cardState?.graduated) {
        graduatedCount++;
      } else if (cardState?.answeredCorrectly) {
        inProgressCount++;
      }
    }

    return {
      totalCards: allProblems.length,
      graduatedCount,
      inProgressCount,
    };
  }, [settings.practiceSet, progressUpdate]);

  // Get responses from current session (since last hour gap or practice set change)
  const sessionResponses = useMemo(() => {
    if (responses.length === 0) return [];

    const sorted = [...responses].sort((a, b) => a.responseTimestamp - b.responseTimestamp);
    let sessionStart = 0;

    for (let i = sorted.length - 1; i >= 0; i--) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      // Check if this is the start of current session
      if (next) {
        const timeDiff = next.queryTimestamp - curr.responseTimestamp;
        const practiceSetChanged =
          JSON.stringify([...curr.practiceSet].sort()) !==
          JSON.stringify([...next.practiceSet].sort());

        if (timeDiff > ONE_HOUR_MS || practiceSetChanged) {
          sessionStart = i + 1;
          break;
        }
      }
    }

    return sorted.slice(sessionStart);
  }, [responses]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const loadedSettings = await dataService.loadSettings();
    const loadedResponses = await dataService.loadResponses();

    setSettings(loadedSettings);
    setResponses(loadedResponses);

    sessionManager.setPracticeSet(loadedSettings.practiceSet);
    sessionManager.setGraduationInterval(loadedSettings.graduationInterval);

    selectNextProblem(loadedSettings);
  };

  const selectNextProblem = (currentSettings: SettingsType = settings, excludeProblemId?: string | null) => {
    const availableProblems = problemGenerator.getProblems(currentSettings.practiceSet);
    const sessionState = sessionManager.getState();

    const nextProblem = cardSelector.selectNext(availableProblems, sessionState, responses, excludeProblemId);

    if (!nextProblem) {
      setIsComplete(true);
      setCurrentProblem(null);
    } else {
      sessionManager.trackShownCard(nextProblem.id);
      setCurrentProblem(nextProblem);
      setQueryTimestamp(Date.now());
      setIsComplete(false);
    }
  };

  const handleSubmitAnswer = async (givenAnswer: number) => {
    if (!currentProblem) return;

    const responseTimestamp = Date.now();
    const { correct, fast } = sessionManager.recordResponse(
      currentProblem,
      givenAnswer,
      queryTimestamp,
      responseTimestamp
    );

    const response: Response = {
      queryTimestamp,
      responseTimestamp,
      problemId: currentProblem.id,
      givenAnswer,
      practiceSet: settings.practiceSet,
    };

    await dataService.saveResponse(response);
    setResponses(prev => [...prev, response]);

    let feedbackType: FeedbackType;
    if (!correct) {
      feedbackType = 'incorrect';
    } else if (!fast) {
      feedbackType = 'slow';
    } else {
      feedbackType = 'correct';
    }

    setFeedback(feedbackType);
    setShownCount(prev => prev + 1);
    setProgressUpdate(prev => prev + 1); // Trigger progress bar update

    const problemIdToExclude = currentProblem.id;
    setTimeout(() => {
      setFeedback(null);
      sessionManager.decrementPriorityCards();
      selectNextProblem(settings, problemIdToExclude);
    }, 500);
  };

  const handleSettingsChange = async (newSettings: SettingsType) => {
    const practiceSetChanged =
      JSON.stringify(newSettings.practiceSet.sort()) !==
      JSON.stringify(settings.practiceSet.sort());

    await dataService.saveSettings(newSettings);
    setSettings(newSettings);

    if (practiceSetChanged) {
      sessionManager.setPracticeSet(newSettings.practiceSet);
      setShownCount(0);
      selectNextProblem(newSettings);
    } else {
      sessionManager.setGraduationInterval(newSettings.graduationInterval);
    }
  };

  const handlePauseResume = () => {
    // Select a new card when resuming from pause
    selectNextProblem(settings, currentProblem?.id);
  };

  const handleViewChange = (newView: View) => {
    const wasOnPractice = view === 'practice';
    setView(newView);

    // If navigating away from practice, discard current card
    // When returning to practice, select a new card
    if (wasOnPractice && newView !== 'practice') {
      // Mark that we need a new card when we return
      setCurrentProblem(null);
    } else if (!wasOnPractice && newView === 'practice') {
      // Returning to practice - select a new card
      selectNextProblem(settings);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'practice':
        return (
          <div className="practice-view">
            <ProgressBar
              totalCards={progressStats.totalCards}
              graduatedCount={progressStats.graduatedCount}
              inProgressCount={progressStats.inProgressCount}
            />
            <Flashcard
              problem={currentProblem}
              onSubmitAnswer={handleSubmitAnswer}
              feedback={feedback}
              isComplete={isComplete}
              sessionResponses={sessionResponses}
              onPauseResume={handlePauseResume}
            />
          </div>
        );
      case 'settings':
        return <Settings settings={settings} onSettingsChange={handleSettingsChange} />;
      case 'stats':
        return <Stats responses={responses} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar currentView={view} onViewChange={handleViewChange} />
      <div className="main-content">{renderContent()}</div>
    </div>
  );
};
