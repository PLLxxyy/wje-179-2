import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  isRunning: boolean;
  startTime: Date | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  elapsed: number; // seconds
}

export default function Timer({ isRunning, startTime, onStart, onStop, onReset, elapsed }: TimerProps) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <div className={`timer-display ${isRunning ? 'running' : ''}`}>
        {formatTime(elapsed)}
      </div>
      <div className="timer-status">
        {isRunning
          ? '正在练习中...'
          : elapsed > 0
            ? `已练习 ${Math.floor(elapsed / 60)} 分钟`
            : '准备开始练习'}
      </div>
      <div className="timer-buttons">
        {!isRunning ? (
          <button className="timer-btn timer-btn-start" onClick={onStart}>
            {elapsed > 0 ? '继续' : '开始'}
          </button>
        ) : (
          <button className="timer-btn timer-btn-stop" onClick={onStop}>
            结束
          </button>
        )}
        {elapsed > 0 && !isRunning && (
          <button className="timer-btn timer-btn-reset" onClick={onReset}>
            重置
          </button>
        )}
      </div>
    </div>
  );
}
