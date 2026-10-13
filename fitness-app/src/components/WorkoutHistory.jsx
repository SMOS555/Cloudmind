import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Award,
  Flame,
  CheckCircle,
  Shield,
  Layers,
} from 'lucide-react';
import BatLogo from './BatLogo';

export default function WorkoutHistory({ workoutHistory }) {
  const [expandedId, setExpandedId] = useState(workoutHistory[0]?.id || null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Bat Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202028] gap-3">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1.5 rounded-xl bg-white flex items-center justify-center text-black shadow-lg flex-shrink-0">
            <BatLogo className="w-7 h-auto text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              FITBAT • WORKOUT ARCHIVES
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Bat Tactical Database: Complete audit log of sets, tonnage, and targeted muscle stimulus
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white text-black">
            {workoutHistory.length} Sessions Logged
          </span>
        </div>
      </div>

      {workoutHistory.length === 0 ? (
        <div className="p-12 text-center bg-[#08080c] border border-[#1e1e26] rounded-2xl">
          <BatLogo className="w-20 h-auto text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider">
            No logged workouts in Tactical Archives yet.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Finish a training session in the Workout Logger to archive it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workoutHistory.map((workout) => {
            const isExpanded = expandedId === workout.id;
            return (
              <div
                key={workout.id}
                className="bg-[#09090d] border border-[#1e1e28] rounded-2xl overflow-hidden shadow-xl transition hover:border-white/50"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#14141c] border border-white/20 text-white flex items-center justify-center font-bold flex-shrink-0">
                      <BatLogo className="w-6 h-auto text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white">
                          {workout.title}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white text-black">
                          {workout.split}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-white">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          {workout.durationMinutes} mins
                        </span>
                        <span>•</span>
                        <span className="font-mono">{formatDate(workout.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                        Tonnage Volume
                      </div>
                      <div className="text-sm font-mono font-black text-white">
                        {workout.volumeKg.toLocaleString()} kg
                      </div>
                    </div>
                    <div className="text-neutral-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#181822] bg-[#050508] space-y-3">
                    {/* Targeted Muscle Pills */}
                    {workout.targetedMuscles && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mr-1">
                          Muscles Blasted:
                        </span>
                        {workout.targetedMuscles.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] font-black bg-[#161622] border border-[#2B2B3C] text-white uppercase tracking-wider"
                          >
                            {m.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Exercises Table */}
                    <div className="space-y-2 mt-2">
                      {workout.exercises.map((ex, exI) => (
                        <div
                          key={exI}
                          className="p-3 rounded-xl bg-[#0e0e14] border border-[#20202a]"
                        >
                          <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <BatLogo className="w-4 h-auto text-white/70" />
                              {ex.name}
                            </span>
                            <span className="text-neutral-400 text-[11px] font-mono font-bold">
                              {ex.sets.length} Sets
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {ex.sets.map((s, sI) => (
                              <div
                                key={sI}
                                className="px-2 py-1 rounded bg-[#050508] border border-[#181820] text-[11px] font-mono text-neutral-300 flex items-center justify-between"
                              >
                                <span>Set {s.setNum}:</span>
                                <span className="font-bold text-white">
                                  {s.weight}kg × {s.reps}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {workout.notes && (
                      <div className="p-3 rounded-xl bg-[#101018] border border-[#242432] text-xs text-neutral-300">
                        <span className="font-black text-white uppercase tracking-wider mr-1">
                          Tactical Debrief:
                        </span>
                        {workout.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
