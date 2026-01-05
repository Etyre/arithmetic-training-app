import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Flashcard } from './components/Flashcard';
import { Settings } from './components/Settings';
import { Stats } from './components/Stats';
import { ProblemGenerator } from './services/ProblemGenerator';
import { SessionManager } from './services/SessionManager';
import { DataService } from './services/DataService';
import { RandomSelector } from './algorithms/RandomSelector';
import { Problem, Response, FeedbackType, Settings as SettingsType } from './types';
import './App.css';

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

  const problemGenerator = React.useRef(new ProblemGenerator()).current;
  const sessionManager = React.useRef(
    new SessionManager(settings.graduationInterval, settings.practiceSet)
  ).current;
  const cardSelector = React.useRef(new RandomSelector()).current;
  const dataService = React.useRef(new DataService()).current;

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

  const selectNextProblem = (currentSettings: SettingsType = settings) => {
    const availableProblems = problemGenerator.getProblems(currentSettings.practiceSet);
    const sessionState = sessionManager.getState();

    const nextProblem = cardSelector.selectNext(availableProblems, sessionState, responses);

    if (!nextProblem) {
      setIsComplete(true);
      setCurrentProblem(null);
    } else {
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

    setTimeout(() => {
      setFeedback(null);
      sessionManager.decrementPriorityCards();
      selectNextProblem();
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

  const renderContent = () => {
    switch (view) {
      case 'practice':
        return (
          <Flashcard
            problem={currentProblem}
            onSubmitAnswer={handleSubmitAnswer}
            feedback={feedback}
            isComplete={isComplete}
          />
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
      <Sidebar currentView={view} onViewChange={setView} />
      <div className="main-content">{renderContent()}</div>
    </div>
  );
};
