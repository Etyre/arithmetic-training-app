import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ErrorBar,
  ZAxis,
  Rectangle,
} from 'recharts';
import { Response, Operation, Session, StatsView } from '../types';
import { getCorrectAnswer, getProblemDisplay, OPERATION_PREFIX, OPERATION_LABEL } from '../utils/problems';
import './Stats.css';

interface StatsProps {
  responses: Response[];
}

const OPERATION_COLORS: Record<Operation, string> = {
  '+': '#22c55e', // green
  '-': '#3b82f6', // blue
  '*': '#f59e0b', // amber
  '/': '#8b5cf6', // purple
  '%': '#ec4899', // pink
};

const ONE_HOUR_MS = 60 * 60 * 1000;

function arraysEqual(a: Operation[], b: Operation[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function groupResponsesIntoSessions(responses: Response[]): Session[] {
  if (responses.length === 0) return [];

  const sorted = [...responses].sort((a, b) => a.responseTimestamp - b.responseTimestamp);
  const sessions: Session[] = [];
  let currentSession: Response[] = [sorted[0]];
  let currentPracticeSet = sorted[0].practiceSet;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const timeDiff = curr.queryTimestamp - prev.responseTimestamp;
    const practiceSetChanged = !arraysEqual(curr.practiceSet, currentPracticeSet);

    if (timeDiff > ONE_HOUR_MS || practiceSetChanged) {
      sessions.push(createSession(currentSession, sessions.length));
      currentSession = [curr];
      currentPracticeSet = curr.practiceSet;
    } else {
      currentSession.push(curr);
    }
  }

  if (currentSession.length > 0) {
    sessions.push(createSession(currentSession, sessions.length));
  }

  return sessions;
}

function createSession(responses: Response[], id: number): Session {
  const responseTimes = responses.map(r => r.responseTimestamp - r.queryTimestamp);
  return {
    id,
    responses,
    practiceSet: responses[0].practiceSet,
    startTime: responses[0].queryTimestamp,
    endTime: responses[responses.length - 1].responseTimestamp,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
  };
}

function getSessionColor(practiceSet: Operation[]): string {
  if (practiceSet.length === 1) {
    return OPERATION_COLORS[practiceSet[0]];
  }
  // For mixed, return a gradient-like color (we'll handle stripes in CSS)
  return '#6b7280';
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export const Stats: React.FC<StatsProps> = ({ responses }) => {
  const [statsView, setStatsView] = useState<StatsView>('timeSeries');
  const [excludeWrong, setExcludeWrong] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation>('+');

  const sessions = useMemo(() => groupResponsesIntoSessions(responses), [responses]);

  const filteredSessions = useMemo(() => {
    if (!excludeWrong) return sessions;
    return sessions.map(session => {
      const correctResponses = session.responses.filter(r => {
        const answer = getCorrectAnswer(r.problemId);
        return r.givenAnswer === answer;
      });
      if (correctResponses.length === 0) return null;
      return createSession(correctResponses, session.id);
    }).filter((s): s is Session => s !== null);
  }, [sessions, excludeWrong]);

  const [dateRange, setDateRange] = useState<[number, number]>([0, 100]);

  const dateFilteredSessions = useMemo(() => {
    if (filteredSessions.length === 0) return [];
    const allTimes = filteredSessions.flatMap(s => [s.startTime, s.endTime]);
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const range = maxTime - minTime;
    const startFilter = minTime + (range * dateRange[0]) / 100;
    const endFilter = minTime + (range * dateRange[1]) / 100;
    return filteredSessions.filter(s => s.startTime >= startFilter && s.endTime <= endFilter);
  }, [filteredSessions, dateRange]);

  // Helper to calculate percentile
  const percentile = (arr: number[], p: number): number => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  };

  // Session summary data with percentiles
  const chartData = useMemo(() => {
    return dateFilteredSessions.map(session => {
      const responseTimes = session.responses.map(r => r.responseTimestamp - r.queryTimestamp);
      const p25 = percentile(responseTimes, 25);
      const p75 = percentile(responseTimes, 75);

      return {
        id: session.id,
        date: session.startTime,
        dateLabel: formatDate(session.startTime),
        min: session.minResponseTime,
        max: session.maxResponseTime,
        avg: session.avgResponseTime,
        p25,
        p75,
        practiceSet: session.practiceSet,
        color: getSessionColor(session.practiceSet),
        isMixed: session.practiceSet.length > 1,
        session,
      };
    });
  }, [dateFilteredSessions]);

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setStatsView('sessionDetail');
  };

  const handleExportCSV = () => {
    const headers = ['Query Timestamp', 'Response Timestamp', 'Problem', 'Given Answer', 'Correct Answer', 'Correct', 'Response Time (ms)', 'Practice Set'];
    const rows = responses.map(r => {
      const correctAnswer = getCorrectAnswer(r.problemId);
      const isCorrect = r.givenAnswer === correctAnswer;
      const responseTime = r.responseTimestamp - r.queryTimestamp;
      return [
        new Date(r.queryTimestamp).toISOString(),
        new Date(r.responseTimestamp).toISOString(),
        getProblemDisplay(r.problemId),
        r.givenAnswer,
        correctAnswer,
        isCorrect ? 'Yes' : 'No',
        responseTime,
        r.practiceSet.join(','),
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arithmetic-training-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableData = useMemo(() => {
    const problems: Map<string, { total: number; correct: number; totalTime: number; mixedTotal: number; mixedCorrect: number; mixedTotalTime: number }> = new Map();

    responses.forEach(r => {
      if (!r.problemId.startsWith(OPERATION_PREFIX[selectedOperation] + '-')) return;

      const correctAnswer = getCorrectAnswer(r.problemId);
      const isCorrect = r.givenAnswer === correctAnswer;
      const responseTime = r.responseTimestamp - r.queryTimestamp;
      const isMixed = r.practiceSet.length > 1;

      if (!problems.has(r.problemId)) {
        problems.set(r.problemId, { total: 0, correct: 0, totalTime: 0, mixedTotal: 0, mixedCorrect: 0, mixedTotalTime: 0 });
      }
      const entry = problems.get(r.problemId)!;
      if (isMixed) {
        entry.mixedTotal++;
        if (isCorrect) entry.mixedCorrect++;
        entry.mixedTotalTime += responseTime;
      } else {
        entry.total++;
        if (isCorrect) entry.correct++;
        entry.totalTime += responseTime;
      }
    });

    return Array.from(problems.entries())
      .map(([id, stats]) => ({
        id,
        display: getProblemDisplay(id),
        correctPctSingle: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '-',
        correctPctMixed: stats.mixedTotal > 0 ? ((stats.mixedCorrect / stats.mixedTotal) * 100).toFixed(1) : '-',
        avgTimeSingle: stats.total > 0 ? formatTime(stats.totalTime / stats.total) : '-',
        avgTimeMixed: stats.mixedTotal > 0 ? formatTime(stats.mixedTotalTime / stats.mixedTotal) : '-',
      }))
      .sort((a, b) => {
        const [, a1, a2] = a.id.split('-').map(Number);
        const [, b1, b2] = b.id.split('-').map(Number);
        return a1 - b1 || a2 - b2;
      });
  }, [responses, selectedOperation]);

  const sessionDetailData = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.responses.map((r, i) => {
      const correctAnswer = getCorrectAnswer(r.problemId);
      const isCorrect = r.givenAnswer === correctAnswer;
      return {
        index: i + 1,
        time: r.responseTimestamp - r.queryTimestamp,
        isCorrect,
        problem: getProblemDisplay(r.problemId),
      };
    });
  }, [selectedSession]);

  const renderToolbar = () => (
    <div className="stats-toolbar">
      <button
        className={`toolbar-btn ${statsView === 'timeSeries' ? 'active' : ''}`}
        onClick={() => { setStatsView('timeSeries'); setSelectedSession(null); }}
        title="Time Series"
      >
        📈
      </button>
      <button
        className={`toolbar-btn ${statsView === 'table' ? 'active' : ''}`}
        onClick={() => setStatsView('table')}
        title="Table View"
      >
        📊
      </button>
      <button
        className="toolbar-btn"
        onClick={handleExportCSV}
        title="Export CSV"
      >
        💾
      </button>
    </div>
  );

  const renderLegend = () => (
    <div className="legend">
      {Object.entries(OPERATION_COLORS).map(([op, color]) => (
        <div key={op} className="legend-item">
          <span className="legend-color" style={{ backgroundColor: color }}></span>
          <span>{OPERATION_LABEL[op as Operation]}</span>
        </div>
      ))}
      <div className="legend-item">
        <span className="legend-color legend-mixed"></span>
        <span>Mixed</span>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p><strong>Session {data.id + 1}</strong></p>
          <p>Start: {formatDateTime(data.session.startTime)}</p>
          <p>End: {formatDateTime(data.session.endTime)}</p>
          <p>Practice Set: {data.practiceSet.join(', ')}</p>
          <p>Responses: {data.session.responses.length}</p>
          <p>25th %ile: {formatTime(data.p25)}</p>
          <p>75th %ile: {formatTime(data.p75)}</p>
          <p>Avg: {formatTime(data.avg)}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate the time domain for proportional x-axis
  const timeDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1];
    const times = chartData.map(d => d.date);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    // Add a small padding (5% on each side)
    const range = maxTime - minTime || 1;
    return [minTime - range * 0.05, maxTime + range * 0.05];
  }, [chartData]);

  // Calculate the y-axis domain for response times (based on p75, since that's the top of bars)
  // Default to 15s max, but expand if data exceeds that
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 15000];
    const maxY = Math.max(...chartData.map(d => d.p75));
    return [0, Math.max(15000, maxY * 1.1)];
  }, [chartData]);

  // Custom shape for vertical bar from p25 to p75
  const SessionBar = (props: any) => {
    const { cx, cy, payload, yAxis } = props;
    if (!yAxis || !payload) return null;

    const p25Y = yAxis.scale(payload.p25);
    const p75Y = yAxis.scale(payload.p75);
    const barHeight = Math.abs(p25Y - p75Y);
    const barWidth = 8;

    return (
      <rect
        x={cx - barWidth / 2}
        y={Math.min(p25Y, p75Y)}
        width={barWidth}
        height={Math.max(barHeight, 2)}
        fill={payload.color}
        opacity={0.8}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  const renderTimeSeries = () => (
    <div className="time-series-container">
      <h2>Response Time by Session</h2>
      {chartData.length === 0 ? (
        <p className="no-data">No data to display</p>
      ) : (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  domain={timeDomain}
                  tickFormatter={(timestamp) => formatDate(timestamp)}
                  tick={{ fontSize: 12 }}
                  name="Date"
                />
                <YAxis
                  dataKey="avg"
                  type="number"
                  domain={yDomain}
                  tickFormatter={(v) => formatTime(v)}
                  label={{ value: 'Response Time', angle: -90, position: 'insideLeft' }}
                  name="Response Time"
                  yAxisId="main"
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter
                  data={chartData}
                  onClick={(data) => data && handleSessionClick(data.session)}
                  cursor="pointer"
                  shape={<SessionBar />}
                  yAxisId="main"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="controls">
            <div className="date-range-control">
              <label>Date Range:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={dateRange[0]}
                onChange={(e) => setDateRange([parseInt(e.target.value), dateRange[1]])}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], parseInt(e.target.value)])}
              />
            </div>

            <div className="exclude-wrong-control">
              <label>
                <input
                  type="checkbox"
                  checked={excludeWrong}
                  onChange={(e) => setExcludeWrong(e.target.checked)}
                />
                Exclude wrong answers
              </label>
            </div>
          </div>

          {renderLegend()}
        </>
      )}
    </div>
  );

  const renderSessionDetail = () => {
    if (!selectedSession) return null;

    return (
      <div className="session-detail-container">
        <button className="back-btn" onClick={() => { setStatsView('timeSeries'); setSelectedSession(null); }}>
          ← Back to Overview
        </button>
        <h2>Session {selectedSession.id + 1} Detail</h2>
        <p className="session-info">
          {formatDateTime(selectedSession.startTime)} - {formatDateTime(selectedSession.endTime)}
          <br />
          Practice Set: {selectedSession.practiceSet.join(', ')}
        </p>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="index"
                type="number"
                label={{ value: 'Response #', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                dataKey="time"
                tickFormatter={(v) => formatTime(v)}
                label={{ value: 'Response Time', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => formatTime(value)}
                labelFormatter={(label) => `Response #${label}`}
              />
              <Scatter data={sessionDetailData}>
                {sessionDetailData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCorrect ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#22c55e' }}></span>
            Correct
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            Incorrect
          </span>
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="table-container">
      <h2>Performance by Fact</h2>
      <div className="operation-selector">
        <label>Operation:</label>
        <select
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value as Operation)}
        >
          <option value="+">Addition (+)</option>
          <option value="-">Subtraction (-)</option>
          <option value="*">Multiplication (×)</option>
          <option value="/">Division (÷)</option>
          <option value="%">Percent × Percent (%)</option>
        </select>
      </div>

      {tableData.length === 0 ? (
        <p className="no-data">No data for this operation</p>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Fact</th>
              <th>Correct % (Single)</th>
              <th>Correct % (Mixed)</th>
              <th>Avg Time (Single)</th>
              <th>Avg Time (Mixed)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(row => (
              <tr key={row.id}>
                <td>{row.display}</td>
                <td>{row.correctPctSingle}{row.correctPctSingle !== '-' ? '%' : ''}</td>
                <td>{row.correctPctMixed}{row.correctPctMixed !== '-' ? '%' : ''}</td>
                <td>{row.avgTimeSingle}</td>
                <td>{row.avgTimeMixed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>Statistics</h1>
        <p className="stats-summary">Total responses: {responses.length} | Sessions: {sessions.length}</p>
      </div>

      {renderToolbar()}

      <div className="stats-content">
        {statsView === 'timeSeries' && renderTimeSeries()}
        {statsView === 'sessionDetail' && renderSessionDetail()}
        {statsView === 'table' && renderTable()}
      </div>
    </div>
  );
};
