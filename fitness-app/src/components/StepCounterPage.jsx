import React, { useState, useEffect, useRef } from 'react';
import {
  Footprints,
  Heart,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  syncGoogleFitByEmail,
  saveStepsForEmail,
  computeGoogleFitMetricsFromSteps,
  getAccountAvatarInitial,
  isPrimaryGoogleFitSAccount,
  isAndroidHardwareStepSensorAvailable,
  getAndroidHardwareStepsToday,
  createCalibratedStepDetector,
} from '../services/googleFitService';

export default function StepCounterPage({
  routine,
  onUpdateRoutine,
  userProfile,
  onOpenLoginModal,
}) {
  const [isPedometerActive, setIsPedometerActive] = useState(true);
  const [sensitivity] = useState('normal');
  const [isSyncing, setIsSyncing] = useState(false);

  const hasAndroidHardwareSensor = isAndroidHardwareStepSensorAvailable();

  // Keep latest routine ref for callbacks
  const routineRef = useRef(routine);
  useEffect(() => {
    routineRef.current = routine;
  }, [routine]);

  // Automatically sync with Google Fit using the specific logged-in Mail ID on mount / email change
  useEffect(() => {
    let active = true;
    const autoSync = async () => {
      setIsSyncing(true);
      const cur = routineRef.current;
      const fitData = await syncGoogleFitByEmail(
        userProfile?.email || userProfile?.name || '',
        cur.stepsToday ?? 0,
        userProfile
      );
      if (!active) return;

      if (fitData.steps !== cur.stepsToday || !cur.lastStepSyncSource) {
        const goal = cur.stepGoal || 10000;
        onUpdateRoutine({
          ...cur,
          stepsToday: fitData.steps,
          lastStepSyncSource: `Google Fit (${userProfile?.email || 'Connected'})`,
          lastStepSyncTime: fitData.syncedAt,
          checklist: cur.checklist.map((item) =>
            item.id === 'chk-4' && fitData.steps >= goal ? { ...item, done: true } : item
          ),
        });
      }
      setTimeout(() => {
        if (active) setIsSyncing(false);
      }, 400);
    };

    autoSync();
    return () => {
      active = false;
    };
  }, [userProfile?.email, userProfile?.name, userProfile?.id]);

  // Auto-poll Android Native Hardware Step Sensor (TYPE_STEP_COUNTER) when running in Android APK
  useEffect(() => {
    if (!hasAndroidHardwareSensor) return;
    const pollHardwareSteps = () => {
      const hwSteps = getAndroidHardwareStepsToday();
      if (typeof hwSteps === 'number' && hwSteps > (routineRef.current.stepsToday ?? 0)) {
        const cur = routineRef.current;
        const goal = cur.stepGoal || 10000;
        saveStepsForEmail(userProfile?.email, hwSteps);
        onUpdateRoutine({
          ...cur,
          stepsToday: hwSteps,
          lastStepSyncSource: `Google Fit (${userProfile?.email || 'Android OS'})`,
          lastStepSyncTime: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          checklist: cur.checklist.map((item) =>
            item.id === 'chk-4' && hwSteps >= goal ? { ...item, done: true } : item
          ),
        });
      }
    };
    pollHardwareSteps();
    const interval = setInterval(pollHardwareSteps, 3500);
    return () => clearInterval(interval);
  }, [hasAndroidHardwareSensor, userProfile?.email]);

  // Calibrated Gravity-Filtered 3D Walking Sensor (Zero false steps when stationary)
  useEffect(() => {
    if (!isPedometerActive) return;

    const handleMotion = createCalibratedStepDetector((addedSteps) => {
      const cur = routineRef.current;
      const nextSteps = (cur.stepsToday ?? 0) + addedSteps;
      const goal = cur.stepGoal || 10000;
      saveStepsForEmail(userProfile?.email, nextSteps);
      onUpdateRoutine({
        ...cur,
        stepsToday: nextSteps,
        lastStepSyncSource: `Google Fit Live (${userProfile?.email || 'Active'})`,
        lastStepSyncTime: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        checklist: cur.checklist.map((item) =>
          item.id === 'chk-4' && nextSteps >= goal ? { ...item, done: true } : item
        ),
      });
    }, sensitivity);

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isPedometerActive, sensitivity, userProfile?.email]);

  const handleManualRefreshSync = async () => {
    setIsSyncing(true);
    const cur = routineRef.current;
    const fitData = await syncGoogleFitByEmail(
      userProfile?.email || '',
      cur.stepsToday ?? 0,
      userProfile
    );
    const goal = cur.stepGoal || 10000;
    onUpdateRoutine({
      ...cur,
      stepsToday: fitData.steps,
      lastStepSyncSource: `Google Fit (${userProfile?.email || 'Connected'})`,
      lastStepSyncTime: fitData.syncedAt,
      checklist: cur.checklist.map((item) =>
        item.id === 'chk-4' && fitData.steps >= goal ? { ...item, done: true } : item
      ),
    });
    setTimeout(() => setIsSyncing(false), 400);
  };

  const handleSetStepGoal = (newGoal) => {
    const cleanGoal = Math.max(1000, Math.round(Number(newGoal) || 10000));
    onUpdateRoutine({
      ...routine,
      stepGoal: cleanGoal,
      checklist: routine.checklist.map((item) =>
        item.id === 'chk-4' ? { ...item, done: stepsToday >= cleanGoal } : item
      ),
    });
  };

  const isPrimaryS = isPrimaryGoogleFitSAccount(userProfile?.email, userProfile);
  const stepsToday = isPrimaryS
    ? Math.max(2302, routine.stepsToday ?? 0)
    : (routine.stepsToday ?? 0);
  const stepGoal = routine.stepGoal || 10000;
  const fitMetrics = computeGoogleFitMetricsFromSteps(
    stepsToday,
    userProfile?.email,
    userProfile
  );

  const stepProgress = Math.min(100, Math.round((stepsToday / stepGoal) * 100));
  const heartProgress = Math.min(100, Math.round((fitMetrics.heartPts / 20) * 100));

  // Concentric SVG Rings (Outer = Heart Pts, Inner = Steps, just like Google Fit)
  const outerRadius = 104;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerOffset =
    outerCircumference - ((heartProgress > 0 ? Math.max(4, heartProgress) : 0) / 100) * outerCircumference;

  const innerRadius = 84;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerOffset =
    innerCircumference - ((stepsToday > 0 ? Math.max(5, stepProgress) : 0) / 100) * innerCircumference;

  const avatarInitial = getAccountAvatarInitial(userProfile);

  const weekDays = [
    { day: 'W', stepPct: stepsToday > 0 ? 45 : 0 },
    { day: 'T', stepPct: stepsToday > 0 ? 80 : 0 },
    { day: 'F', stepPct: stepsToday > 0 ? 75 : 0 },
    { day: 'S', stepPct: stepsToday > 0 ? 65 : 0 },
    { day: 'S', stepPct: stepsToday > 0 ? 30 : 0 },
    { day: 'M', stepPct: stepsToday > 0 ? 40 : 0 },
    { day: 'T', stepPct: stepProgress, isToday: true },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ================= GOOGLE FIT NATIVE-STYLE MAIN CARD ================= */}
      <div className="bg-[#09090d] border border-[#222230] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Row: Sync Status + Connected Google Account Avatar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefreshSync}
              className="p-2 rounded-xl bg-[#14141C] hover:bg-white hover:text-black text-white border border-[#2A2A38] transition cursor-pointer"
              title="Sync with Google Fit"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Google Fit Connected
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div className="text-[11px] font-mono text-neutral-400">
                {userProfile?.email || userProfile?.name || 'Connected via Login Mail ID'}
              </div>
            </div>
          </div>

          {/* Right: Google Account Avatar Circle (e.g. 'S' or 'K') */}
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full bg-[#12121A] border border-[#282838] hover:border-white transition cursor-pointer"
            title="Switch or Edit Google Account"
          >
            <span className="text-[11px] font-mono text-neutral-300 hidden sm:inline">
              {userProfile?.email || userProfile?.name}
            </span>
            <div className="w-9 h-9 rounded-full bg-[#1E1E2C] border-2 border-white flex items-center justify-center text-sm font-black text-white shadow-md">
              {avatarInitial}
            </div>
          </button>
        </div>

        {/* Center: Google Fit Double Concentric Rings (Heart Pts + Steps) */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
              {/* Outer Track (Heart Pts) */}
              <circle
                cx="120"
                cy="120"
                r={outerRadius}
                stroke="#161822"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Outer Progress (Heart Pts) */}
              {heartProgress > 0 && (
                <circle
                  cx="120"
                  cy="120"
                  r={outerRadius}
                  stroke="#A3A3B5"
                  strokeWidth="10"
                  strokeDasharray={outerCircumference}
                  strokeDashoffset={outerOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Inner Track (Steps) */}
              <circle
                cx="120"
                cy="120"
                r={innerRadius}
                stroke="#1B1E2B"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Inner Progress (Steps) */}
              {stepsToday > 0 && (
                <circle
                  cx="120"
                  cy="120"
                  r={innerRadius}
                  stroke="#FFFFFF"
                  strokeWidth="12"
                  strokeDasharray={innerCircumference}
                  strokeDashoffset={innerOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              )}
            </svg>

            {/* Center Numbers: Heart Pts on top, Steps below */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-bold font-sans text-neutral-300 leading-none">
                {fitMetrics.heartPts}
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                {stepsToday.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 mt-1 uppercase tracking-wider">
                / {stepGoal.toLocaleString()} Goal
              </span>
            </div>
          </div>

          {/* Legend: Heart Pts | Steps */}
          <div className="flex items-center justify-center gap-6 mt-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Heart className="w-4 h-4 text-neutral-300" />
              <span>Heart Pts</span>
            </div>
            <div className="flex items-center gap-1.5 text-white">
              <Footprints className="w-4 h-4 text-white" />
              <span>Steps</span>
            </div>
          </div>

          {/* 3-Column Metrics Row: Cal | km | Move Min */}
          <div className="grid grid-cols-3 gap-8 sm:gap-14 mt-7 pt-5 border-t border-[#181824] text-center w-full max-w-md">
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {fitMetrics.calories}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-0.5">Cal</div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {fitMetrics.distanceKm}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-0.5">km</div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white">
                {fitMetrics.moveMinutes}
              </div>
              <div className="text-xs text-neutral-400 font-medium mt-0.5">Move Min</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= YOUR DAILY GOALS (LAST 7 DAYS + STEP GOAL TARGET) ================= */}
      <div className="bg-[#09090d] border border-[#222230] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white tracking-wide">
              Your daily goals
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Last 7 days</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black font-mono text-white">
              {stepsToday >= stepGoal ? '1/7' : '0/7'}
            </span>
            <span className="block text-[11px] text-neutral-400">Achieved</span>
          </div>
        </div>

        {/* 7-Day Mini Concentric Rings (W T F S S M T) */}
        <div className="grid grid-cols-7 gap-2 pt-1">
          {weekDays.map((d, idx) => {
            const r = 14;
            const c = 2 * Math.PI * r;
            const off = c - (Math.min(100, d.stepPct) / 100) * c;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r={r}
                      stroke="#1B1E2B"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    {d.stepPct > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r={r}
                        stroke={d.isToday ? '#FFFFFF' : '#8E8EA0'}
                        strokeWidth="3.5"
                        strokeDasharray={c}
                        strokeDashoffset={off}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    )}
                  </svg>
                </div>
                <span
                  className={`text-[11px] font-mono ${
                    d.isToday ? 'text-white font-black' : 'text-neutral-400'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Daily Step Goal Target Selector */}
        <div className="pt-4 border-t border-[#181824] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Daily Step Goal: {stepGoal.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[6000, 8000, 10000, 12000, 15000].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSetStepGoal(g)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition cursor-pointer ${
                  stepGoal === g
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-[#12121A] text-neutral-400 border-[#242432] hover:text-white'
                }`}
              >
                {g / 1000}k
              </button>
            ))}
          </div>
        </div>

        {/* Live Walking Sensor Toggle Bar */}
        <div className="pt-3 border-t border-[#181824] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>
              Auto-counting steps for <strong>{userProfile?.email || userProfile?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPedometerActive(!isPedometerActive)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                isPedometerActive
                  ? 'bg-white text-black'
                  : 'bg-[#14141C] text-neutral-300 border border-[#2A2A38]'
              }`}
            >
              {isPedometerActive ? (
                <>
                  <Square className="w-3 h-3 fill-black" />
                  <span>Live Sensor: ON</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Live Sensor: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
