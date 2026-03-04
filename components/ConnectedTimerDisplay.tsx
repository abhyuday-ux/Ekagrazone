import React from 'react';
import { TimerDisplay } from './TimerDisplay';
import { useTimerTick, useTimerControl } from '../contexts/TimerContext';
import { Subject } from '../types';

interface ConnectedTimerDisplayProps {
  todaySubjectTotal: number;
  subjectColor: string;
  isWallpaperMode?: boolean;
  onUpgrade?: () => void;
  subjects?: Subject[];
  sidePanel?: React.ReactNode;
  onStartRequest: () => void; // App handles start request (zen prompt etc)
}

export const ConnectedTimerDisplay: React.FC<ConnectedTimerDisplayProps> = (props) => {
  const elapsedMs = useTimerTick();
  const { 
    status, mode, isOvertime, currentSubjectId, 
    setSubjectId, setMode, pause, stop, 
    timerDurations, setTimerDurations 
  } = useTimerControl();

  return (
    <TimerDisplay
      elapsedMs={elapsedMs}
      status={status}
      mode={mode}
      isOvertime={isOvertime}
      currentSubjectId={currentSubjectId}
      onSelectSubject={setSubjectId}
      onSetMode={setMode}
      onStart={props.onStartRequest}
      onPause={pause}
      onStop={stop}
      durations={timerDurations}
      onUpdateDurations={setTimerDurations}
      {...props}
    />
  );
};
