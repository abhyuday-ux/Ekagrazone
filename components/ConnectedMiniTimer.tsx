import React from 'react';
import { MiniTimer } from './MiniTimer';
import { useTimerTick, useTimerControl } from '../contexts/TimerContext';
import { useTheme } from '../contexts/ThemeContext';
import { Subject, MobileTab } from '../types';

interface ConnectedMiniTimerProps {
  activeTab: MobileTab;
  isZenActive: boolean;
  isSpaceMode: boolean;
  currentSubject: Subject;
  onActivate: () => void;
  handleStartRequest: () => void;
}

export const ConnectedMiniTimer: React.FC<ConnectedMiniTimerProps> = ({
  activeTab, isZenActive, isSpaceMode, currentSubject, onActivate, handleStartRequest
}) => {
  const elapsedMs = useTimerTick();
  const { status, mode, timerDurations, pause } = useTimerControl();
  const { accent } = useTheme();

  const isTimerMode = mode !== 'stopwatch';
  const targetDuration = isTimerMode ? (timerDurations[mode as keyof typeof timerDurations] || 25) * 60 * 1000 : 0;

  return (
    <MiniTimer
      status={status}
      activeTab={activeTab}
      isZenActive={isZenActive}
      isSpaceMode={isSpaceMode}
      targetDuration={targetDuration}
      elapsedMs={elapsedMs}
      isTimerMode={isTimerMode}
      accent={accent}
      currentSubject={currentSubject}
      onToggle={status === 'running' ? pause : handleStartRequest}
      onActivate={onActivate}
    />
  );
};
