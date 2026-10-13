import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Droplets,
  Moon,
  Beef,
  Zap,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Check,
  Sparkles,
  Footprints,
  ArrowRight,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import BatLogo from './BatLogo';
import { INITIAL_DAILY_ROUTINE } from '../data/defaultState';

export default function DailyRoutineTracker({
  routine,
  onUpdateRoutine,
  userProfile,
  onOpenStepsTab,
}) {
  const [newHabitText, setNewHabitText] = useState('');
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editingHabitText, setEditingHabitText] = useState('');
  const [showTargetModal, setShowTargetModal] = useState(false);

  const stepsToday = routine.stepsToday || 0;
  const stepGoal = routine.stepGoal || 10000;

  // Editable Target Goals State
  const [customSteps, setCustomSteps] = useState(stepGoal);
  const [customProtein, setCustomProtein] = useState(routine.proteinGoalGrams || 160);
  const [customWater, setCustomWater] = useState(routine.waterGoalLiters || 3.5);
  const [customSleep, setCustomSleep] = useState(routine.sleepGoalHours || 8.0);
  const [customWorkout, setCustomWorkout] = useState(routine.dailyWorkoutGoalMinutes || 60);

  const toggleChecklist = (id) => {
    if (editingHabitId === id) return;
    const updated = routine.checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    onUpdateRoutine({ ...routine, checklist: updated });
  };

  const handleAddHabit = () => {
    if (!newHabitText.trim()) return;
    const newItem = {
      id: `chk-${Date.now()}`,
      text: newHabitText.trim(),
      done: false,
    };
    onUpdateRoutine({
      ...routine,
      checklist: [...routine.checklist, newItem],
    });
    setNewHabitText('');
  };

  const handleStartEditHabit = (e, item) => {
    e.stopPropagation();
    setEditingHabitId(item.id);
    setEditingHabitText(item.text);
  };

  const handleSaveEditHabit = (e, id) => {
    e?.stopPropagation();
    if (!editingHabitText.trim()) return;
    const updated = routine.checklist.map((item) =>
      item.id === id ? { ...item, text: editingHabitText.trim() } : item
    );
    onUpdateRoutine({ ...routine, checklist: updated });
    setEditingHabitId(null);
    setEditingHabitText('');
  };

  const handleCancelEditHabit = (e) => {
    e?.stopPropagation();
    setEditingHabitId(null);
    setEditingHabitText('');
  };

  const handleDeleteHabit = (e, id) => {
    e.stopPropagation();
    const updated = routine.checklist.filter((item) => item.id !== id);
    onUpdateRoutine({ ...routine, checklist: updated });
    if (editingHabitId === id) {
      setEditingHabitId(null);
      setEditingHabitText('');
    }
  };

  const handleUncheckAllHabits = () => {
    const updated = routine.checklist.map((item) => ({ ...item, done: false }));
    onUpdateRoutine({ ...routine, checklist: updated });
  };

  const handleRestoreDefaultHabits = () => {
    onUpdateRoutine({
      ...routine,
      checklist: INITIAL_DAILY_ROUTINE.checklist.map((item) => ({ ...item, done: false })),
    });
  };

  const handleAddWater = (amount) => {
    const updated = Math.min(10, Number((routine.waterLiters + amount).toFixed(1)));
    onUpdateRoutine({ ...routine, waterLiters: updated });
  };

  const handleUpdateProtein = (amount) => {
    const updated = Math.max(0, routine.proteinGrams + amount);
    onUpdateRoutine({
      ...routine,
      proteinGrams: updated,
      checklist: routine.checklist.map((item) =>
        item.id === 'chk-5' && updated >= (routine.proteinGoalGrams || 160)
          ? { ...item, done: true }
          : item
      ),
    });
  };

  const handleSetSleep = (hours) => {
    onUpdateRoutine({ ...routine, sleepHours: hours });
  };

  const handleSaveTargets = (e) => {
    e?.preventDefault();
    onUpdateRoutine({
      ...routine,
      stepGoal: Number(customSteps) || 10000,
      proteinGoalGrams: Number(customProtein) || 160,
      waterGoalLiters: Number(customWater) || 3.5,
      sleepGoalHours: Number(customSleep) || 8.0,
      dailyWorkoutGoalMinutes: Number(customWorkout) || 60,
    });
    setShowTargetModal(false);
  };

  // Auto-calculate scientific targets from athlete bodyweight & goal
  const handleAutoCalculate = () => {
    const bw = userProfile?.weight > 0 ? userProfile.weight : 75;
    const weightKg = userProfile?.weightUnit === 'lbs' ? bw * 0.453592 : bw;
    const recProtein = Math.round(weightKg * 2.2);
    const recWater = Number((weightKg * 0.045).toFixed(1));
    const recSteps =
      userProfile?.goal === 'shred' || userProfile?.goal === 'endurance'
        ? 12000
        : userProfile?.goal === 'strength'
        ? 8000
        : 10000;

    setCustomSteps(recSteps);
    setCustomProtein(recProtein);
    setCustomWater(recWater);
    setCustomSleep(8.0);
    setCustomWorkout(60);
  };

  const stepProgress = Math.min(100, Math.round((stepsToday / stepGoal) * 100));
  const workoutProgress = Math.min(
    100,
    Math.round((routine.workoutMinutesToday / (routine.dailyWorkoutGoalMinutes || 60)) * 100)
  );

  const completedHabits = routine.checklist.filter((i) => i.done).length;
  const habitPercentage =
    routine.checklist.length > 0
      ? Math.round((completedHabits / routine.checklist.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Compact Link Bar to Dedicated Steps Window */}
      {onOpenStepsTab && (
        <div
          onClick={onOpenStepsTab}
          className="bg-[#09090d] border border-[#222230] hover:border-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 cursor-pointer transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-black flex items-center justify-center">
              <Footprints className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Google Step Counter: {stepsToday.toLocaleString()} / {stepGoal.toLocaleString()} steps
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-black font-mono font-black text-[10px]">
                  {stepProgress}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Open dedicated Steps Window for Google Fit sync &amp; live walking sensor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white group-hover:translate-x-1 transition">
            <span>Open Steps</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Top 3 Summary Cards: Workout Time, Streak, Adherence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workout Time Tracker Card */}
        <div className="bg-[#09090d] border border-[#1e1e28] rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" /> Daily Workout Time
            </span>
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-white text-black">
              {workoutProgress}% HIT
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {routine.workoutMinutesToday}
            </span>
            <span className="text-sm text-neutral-400 font-mono font-bold">
              / {routine.dailyWorkoutGoalMinutes || 60} mins
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#161620] overflow-hidden mt-3">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${workoutProgress}%` }}
            />
          </div>

          <div className="text-[11px] text-neutral-400 mt-2 flex items-center justify-between font-mono">
            <span>Weekly Aggregation:</span>
            <span className="font-bold text-white">
              {Math.floor(routine.weeklyWorkoutMinutes / 60)}h {routine.weeklyWorkoutMinutes % 60}m
            </span>
          </div>
        </div>

        {/* Consistency Streak */}
        <div className="bg-[#09090d] border border-[#1e1e28] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <BatLogo className="w-6 h-auto text-white" /> Consistency Streak
            </span>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">ACTIVE</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {routine.streakDays}
            </span>
            <span className="text-sm text-neutral-400 font-black uppercase tracking-wider">
              Days Logged
            </span>
          </div>

          <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
            Personalised daily tracking for {userProfile?.name || 'Member'}
            {userProfile?.email ? ` (${userProfile.email})` : ''}.
          </p>
        </div>

        {/* Routine Adherence Score */}
        <div className="bg-[#09090d] border border-[#1e1e28] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white" /> Protocol Adherence
            </span>
            <span className="text-xs font-mono font-bold text-neutral-300">
              {completedHabits}/{routine.checklist.length} Complete
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {habitPercentage}%
            </span>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Discipline Index</span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#161620] overflow-hidden mt-3">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${habitPercentage}%` }}
            />
          </div>

          <div className="text-[11px] text-neutral-400 mt-2 font-mono">
            {habitPercentage >= 80 ? 'Peak conditioning targets maintained.' : 'Complete remaining daily checklist items.'}
          </div>
        </div>
      </div>

      {/* Routine Checklists & Macro Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Rituals Checklist (7 cols) - Editable & Deletable */}
        <div className="lg:col-span-7 bg-[#08080c] border border-[#1e1e28] rounded-2xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#181822]">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1.5 rounded-xl bg-white flex items-center justify-center text-black flex-shrink-0">
                <BatLogo className="w-6 h-auto text-black" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  DAILY HABIT CHECKLIST
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tap to complete • Use Edit or Delete icons to customize habits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedHabits > 0 && (
                <button
                  type="button"
                  onClick={handleUncheckAllHabits}
                  className="px-2.5 py-1 rounded-lg bg-[#14141C] hover:bg-white hover:text-black text-neutral-300 border border-[#262634] text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Uncheck all habits for a new day"
                >
                  <RotateCcw className="w-3 h-3" /> Uncheck All
                </button>
              )}
              <span className="text-xs font-mono font-black text-black bg-white px-3 py-1 rounded-full">
                {completedHabits}/{routine.checklist.length} DONE
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {routine.checklist.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0D0D14] border border-dashed border-[#242432] text-center space-y-2">
                <p className="text-xs text-neutral-400 font-mono">
                  No daily habits in your checklist yet. Add a custom habit below or restore defaults.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDefaultHabits}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-neutral-200 transition"
                >
                  Restore Default Habits
                </button>
              </div>
            ) : (
              routine.checklist.map((item) => {
                const isEditing = editingHabitId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 select-none ${
                      isEditing
                        ? 'bg-[#13131E] border-white cursor-default'
                        : item.done
                        ? 'bg-[#101018] border-white/40 text-neutral-200 cursor-pointer'
                        : 'bg-[#0e0e14] border-[#1e1e28] text-neutral-400 hover:border-white/30 cursor-pointer'
                    }`}
                  >
                    {isEditing ? (
                      <div
                        className="flex items-center gap-2 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingHabitText}
                          onChange={(e) => setEditingHabitText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditHabit(e, item.id);
                            if (e.key === 'Escape') handleCancelEditHabit(e);
                          }}
                          className="flex-1 bg-[#08080C] border border-white/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-sans"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveEditHabit(e, item.id)}
                          className="p-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
                          title="Save Habit"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditHabit}
                          className="p-1.5 rounded-lg bg-[#1A1A24] text-neutral-300 hover:text-white transition cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.done ? (
                            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs font-semibold truncate ${
                              item.done ? 'line-through text-neutral-400' : 'text-neutral-200'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 hidden sm:inline mr-1">
                            {item.done ? 'DONE' : 'PENDING'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditHabit(e, item)}
                            className="p-1.5 rounded-lg bg-[#151520] hover:bg-white hover:text-black text-neutral-400 border border-[#242432] transition cursor-pointer"
                            title="Edit habit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHabit(e, item.id)}
                            className="p-1.5 rounded-lg bg-[#151520] hover:bg-white hover:text-black text-neutral-400 border border-[#242432] transition cursor-pointer"
                            title="Delete habit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add custom routine habit */}
          <div className="mt-4 pt-4 border-t border-[#181822] flex items-center gap-2">
            <input
              type="text"
              placeholder="Add personal daily habit..."
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              className="flex-1 bg-[#121218] border border-[#22222e] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
            <button
              onClick={handleAddHabit}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Bio-Fuel & Recovery Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Header with Calibrate Targets Button */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-white" /> Daily Nutrition &amp; Recovery
            </span>
            <button
              onClick={() => {
                setCustomSteps(routine.stepGoal || 10000);
                setCustomProtein(routine.proteinGoalGrams || 160);
                setCustomWater(routine.waterGoalLiters || 3.5);
                setCustomSleep(routine.sleepGoalHours || 8.0);
                setCustomWorkout(routine.dailyWorkoutGoalMinutes || 60);
                setShowTargetModal(true);
              }}
              className="px-3 py-1 rounded-xl bg-[#121218] hover:bg-white hover:text-black border border-[#22222E] text-white text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Calibrate personal targets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Set All Targets</span>
            </button>
          </div>

          {/* Hydration card */}
          <div className="bg-[#08080c] border border-[#1e1e28] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-white" /> Hydration Volume
              </span>
              <span className="text-xs font-mono font-black text-white">
                {routine.waterLiters} / {routine.waterGoalLiters || 3.5} L
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#161620] overflow-hidden mb-3">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, (routine.waterLiters / (routine.waterGoalLiters || 3.5)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddWater(0.25)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                +250ml
              </button>
              <button
                onClick={() => handleAddWater(0.5)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                +500ml
              </button>
              <button
                onClick={() => handleAddWater(1.0)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                +1.0L
              </button>
            </div>
          </div>

          {/* Protein Intake */}
          <div className="bg-[#08080c] border border-[#1e1e28] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Beef className="w-4 h-4 text-white" /> Daily Protein Target
              </span>
              <span className="text-xs font-mono font-black text-white">
                {routine.proteinGrams} / {routine.proteinGoalGrams || 160} g
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#161620] overflow-hidden mb-3">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, (routine.proteinGrams / (routine.proteinGoalGrams || 160)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateProtein(25)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                +25g (Shake)
              </button>
              <button
                onClick={() => handleUpdateProtein(40)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                +40g (Meal)
              </button>
            </div>
          </div>

          {/* Sleep Recovery */}
          <div className="bg-[#08080c] border border-[#1e1e28] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Moon className="w-4 h-4 text-white" /> Sleep Recovery Window
              </span>
              <span className="text-xs font-mono font-black text-white">
                {routine.sleepHours} / {routine.sleepGoalHours || 8.0} hrs
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#161620] overflow-hidden mb-3">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, (routine.sleepHours / (routine.sleepGoalHours || 8.0)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetSleep(7.0)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                7.0 hrs
              </button>
              <button
                onClick={() => handleSetSleep(8.0)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                8.0 hrs
              </button>
              <button
                onClick={() => handleSetSleep(8.5)}
                className="flex-1 py-1.5 rounded-lg bg-[#14141c] hover:bg-white hover:text-black border border-[#242432] text-[11px] font-bold text-neutral-300 transition cursor-pointer"
              >
                8.5 hrs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CALIBRATE TARGETS MODAL ================= */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#090C12] border border-[#22293A] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTargetModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white text-black">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  SET PERSONALISED TARGETS
                </h3>
                <p className="text-xs text-neutral-400">
                  Customise step goal, macros, hydration &amp; workout duration
                </p>
              </div>
            </div>

            {userProfile?.weight > 0 && (
              <button
                type="button"
                onClick={handleAutoCalculate}
                className="w-full py-2.5 px-3 rounded-xl bg-[#121622] hover:bg-[#1a2030] border border-[#252F46] text-white text-xs font-mono flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Sparkles className="w-4 h-4 text-white" />
                  Auto-Calculate for {userProfile.name} ({userProfile.weight} {userProfile.weightUnit})
                </span>
                <span className="text-[10px] text-neutral-400">Apply</span>
              </button>
            )}

            <form onSubmit={handleSaveTargets} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-neutral-300 uppercase mb-1 font-bold">
                  Daily Step Goal (Steps)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    max="50000"
                    value={customSteps}
                    onChange={(e) => setCustomSteps(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#232B3E] text-white font-mono font-bold text-sm focus:border-white focus:outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-12">steps</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-300 uppercase mb-1 font-bold">
                  Daily Protein Target (Grams)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="400"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#232B3E] text-white font-mono font-bold text-sm focus:border-white focus:outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-12">grams</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-300 uppercase mb-1 font-bold">
                  Daily Hydration Target (Liters)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    value={customWater}
                    onChange={(e) => setCustomWater(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#232B3E] text-white font-mono font-bold text-sm focus:border-white focus:outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-12">Liters</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-300 uppercase mb-1 font-bold">
                  Nightly Sleep Target (Hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="12"
                    value={customSleep}
                    onChange={(e) => setCustomSleep(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#232B3E] text-white font-mono font-bold text-sm focus:border-white focus:outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-12">hours</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-300 uppercase mb-1 font-bold">
                  Daily Workout Time Goal (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    min="15"
                    max="180"
                    value={customWorkout}
                    onChange={(e) => setCustomWorkout(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#232B3E] text-white font-mono font-bold text-sm focus:border-white focus:outline-none"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-12">mins</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 transition font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Personal Targets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
