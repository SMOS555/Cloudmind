import React from 'react';
import { getMuscleRecoveryState, MUSCLE_METADATA } from '../utils/recoveryEngine';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import { X, Clock, Flame, ShieldAlert, Dumbbell, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import BatLogo from './BatLogo';

export default function MuscleDetailModal({ muscleKey, muscleData, onClose, onUpdateMuscleHours }) {
  if (!muscleKey) return null;

  const state = getMuscleRecoveryState(muscleData, muscleKey);
  const metadata = MUSCLE_METADATA[muscleKey] || {};

  // Exercises targeting this muscle
  const relevantExercises = EXERCISE_DATABASE.filter(
    (ex) => ex.primaryMuscle === muscleKey || ex.secondaryMuscles.includes(muscleKey)
  ).slice(0, 4);

  const handleSimulateHours = (hours) => {
    onUpdateMuscleHours(muscleKey, hours);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0a0a0e] border border-[#22222e] rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
            state.colorTier === 'dark_red'
              ? 'bg-red-600/30'
              : state.colorTier === 'light_red'
              ? 'bg-red-400/20'
              : 'bg-white/10'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1c1c28]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white border"
              style={{
                backgroundColor: state.fillColor,
                borderColor: state.strokeColor,
              }}
            >
              <BatLogo className="w-6 h-auto text-white" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-widest flex items-center gap-1">
                <span>FITBAT RECOVERY DETAILS</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">{state.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    state.colorTier === 'dark_red'
                      ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                      : state.colorTier === 'light_red' || state.colorTier === 'faint_light_color'
                      ? 'bg-red-900/30 text-red-200 border border-red-500/40'
                      : 'bg-white text-black font-black'
                  }`}
                >
                  {state.statusLabel}
                </span>
                <span className="text-xs text-neutral-400">
                  {metadata.view === 'front' ? 'Anterior' : 'Posterior'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181822] text-neutral-400 hover:text-white hover:bg-[#252533] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recovery Progress Bar */}
        <div className="mt-5 p-4 rounded-xl bg-[#14141d] border border-[#232332]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-white" /> Recovery Capacity
            </span>
            <span className="text-white font-mono font-bold text-sm">
              {state.recoveryPercent}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#0a0a0e] overflow-hidden p-0.5 border border-[#272736]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                state.colorTier === 'dark_red'
                  ? 'bg-gradient-to-r from-red-800 to-red-600 shadow-lg shadow-red-700'
                  : state.colorTier === 'light_red'
                  ? 'bg-gradient-to-r from-red-400 to-red-300'
                  : 'bg-white'
              }`}
              style={{ width: `${state.recoveryPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0d0d12] border border-[#1b1b24]">
              <div className="text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" /> Time Elapsed
              </div>
              <div className="text-white font-mono font-bold mt-1 text-sm">
                {state.hoursAgo !== null ? `${state.hoursAgo} hrs ago` : 'Untrained'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0d0d12] border border-[#1b1b24]">
              <div className="text-neutral-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" /> Full Recovery In
              </div>
              <div className="text-white font-mono font-bold mt-1 text-sm">
                {state.hoursRemaining > 0 ? `~${state.hoursRemaining} hrs` : 'Ready to Train'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Recovery Advice */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#14141d] border border-[#232332]">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BatLogo className="w-4 h-auto text-white" /> Physical Recovery Insight
          </div>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            {state.recommendation}
          </p>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="mt-4 p-3 rounded-xl bg-[#13131c] border border-[#20202d]">
          <div className="text-xs text-neutral-400 font-semibold mb-2 flex items-center justify-between">
            <span>Test Anatomy Color Transition:</span>
            <span className="text-[10px] text-neutral-400 font-mono">Live Simulator</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSimulateHours(2)}
              className="px-2 py-1.5 rounded-lg bg-red-950 border border-red-700 text-red-200 text-xs font-medium hover:bg-red-900 transition flex flex-col items-center"
            >
              <span className="font-bold text-[11px]">Just Trained (2h)</span>
              <span className="text-[9px] opacity-75">Dark Red</span>
            </button>
            <button
              onClick={() => handleSimulateHours(36)}
              className="px-2 py-1.5 rounded-lg bg-red-900/30 border border-red-500/50 text-red-200 text-xs font-medium hover:bg-red-800/40 transition flex flex-col items-center"
            >
              <span className="font-bold text-[11px]">Recovering (36h)</span>
              <span className="text-[9px] opacity-75">Light Color</span>
            </button>
            <button
              onClick={() => handleSimulateHours(80)}
              className="px-2 py-1.5 rounded-lg bg-[#1c1c28] border border-[#303045] text-neutral-300 text-xs font-medium hover:bg-[#28283a] transition flex flex-col items-center"
            >
              <span className="font-bold text-[11px]">Rested (80h)</span>
              <span className="text-[9px] opacity-75">Neutral Slate</span>
            </button>
          </div>
        </div>

        {/* Exercises list */}
        {relevantExercises.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Primary Exercises For {state.name}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {relevantExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-2 rounded-lg bg-[#14141c] border border-[#21212d] text-xs text-neutral-300 flex items-center justify-between"
                >
                  <span className="truncate">{ex.name}</span>
                  <span className="text-[10px] text-red-400 font-mono ml-1">{ex.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
