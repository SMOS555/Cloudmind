import React, { useState } from 'react';
import { getMuscleRecoveryState, MUSCLE_METADATA } from '../utils/recoveryEngine';
import { MUSCLE_VECTOR_DATA } from '../data/muscleVectorPaths';
import { Flame, Settings, RotateCcw, ShieldCheck, Zap, Info } from 'lucide-react';
import BatLogo from './BatLogo';

export default function BodyAnatomy({
  muscleStates,
  onSelectMuscle,
  selectedMuscleKey,
  onResetDemo,
}) {
  const [view, setView] = useState('front'); // 'front' | 'side' | 'back'
  const [heatmapMode, setHeatmapMode] = useState(true);
  const [hoveredMuscle, setHoveredMuscle] = useState(null);

  // Map view to clean base template (without baked-in colors)
  const getImageForView = () => {
    if (view === 'front') return '/anatomy-front-base.png';
    if (view === 'side') return '/anatomy-side-base.png';
    return '/anatomy-back-base.png';
  };

  // Get container aspect ratio matching exact image dimensions
  const getContainerAspect = () => {
    if (view === 'front') return 'aspect-[566/791] max-w-[300px] sm:max-w-[350px]';
    if (view === 'side') return 'aspect-[288/397] max-w-[260px] sm:max-w-[310px]';
    return 'aspect-[325/422] max-w-[280px] sm:max-w-[330px]';
  };

  // Get active muscle state for tooltip / detail display
  const activeHoveredKey = hoveredMuscle || selectedMuscleKey;
  const activeMuscleInfo = activeHoveredKey
    ? getMuscleRecoveryState(muscleStates[activeHoveredKey], activeHoveredKey)
    : null;

  // Real-time dynamic recovery color resolver
  const getRecoveryVisual = (muscleKey) => {
    const state = getMuscleRecoveryState(muscleStates[muscleKey], muscleKey);
    const isDarkRed = state.colorTier === 'dark_red';
    const isLightRed = state.colorTier === 'light_red' || state.colorTier === 'faint_light_color';

    if (isDarkRed) {
      return {
        fill: '#DC2626', // Intense Dark Crimson (<24h)
        stroke: '#EF4444',
        glow: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.95))',
        name: state.name,
        status: 'Recently Trained (<24h)',
        isTrainedOrRecovering: true,
      };
    } else if (isLightRed) {
      return {
        fill: '#F472B6', // Light Coral / Pink (24-72h)
        stroke: '#F472B6',
        glow: 'drop-shadow(0 0 10px rgba(244, 114, 182, 0.85))',
        name: state.name,
        status: 'Recovering (24-72h)',
        isTrainedOrRecovering: true,
      };
    } else {
      return {
        fill: '#FFFFFF', // Athletic Pure White (>72h or rested)
        stroke: '#FFFFFF',
        glow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
        name: state.name,
        status: 'Fully Rested (>72h)',
        isTrainedOrRecovering: false,
      };
    }
  };

  // Quick selectable muscles grouped by view / region
  const frontMuscles = [
    { key: 'chest', label: 'Chest' },
    { key: 'deltoids_front', label: 'Shoulders' },
    { key: 'biceps', label: 'Biceps' },
    { key: 'forearms', label: 'Forearms' },
    { key: 'abs', label: 'Abs / Core' },
    { key: 'obliques', label: 'Obliques' },
    { key: 'quads', label: 'Quads' },
    { key: 'calves_front', label: 'Calves / Shins' },
  ];

  const sideMuscles = [
    { key: 'deltoids_side', label: 'Lateral Shoulder' },
    { key: 'chest', label: 'Pectoral Profile' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'forearms', label: 'Forearms' },
    { key: 'obliques', label: 'Obliques' },
    { key: 'glutes', label: 'Glute Profile' },
    { key: 'quads', label: 'Quad Lateral' },
    { key: 'hamstrings', label: 'Hamstring' },
  ];

  const backMuscles = [
    { key: 'traps', label: 'Trapezius' },
    { key: 'lats', label: 'Lats & Back' },
    { key: 'deltoids_rear', label: 'Rear Delts' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'forearms', label: 'Forearms' },
    { key: 'glutes', label: 'Glutes' },
    { key: 'hamstrings', label: 'Hamstrings' },
    { key: 'calves_back', label: 'Calves' },
  ];

  const currentPillList =
    view === 'front' ? frontMuscles : view === 'side' ? sideMuscles : backMuscles;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Batcave Subtitle Header */}
      <div className="flex items-center gap-2 mb-2 text-neutral-400">
        <BatLogo className="w-8 h-auto text-white" glow={true} />
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
          FITBAT • MUSCLE RECOVERY RADAR
        </span>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-4 text-center font-sans uppercase">
        Tap Any Muscle To Inspect
      </h2>

      {/* Perspective Switcher Pill (Front | Side | Back) */}
      <div className="bg-[#0A0A0D] p-1 rounded-2xl border border-[#202026] flex items-center mb-5 shadow-xl">
        <button
          onClick={() => setView('front')}
          className={`px-7 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
            view === 'front'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView('side')}
          className={`px-7 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
            view === 'side'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Side
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-7 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
            view === 'back'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Back
        </button>
      </div>

      {/* Main Anatomy Card Container matching Exact Image Provided */}
      <div className="w-full bg-[#080B12] border border-[#161C2A] rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-center relative shadow-[0_12px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Ambient Batcave Glow */}
        <div className="absolute top-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Live Hover/Select Tactical HUD Callout Bar */}
        <div className="w-full mb-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0F131E] border border-[#20283A] text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
            <span className="text-neutral-400 uppercase text-[11px] font-bold">Targeted Muscle:</span>
            <span className="text-white font-extrabold uppercase truncate">
              {activeMuscleInfo ? activeMuscleInfo.name : 'Hover or tap muscle'}
            </span>
          </div>
          {activeMuscleInfo && (
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase flex-shrink-0 ml-2 ${
                activeMuscleInfo.colorTier === 'dark_red'
                  ? 'bg-red-950 text-red-200 border border-red-700'
                  : activeMuscleInfo.colorTier === 'light_red'
                  ? 'bg-pink-950 text-pink-200 border border-pink-700'
                  : 'bg-white text-black font-black'
              }`}
            >
              {activeMuscleInfo.statusLabel}
            </span>
          )}
        </div>

        {/* Anatomical Display Container with Exact 1:1 Aspect Ratio Matching Uploaded Images */}
        <div className={`relative w-full ${getContainerAspect()} flex items-center justify-center group my-2 select-none`}>
          {/* Base Anatomical Artwork (Clean titanium stealth body with zero baked-in colors) */}
          <img
            src={getImageForView()}
            alt={`FITBAT Anatomy ${view} view`}
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)] transition-all duration-300"
          />

          {/* DYNAMIC SVG MUSCLE HEATMAP LAYER - Colors change in real-time based on actual recovery states */}
          {(() => {
            const currentVector = MUSCLE_VECTOR_DATA[view] || MUSCLE_VECTOR_DATA.front;
            return (
              <svg
                viewBox={`0 0 ${currentVector.width} ${currentVector.height}`}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
              >
                {currentVector.muscles.map((muscle, idx) => {
                  const isSelected = selectedMuscleKey === muscle.key;
                  const isHovered = hoveredMuscle === muscle.key;
                  const isHighlighted = isSelected || isHovered;
                  const visual = getRecoveryVisual(muscle.key);

                  // Trained (<24h) = vivid crimson red; Recovering (24-72h) = coral pink
                  // Rested (>72h) = transparent so the high-def clean illustration with dark anatomical borders shines through
                  // Hovered / Tapped = tactical highlight with glowing stroke outline
                  const fillOpacity = isHighlighted
                    ? 0.95
                    : visual.isTrainedOrRecovering
                    ? (heatmapMode ? 0.88 : 0.25)
                    : 0.0;

                  return (
                    <path
                      key={`${muscle.key}-${idx}`}
                      d={muscle.path}
                      fill={visual.fill}
                      fillOpacity={fillOpacity}
                      stroke={isHighlighted ? '#FFFFFF' : 'none'}
                      strokeWidth={isHighlighted ? 2.5 : 0}
                      strokeLinejoin="round"
                      style={{
                        filter: isHighlighted ? visual.glow : 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.25s ease, filter 0.2s ease, stroke 0.2s ease, fill-opacity 0.25s ease',
                      }}
                      onClick={() => onSelectMuscle(muscle.key)}
                      onMouseEnter={() => setHoveredMuscle(muscle.key)}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      onTouchStart={() => {
                        onSelectMuscle(muscle.key);
                        setHoveredMuscle(muscle.key);
                      }}
                    >
                      <title>{`${muscle.label} • ${visual.status}`}</title>
                    </path>
                  );
                })}
              </svg>
            );
          })()}
        </div>

        {/* Quick Muscle Selector Pills Bar (100% Precise 1-Tap Targeting) */}
        <div className="w-full mt-3 pt-3 border-t border-[#171D2C]">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-neutral-300">
              <Zap className="w-3.5 h-3.5 text-white" /> Quick Muscle Select Dock:
            </span>
            <span className="text-neutral-500">Tap to inspect</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {currentPillList.map((m) => {
              const state = getMuscleRecoveryState(muscleStates[m.key], m.key);
              const isSelected = selectedMuscleKey === m.key;

              return (
                <button
                  key={m.key}
                  onClick={() => onSelectMuscle(m.key)}
                  onMouseEnter={() => setHoveredMuscle(m.key)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-[#0E121C] border-[#222C3E] text-neutral-300 hover:text-white hover:border-white/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      state.colorTier === 'dark_red'
                        ? 'bg-red-500 shadow-sm shadow-red-500 animate-pulse'
                        : state.colorTier === 'light_red'
                        ? 'bg-pink-400'
                        : 'bg-white'
                    }`}
                  />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Floating Pill matching Batman Black & White Style */}
        <div className="mt-5 flex items-center bg-[#000000]/95 border border-[#23232A] px-6 py-2.5 rounded-full shadow-2xl gap-6 backdrop-blur-md">
          {/* Bat-Signal Heatmap Toggle button */}
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className="flex flex-col items-center group"
            title="Toggle Recovery Heatmap"
          >
            <BatLogo
              className={`w-7 h-auto transition ${
                heatmapMode ? 'text-white' : 'text-neutral-600'
              }`}
            />
            {heatmapMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-sm shadow-white" />
            )}
          </button>

          {/* Separator */}
          <span className="w-[1px] h-5 bg-[#23232A]" />

          {/* View Perspective Cycler */}
          <button
            onClick={() => {
              setView(view === 'front' ? 'side' : view === 'side' ? 'back' : 'front');
            }}
            className="text-neutral-400 hover:text-white transition"
            title="Cycle Perspective (Front -> Side -> Back)"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Reset icon */}
          <button
            onClick={onResetDemo}
            className="text-neutral-400 hover:text-white transition"
            title="Reset Heatmap States"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Caption below */}
        <p className="text-xs text-neutral-400 mt-3 tracking-wider uppercase font-mono font-medium">
          Tap any muscle hotspot or selector pill above
        </p>
      </div>

      {/* Monochrome Legend matching user prompt */}
      <div className="w-full mt-4 flex items-center justify-between text-xs text-neutral-400 px-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#D32F2F] border border-red-500 shadow-sm" />
          <span className="text-white font-bold">Recently Trained (Dark Red)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F87171] border border-red-300" />
          <span className="text-neutral-300 font-medium">Recovering (Light Color)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-white border border-neutral-300" />
          <span className="text-white font-bold">Rested (White)</span>
        </div>
      </div>
    </div>
  );
}
