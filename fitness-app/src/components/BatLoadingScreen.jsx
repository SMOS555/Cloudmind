import React, { useState, useEffect } from 'react';
import BatLogo from './BatLogo';

export default function BatLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING BATCAVE PROTOCOLS...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 450);
          return 100;
        }

        const next = prev + 5;
        if (next >= 25 && next < 55) {
          setStatusText('CALIBRATING TACTICAL MUSCULAR HEATMAP...');
        } else if (next >= 55 && next < 85) {
          setStatusText('SYNCING BAT-AI RECOVERY ENGINE...');
        } else if (next >= 85) {
          setStatusText('ACCESS GRANTED — WELCOME TO FITBAT.');
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000] text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Bat-Signal Spotlight Effect */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -top-32 w-full h-96 bg-gradient-to-b from-white/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Batman Bat-Symbol Container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
        {/* Glow Halo behind logo */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-110 animate-ping opacity-25" />
          
          {/* Exact Dark Knight Bat Emblem from user upload */}
          <div className="relative px-10 py-8 rounded-3xl bg-[#08080C] border border-white/20 shadow-[0_0_90px_rgba(255,255,255,0.3)] flex items-center justify-center">
            <BatLogo className="w-64 sm:w-80 h-auto" variant="metallic" glow={true} />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white uppercase font-sans">
            FITBAT
          </h1>
          <p className="text-xs font-mono tracking-[0.3em] text-neutral-400 uppercase">
            FITBAT • TACTICAL FITNESS
          </p>
        </div>

        {/* High-Tech Progress Bar */}
        <div className="w-64 sm:w-80 h-1.5 bg-[#141418] rounded-full overflow-hidden border border-[#252530] mb-3">
          <div
            className="h-full bg-white transition-all duration-100 ease-out shadow-[0_0_15px_#ffffff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text ticker */}
        <div className="flex items-center justify-between w-64 sm:w-80 text-[10px] font-mono text-neutral-400 uppercase">
          <span className="truncate">{statusText}</span>
          <span className="font-bold text-white ml-2">{progress}%</span>
        </div>

        {/* Manual Skip Button */}
        <button
          onClick={onComplete}
          className="mt-8 px-4 py-1.5 rounded-full bg-[#101014] hover:bg-[#1C1C24] border border-[#262630] text-[10px] font-mono tracking-widest text-neutral-400 hover:text-white transition uppercase"
        >
          [ Skip Boot Sequence ]
        </button>
      </div>

      {/* Gotham Grid Floor */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
