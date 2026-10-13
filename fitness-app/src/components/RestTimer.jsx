import React, { useState, useEffect } from 'react';
import { playRestCompleteSound } from '../utils/audio';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import BatLogo from './BatLogo';

export default function RestTimer() {
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [isActive, setIsActive] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
    } else if (remaining === 0 && isActive) {
      setIsActive(false);
      setHasFinished(true);
      playRestCompleteSound();
    }
    return () => clearInterval(interval);
  }, [isActive, remaining]);

  const handleStart = (seconds) => {
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setIsActive(true);
    setHasFinished(false);
  };

  const togglePlay = () => {
    if (remaining === 0) {
      setRemaining(totalSeconds);
      setIsActive(true);
      setHasFinished(false);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setRemaining(totalSeconds);
    setHasFinished(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-[#0A0A0E] border border-[#202028] rounded-2xl p-4 shadow-xl relative overflow-hidden group">
      {/* Background Bat-Symbol Watermark */}
      <div className="absolute right-2 -bottom-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <BatLogo className="w-36 h-auto text-white" />
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <BatLogo className="w-5 h-auto text-white" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Bat-Rest Interval
          </span>
        </div>
        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black uppercase ${
            hasFinished
              ? 'bg-white text-black animate-bounce shadow-lg shadow-white/30'
              : isActive
              ? 'bg-[#181822] text-white border border-[#2D2D3A]'
              : 'bg-[#101014] text-neutral-500'
          }`}
        >
          {hasFinished ? 'TIME UP! EXECUTE SET!' : isActive ? 'RECHARGING' : 'STANDBY'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 relative z-10">
        {/* Countdown display */}
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black font-mono tracking-tight text-white">
            {formatTime(remaining)}
          </div>
          <span className="text-xs text-neutral-500 font-mono">/ {totalSeconds}s</span>
        </div>

        {/* Action Controls - Black & White Bat Style */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`p-2.5 rounded-xl font-black flex items-center justify-center transition-all ${
              isActive
                ? 'bg-[#1A1A24] text-white border border-[#303040] hover:bg-[#252535]'
                : 'bg-white text-black hover:bg-neutral-200 shadow-md'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 fill-current text-black ml-0.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-[#14141A] hover:bg-[#20202A] text-neutral-400 hover:text-white border border-[#252530] transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-[#161620] overflow-hidden mt-3 relative z-10">
        <div
          className="h-full bg-white transition-all duration-300 shadow-[0_0_8px_#ffffff]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 relative z-10">
        {[45, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            onClick={() => handleStart(sec)}
            className={`py-1 rounded-lg text-xs font-mono font-bold transition ${
              totalSeconds === sec && !hasFinished
                ? 'bg-white text-black shadow'
                : 'bg-[#121218] text-neutral-400 hover:text-white hover:bg-[#1A1A24] border border-[#202028]'
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>
    </div>
  );
}
