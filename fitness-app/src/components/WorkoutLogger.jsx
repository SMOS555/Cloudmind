import React, { useState, useEffect } from 'react';
import { EXERCISE_DATABASE, WORKOUT_TEMPLATES } from '../data/exerciseDatabase';
import { playSetCompleteSound, playWorkoutCompleteSound } from '../utils/audio';
import RestTimer from './RestTimer';
import BatLogo from './BatLogo';
import {
  Plus,
  Trash2,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Award,
  Clock,
  Dumbbell,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function WorkoutLogger({ onCompleteWorkout, onSelectTargetMuscles }) {
  const [workoutTitle, setWorkoutTitle] = useState('Push Day: Chest & Shoulders');
  const [split, setSplit] = useState('Push');
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [unit, setUnit] = useState('kg'); // 'kg' or 'lbs'
  const [notes, setNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active workout exercises state
  const [exercises, setExercises] = useState([
    {
      id: 'ex-1',
      exerciseId: 'bench_press',
      name: 'Barbell Flat Bench Press',
      primaryMuscle: 'chest',
      secondaryMuscles: ['triceps', 'deltoids_front'],
      sets: [
        { id: 's1', weight: 80, reps: 10, rpe: 8, completed: true, type: 'Normal' },
        { id: 's2', weight: 85, reps: 8, rpe: 8.5, completed: true, type: 'Normal' },
        { id: 's3', weight: 90, reps: 6, rpe: 9, completed: false, type: 'Normal' },
      ],
    },
    {
      id: 'ex-2',
      exerciseId: 'incline_db_press',
      name: 'Incline Dumbbell Press',
      primaryMuscle: 'chest',
      secondaryMuscles: ['deltoids_front', 'triceps'],
      sets: [
        { id: 's4', weight: 32, reps: 10, rpe: 8, completed: false, type: 'Normal' },
        { id: 's5', weight: 34, reps: 8, rpe: 8.5, completed: false, type: 'Normal' },
      ],
    },
    {
      id: 'ex-3',
      exerciseId: 'tricep_rope_pushdown',
      name: 'Cable Tricep Rope Pushdown',
      primaryMuscle: 'triceps',
      secondaryMuscles: [],
      sets: [
        { id: 's6', weight: 25, reps: 12, rpe: 8, completed: false, type: 'Normal' },
        { id: 's7', weight: 27.5, reps: 10, rpe: 9, completed: false, type: 'Drop Set' },
      ],
    },
  ]);

  // Session timer tick
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Derive all targeted muscles from current exercises
  const targetedMuscles = Array.from(
    new Set(
      exercises.flatMap((ex) => [ex.primaryMuscle, ...(ex.secondaryMuscles || [])])
    )
  );

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle set completion
  const handleToggleSet = (exIndex, setIndex) => {
    const updated = [...exercises];
    const targetSet = updated[exIndex].sets[setIndex];
    targetSet.completed = !targetSet.completed;

    if (targetSet.completed) {
      playSetCompleteSound();
    }
    setExercises(updated);
  };

  // Update set value
  const handleUpdateSetValue = (exIndex, setIndex, field, value) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  // Add set to exercise
  const handleAddSet = (exIndex) => {
    const updated = [...exercises];
    const ex = updated[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet = {
      id: `s-${Date.now()}-${Math.random()}`,
      weight: lastSet ? lastSet.weight : 50,
      reps: lastSet ? lastSet.reps : 10,
      rpe: 8,
      completed: false,
      type: 'Normal',
    };
    ex.sets.push(newSet);
    setExercises(updated);
  };

  // Remove set
  const handleRemoveSet = (exIndex, setIndex) => {
    const updated = [...exercises];
    updated[exIndex].sets.splice(setIndex, 1);
    setExercises(updated);
  };

  // Remove exercise
  const handleRemoveExercise = (exIndex) => {
    const updated = [...exercises];
    updated.splice(exIndex, 1);
    setExercises(updated);
  };

  // Add exercise from DB
  const handleAddExerciseFromDb = (dbExercise) => {
    const newEx = {
      id: `ex-${Date.now()}`,
      exerciseId: dbExercise.id,
      name: dbExercise.name,
      primaryMuscle: dbExercise.primaryMuscle,
      secondaryMuscles: dbExercise.secondaryMuscles || [],
      sets: [
        {
          id: `s-${Date.now()}-1`,
          weight: dbExercise.defaultWeight,
          reps: dbExercise.defaultReps,
          rpe: 8,
          completed: false,
          type: 'Normal',
        },
        {
          id: `s-${Date.now()}-2`,
          weight: dbExercise.defaultWeight,
          reps: dbExercise.defaultReps,
          rpe: 8.5,
          completed: false,
          type: 'Normal',
        },
      ],
    };
    setExercises([...exercises, newEx]);
    setShowAddModal(false);
  };

  // Load a template
  const handleLoadTemplate = (template) => {
    setWorkoutTitle(template.name);
    setSplit(template.targetSplit);

    const mapped = template.exercises.map((item, idx) => {
      const dbEx = EXERCISE_DATABASE.find((e) => e.id === item.exerciseId) || {
        name: 'Custom Exercise',
        primaryMuscle: 'chest',
        secondaryMuscles: [],
      };
      const setsArr = [];
      for (let s = 1; s <= item.sets; s++) {
        setsArr.push({
          id: `s-${idx}-${s}`,
          weight: item.weight,
          reps: item.reps,
          rpe: 8,
          completed: false,
          type: 'Normal',
        });
      }
      return {
        id: `tpl-ex-${idx}`,
        exerciseId: item.exerciseId,
        name: dbEx.name,
        primaryMuscle: dbEx.primaryMuscle,
        secondaryMuscles: dbEx.secondaryMuscles || [],
        sets: setsArr,
      };
    });

    setExercises(mapped);
  };

  // Calculate volume
  const totalVolume = exercises.reduce((acc, ex) => {
    const exVol = ex.sets.reduce((sAcc, s) => {
      return sAcc + (s.completed ? Number(s.weight || 0) * Number(s.reps || 0) : 0);
    }, 0);
    return acc + exVol;
  }, 0);

  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  // Complete workout
  const handleFinish = () => {
    playWorkoutCompleteSound();

    const loggedDurationMinutes = Math.max(1, Math.round(sessionSeconds / 60));

    const workoutRecord = {
      id: `wo-${Date.now()}`,
      title: workoutTitle,
      split,
      date: new Date().toISOString(),
      durationMinutes: loggedDurationMinutes,
      volumeKg: Math.round(totalVolume),
      rpeAvg: 8.5,
      targetedMuscles,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s, idx) => ({
          setNum: idx + 1,
          weight: Number(s.weight),
          reps: Number(s.reps),
          rpe: Number(s.rpe),
          completed: s.completed,
        })),
      })),
      notes: notes || 'High intensity session completed. Maximum recruitment achieved.',
    };

    onCompleteWorkout(workoutRecord, targetedMuscles, loggedDurationMinutes);
  };

  return (
    <div className="space-y-6">
      {/* Active Session Header Banner - Batcave Black & White Style */}
      <div className="bg-[#0A0A0E] border border-[#202028] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Bat Watermark in Background */}
        <div className="absolute right-4 -top-6 opacity-5 pointer-events-none">
          <BatLogo className="w-96 h-auto text-white" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <BatLogo className="w-5 h-auto text-white" />
              <span className="text-xs font-black uppercase tracking-widest text-white">
                BAT-TACTICAL WORKOUT RECORDER
              </span>
              <span className="text-xs text-neutral-500">|</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#16161E] text-white border border-[#262632]">
                SPLIT: {split}
              </span>
            </div>
            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="text-xl sm:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-[#333344] focus:border-white focus:outline-none transition w-full"
            />
          </div>

          {/* Session Timer & Finish Button */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Live Stopwatch */}
            <div className="flex items-center gap-2 bg-[#121218] border border-[#22222A] px-4 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-xl font-black font-mono text-white tracking-wider">
                {formatTimer(sessionSeconds)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Finish Workout Button - Bat Style */}
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <BatLogo className="w-5 h-auto text-black" />
              <span>Finish &amp; Log Protocol</span>
            </button>
          </div>
        </div>

        {/* Targeted Muscle Badges */}
        <div className="mt-4 pt-4 border-t border-[#1f1f2c] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <BatLogo className="w-3.5 h-auto text-white" /> Targeted Muscle Groups:
          </span>
          {targetedMuscles.map((m) => (
            <span
              key={m}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#14141d] border border-[#272738] text-white uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {m.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: Rest Timer & Quick Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rest Timer Widget */}
        <div className="md:col-span-1">
          <RestTimer />
        </div>

        {/* Load Pro Routine Templates */}
        <div className="md:col-span-2 bg-[#0d0d12] border border-[#222230] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white" /> Quick Split Templates
            </span>
            <span className="text-[11px] text-neutral-500">1-Click Auto-Load</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WORKOUT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleLoadTemplate(tpl)}
                className="p-2.5 rounded-xl bg-[#14141d] border border-[#242434] hover:border-white hover:bg-[#1b1b28] transition text-left group cursor-pointer"
              >
                <div className="text-xs font-bold text-white group-hover:text-white truncate">
                  {tpl.targetSplit} Day
                </div>
                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                  {tpl.exercises.length} Exercises
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-white" /> Exercises &amp; Sets
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181824] text-neutral-400 border border-[#2b2b3b]">
              {completedSetsCount} / {totalSetsCount} Sets Completed
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 border border-white text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" /> Add Exercise
          </button>
        </div>

        {/* Exercises Cards */}
        {exercises.map((ex, exIdx) => (
          <div
            key={ex.id}
            className="bg-[#0c0c11] border border-[#20202e] rounded-2xl p-4 shadow-xl transition hover:border-[#2f2f45]"
          >
            {/* Exercise Title Row */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1b1b26]">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-white text-black border border-white text-xs font-black flex items-center justify-center font-mono shadow-md">
                  {exIdx + 1}
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    {ex.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="text-white uppercase font-bold tracking-wider">
                      {ex.primaryMuscle}
                    </span>
                    {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                      <span>+ {ex.secondaryMuscles.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveExercise(exIdx)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                title="Remove Exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider pb-2 px-1">
              <div className="col-span-1 text-center">Set</div>
              <div className="col-span-3 text-center">Type</div>
              <div className="col-span-3 text-center">Weight ({unit})</div>
              <div className="col-span-2 text-center">Reps</div>
              <div className="col-span-1 text-center">RPE</div>
              <div className="col-span-2 text-center">Done</div>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
              {ex.sets.map((set, setIdx) => (
                <div
                  key={set.id}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                    set.completed
                      ? 'bg-white/10 border border-white/40 shadow-inner'
                      : 'bg-[#14141d] border border-[#232332]'
                  }`}
                >
                  <div className="col-span-1 text-center font-mono font-bold text-xs text-neutral-400">
                    {setIdx + 1}
                  </div>

                  <div className="col-span-3">
                    <select
                      value={set.type}
                      onChange={(e) =>
                        handleUpdateSetValue(exIdx, setIdx, 'type', e.target.value)
                      }
                      className="w-full bg-[#0a0a0f] border border-[#232330] rounded-lg px-2 py-1 text-xs text-neutral-300 focus:outline-none"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Warmup">Warmup</option>
                      <option value="Drop Set">Drop Set</option>
                      <option value="Failure">Failure</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        handleUpdateSetValue(exIdx, setIdx, 'weight', e.target.value)
                      }
                      className="w-full bg-[#0a0a0f] border border-[#232330] rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center focus:border-white focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        handleUpdateSetValue(exIdx, setIdx, 'reps', e.target.value)
                      }
                      className="w-full bg-[#0a0a0f] border border-[#232330] rounded-lg px-2 py-1 text-xs font-mono font-bold text-white text-center focus:border-white focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.5"
                      min="6"
                      max="10"
                      value={set.rpe}
                      onChange={(e) =>
                        handleUpdateSetValue(exIdx, setIdx, 'rpe', e.target.value)
                      }
                      className="w-full bg-[#0a0a0f] border border-[#232330] rounded-lg px-1 py-1 text-xs font-mono text-neutral-300 text-center focus:border-white focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleToggleSet(exIdx, setIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        set.completed
                          ? 'bg-white text-black shadow-lg shadow-white/20 font-black'
                          : 'bg-[#1b1b26] text-neutral-500 hover:text-white hover:border-white border border-[#2c2c3e]'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${set.completed ? 'stroke-[2.5]' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleRemoveSet(exIdx, setIdx)}
                      className="p-1 text-neutral-500 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Set Button */}
            <button
              onClick={() => handleAddSet(exIdx)}
              className="w-full mt-3 py-2 rounded-xl border border-dashed border-[#2b2b3d] hover:border-white hover:bg-white/5 text-neutral-400 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" /> Add Set
            </button>
          </div>
        ))}
      </div>

      {/* Workout Summary Bar */}
      <div className="bg-[#0e0e13] border border-[#20202d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
              Total Volume
            </div>
            <div className="text-xl font-black font-mono text-white">
              {totalVolume.toLocaleString()} {unit}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
              Logged Time
            </div>
            <div className="text-xl font-black font-mono text-white">
              {Math.max(1, Math.round(sessionSeconds / 60))} Mins
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Workout notes (pump, energy, PRs achieved)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#14141d] border border-[#272738] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          />
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e0e14] border border-[#2b2b3d] rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f1f2e]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-white" /> Select Exercise To Add
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by exercise name or muscle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mt-3 bg-[#151520] border border-[#262638] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />

            <div className="max-h-72 overflow-y-auto space-y-2 mt-3 pr-1">
              {EXERCISE_DATABASE.filter(
                (ex) =>
                  ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ex.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ex.primaryMuscle.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((dbEx) => (
                <div
                  key={dbEx.id}
                  onClick={() => handleAddExerciseFromDb(dbEx)}
                  className="p-3 rounded-xl bg-[#14141d] border border-[#222232] hover:border-white hover:bg-[#1a1a26] cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-white">
                      {dbEx.name}
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className="text-neutral-300 font-medium uppercase text-[10px] font-mono">{dbEx.category}</span>
                      <span>•</span>
                      <span>Target: {dbEx.primaryMuscle}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white font-mono">
                    + Add
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
