import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Clock,
  Flame,
  Activity,
  Trash2,
  Sliders,
  User,
  Plus,
  Minus,
  Edit3,
  Check,
} from 'lucide-react';
import { getMuscleRecoveryState } from '../utils/recoveryEngine';
import { MUSCLE_VECTOR_DATA } from '../data/muscleVectorPaths';
import BatLogo from './BatLogo';

export default function DailyProgressStudio({
  muscleStates,
  dailyWorkoutMinutes,
  streakDays,
  userProfile,
  onOpenProfileModal,
}) {
  // Personalised storage key per member (with automatic migration from global key for member 1)
  const memberId = userProfile?.id || 'default';
  const storageKey = `fitbat_progress_${memberId}`;

  const loadAndSanitizeEntries = () => {
    let raw = localStorage.getItem(storageKey);
    // Migrate existing user photo if stored under legacy key
    if (!raw && (memberId === 'default' || memberId === 'member-1')) {
      raw = localStorage.getItem('fitbat_progress_entries');
    }
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      // 1. Remove any old Unsplash stock demo photos
      const realPhotos = parsed.filter(
        (e) => e.id !== 'entry-1' && e.id !== 'entry-2' && !e.photoUrl?.includes('unsplash')
      );

      // 2. Auto-fix any photo that inherited the old hardcoded "Day 14" or "52 mins" demo values
      const chronological = [...realPhotos].reverse().map((entry, idx) => {
        const properSequentialDay = idx + 1;
        const fixedDay =
          !entry.isCustomEdited && (entry.dayNumber === 14 || entry.dayNumber > realPhotos.length)
            ? properSequentialDay
            : entry.dayNumber || properSequentialDay;

        const fixedDuration =
          !entry.isCustomEdited && entry.workoutDurationMinutes === 52
            ? dailyWorkoutMinutes || 0
            : entry.workoutDurationMinutes ?? 0;

        return {
          ...entry,
          dayNumber: fixedDay,
          workoutDurationMinutes: fixedDuration,
          weightKg: entry.weightKg || userProfile?.weight || 75,
          memberName: entry.memberName || userProfile?.name || 'Member',
        };
      });

      const fixed = chronological.reverse();
      localStorage.setItem(storageKey, JSON.stringify(fixed));
      if (memberId === 'default' || memberId === 'member-1') {
        localStorage.setItem('fitbat_progress_entries', JSON.stringify(fixed));
      }
      return fixed;
    } catch (err) {
      return [];
    }
  };

  const [entries, setEntries] = useState(loadAndSanitizeEntries);
  const [selectedEntryId, setSelectedEntryId] = useState(entries[0]?.id || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [anatomyPerspective, setAnatomyPerspective] = useState('front');
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reload entries whenever active member changes
  useEffect(() => {
    const loaded = loadAndSanitizeEntries();
    setEntries(loaded);
    setSelectedEntryId(loaded[0]?.id || null);
  }, [memberId]);

  const saveEntries = (newEntries) => {
    setEntries(newEntries);
    localStorage.setItem(storageKey, JSON.stringify(newEntries));
    if (memberId === 'default' || memberId === 'member-1') {
      localStorage.setItem('fitbat_progress_entries', JSON.stringify(newEntries));
    }
  };

  const activeRecentlyTrained = Object.keys(muscleStates).filter((key) => {
    const st = getMuscleRecoveryState(muscleStates[key], key);
    return st.colorTier === 'dark_red';
  });

  const displayTargetedMuscles =
    activeRecentlyTrained.length > 0 ? activeRecentlyTrained : ['chest', 'biceps', 'abs'];

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access unavailable. Please use the "Upload Photo" button instead.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg');

    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
    handleCreateEntry(photoDataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        handleCreateEntry(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Create new personalised entry starting cleanly at Day 1, Day 2, etc.
  const handleCreateEntry = (photoUrl) => {
    const nextDayNumber = entries.length + 1;
    const defaultWeight = userProfile?.weight > 0 ? Number(userProfile.weight) : 75;

    const newEntry = {
      id: `entry-${Date.now()}`,
      dayNumber: nextDayNumber,
      date: new Date().toISOString().split('T')[0],
      photoUrl,
      weightKg: defaultWeight,
      weightUnit: userProfile?.weightUnit || 'kg',
      workoutDurationMinutes: dailyWorkoutMinutes || 0,
      targetedMuscles: displayTargetedMuscles,
      notes: `${userProfile?.name ? userProfile.name + "'s" : 'Daily'} Day ${nextDayNumber} check-in.`,
      memberName: userProfile?.name || 'Athlete',
      isCustomEdited: true,
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    setSelectedEntryId(newEntry.id);
  };

  const handleDeleteEntry = (entryId, e) => {
    e?.stopPropagation();
    const filtered = entries.filter((item) => item.id !== entryId);
    // Re-number sequential days cleanly unless custom edited
    const reindexed = [...filtered]
      .reverse()
      .map((item, idx) => ({
        ...item,
        dayNumber: idx + 1,
      }))
      .reverse();

    saveEntries(reindexed);
    if (selectedEntryId === entryId) {
      setSelectedEntryId(reindexed[0]?.id || null);
    }
  };

  // Super easy 1-click update for Day #, Duration, Weight, or Notes
  const handleUpdateSelectedEntry = (changes) => {
    if (!selectedEntry) return;
    const updated = entries.map((item) =>
      item.id === selectedEntry.id
        ? { ...item, ...changes, isCustomEdited: true }
        : item
    );
    saveEntries(updated);
  };

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || entries[0] || null;
  const baselineEntry = entries[entries.length - 1] || entries[0] || null;

  const getAnatomyImage = (view) => {
    if (view === 'front') return '/anatomy-front-base.png';
    if (view === 'side') return '/anatomy-side-base.png';
    return '/anatomy-back-base.png';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Studio Header + Personalised Member Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#0A0A0E] border border-[#1E1E28] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-white text-black flex items-center justify-center shadow-md">
            <BatLogo className="w-7 h-auto text-black" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase font-sans">
                PROGRESS STUDIO
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider">
                {userProfile?.name ? `${userProfile.name}'s Log` : 'Personalised Log'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Next check-in auto-logs as <strong className="text-white">Day {entries.length + 1}</strong> •{' '}
              <strong className="text-white">
                {userProfile?.weight > 0 ? `${userProfile.weight} ${userProfile.weightUnit || 'kg'}` : 'Bodyweight'}
              </strong>{' '}
              • <strong className="text-white">{dailyWorkoutMinutes || 0} mins</strong> workout
            </p>
          </div>
        </div>

        {/* Simple 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={startCamera}
            className="flex-1 md:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-black" />
            <span>Snap Day {entries.length + 1} Photo</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#14141C] hover:bg-[#1E1E2A] border border-[#2C2C3A] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="px-3 py-2.5 rounded-xl bg-[#14141C] hover:bg-[#1E1E2A] border border-[#2C2C3A] text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Switch Member or Edit Personal Metrics"
            >
              <User className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Member</span>
            </button>
          )}

          {entries.length >= 2 && (
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                comparisonMode
                  ? 'bg-white text-black border-white'
                  : 'bg-[#14141C] border-[#2C2C3A] text-neutral-300 hover:text-white'
              }`}
              title="Compare Day 1 vs Current"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Camera Viewport Modal */}
      {isCameraActive && (
        <div className="bg-[#0A0A0E] border-2 border-white rounded-3xl p-5 shadow-2xl relative flex flex-col items-center">
          <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-[#22222A]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border border-white/20 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30" />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/90 border border-white/40 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
              <BatLogo className="w-5 h-auto text-white" />
              <span>LOGGING DAY {entries.length + 1}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-2.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:bg-neutral-200 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-black" /> Save Day {entries.length + 1} Photo
            </button>
            <button
              onClick={() => {
                const stream = videoRef.current?.srcObject;
                if (stream) stream.getTracks().forEach((t) => t.stop());
                setIsCameraActive(false);
              }}
              className="px-4 py-2.5 rounded-full bg-[#181820] text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN COMPOSITE WINDOW ================= */}
      {!comparisonMode ? (
        !selectedEntry ? (
          <div className="bg-[#0A0A0D] border border-[#1A1A22] rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-[#121218] border border-[#262634] flex items-center justify-center shadow-inner">
              <Camera className="w-10 h-10 text-white" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {userProfile?.name ? `${userProfile.name}'s Progress Timeline` : 'Start Your Progress Timeline'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                No photos logged yet for this member. Tap below to take or upload your <strong className="text-white">Day 1</strong> photo. You can easily edit Day #, bodyweight, and workout minutes anytime.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-black" /> Snap Day 1 Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-[#14141C] hover:bg-[#1C1C26] border border-[#282836] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Upload Day 1 Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0A0D] border border-[#1A1A22] rounded-3xl p-5 sm:p-6 shadow-[0_12px_50px_rgba(0,0,0,0.95)] space-y-5">
            {/* EASY 1-CLICK QUICK EDIT BAR FOR SELECTED PHOTO */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#101016] border border-[#222230]">
              <div className="flex flex-wrap items-center gap-4">
                {/* Day Number Quick Adjust */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold mr-1">
                    Day #:
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        dayNumber: Math.max(1, (selectedEntry.dayNumber || 1) - 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white flex items-center justify-center transition cursor-pointer"
                    title="Decrease Day #"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-white text-black font-mono font-black text-xs">
                    Day {selectedEntry.dayNumber}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        dayNumber: (selectedEntry.dayNumber || 1) + 1,
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white flex items-center justify-center transition cursor-pointer"
                    title="Increase Day #"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Workout Minutes Quick Adjust */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold mr-1">
                    Workout:
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        workoutDurationMinutes: Math.max(
                          0,
                          (selectedEntry.workoutDurationMinutes || 0) - 5
                        ),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    -5m
                  </button>
                  <span className="px-2.5 py-1 rounded-lg bg-[#09090D] border border-[#262634] text-white font-mono font-bold text-xs">
                    {selectedEntry.workoutDurationMinutes || 0} mins
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        workoutDurationMinutes: (selectedEntry.workoutDurationMinutes || 0) + 10,
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    +10m
                  </button>
                </div>

                {/* Bodyweight Quick Adjust */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold mr-1">
                    Weight:
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        weightKg: Number(Math.max(30, (selectedEntry.weightKg || 75) - 0.5).toFixed(1)),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 rounded-lg bg-[#09090D] border border-[#262634] text-white font-mono font-bold text-xs">
                    {selectedEntry.weightKg || userProfile?.weight || 75} {selectedEntry.weightUnit || userProfile?.weightUnit || 'kg'}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateSelectedEntry({
                        weightKg: Number(((selectedEntry.weightKg || 75) + 0.5).toFixed(1)),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#1A1A24] hover:bg-white hover:text-black text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Delete Current Photo Button */}
              <button
                onClick={(e) => handleDeleteEntry(selectedEntry.id, e)}
                className="px-3 py-1.5 rounded-xl bg-[#1A1A22] hover:bg-white text-neutral-300 hover:text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT SIDE: Daily Progress Photo (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="relative rounded-2xl overflow-hidden border border-[#202028] bg-[#050508] aspect-[3/4] sm:aspect-[4/5] shadow-2xl group">
                  <img
                    src={selectedEntry.photoUrl}
                    alt="Progress Check-in"
                    className="w-full h-full object-cover"
                  />

                  {/* Overlaid Badges on Photo */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-3.5 py-1.5 rounded-full bg-black/90 backdrop-blur-md border border-white/30 text-xs font-black text-white font-mono tracking-wider flex items-center gap-2 shadow-lg">
                      <BatLogo className="w-5 h-auto text-white" />
                      <span>
                        {userProfile?.name ? `${userProfile.name.toUpperCase()} • ` : ''}DAY {selectedEntry.dayNumber}
                      </span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#121218]/90 text-neutral-300 border border-[#282832] text-[10px] font-bold uppercase tracking-wider font-mono w-fit">
                      {selectedEntry.date}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/90 backdrop-blur-md p-3.5 rounded-xl border border-white/20">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                        Bodyweight
                      </span>
                      <div className="text-sm font-black font-mono text-white">
                        {selectedEntry.weightKg || userProfile?.weight || 75} {selectedEntry.weightUnit || userProfile?.weightUnit || 'kg'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                        Session Duration
                      </span>
                      <div className="text-sm font-black font-mono text-white">
                        {selectedEntry.workoutDurationMinutes || 0} mins
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Workout Duration, Targeted Muscles & Full Body Anatomy (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* Daily Workout Duration Card */}
                <div className="bg-[#0E0E12] border border-[#202028] rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-white" /> Workout Duration
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-white text-black">
                      DAY {selectedEntry.dayNumber}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-white">
                      {selectedEntry.workoutDurationMinutes || 0}
                    </span>
                    <span className="text-sm font-black text-neutral-400 uppercase tracking-wider">
                      Minutes Logged
                    </span>
                  </div>
                </div>

                {/* Targeted Muscle Group Card */}
                <div className="bg-[#0E0E12] border border-[#202028] rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-white" /> Targeted Muscle Groups
                    </span>
                    <span className="text-[10px] font-mono text-neutral-300">
                      Active Split
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedEntry.targetedMuscles || []).map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-lg bg-[#181820] border border-[#2C2C38] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {m.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full Body Anatomy Card */}
                <div className="bg-[#0E0E12] border border-[#202028] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-white" />
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                        Full Body Anatomy
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      Muscle Recovery State
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Trained muscles in <span className="text-red-400 font-bold">Dark Red</span>, recovering in <span className="text-pink-300 font-bold">Pink</span>, rested in <span className="text-white font-bold">White</span>.
                    </p>

                    <div className="flex items-center gap-1.5 mt-3">
                      {['front', 'side', 'back'].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAnatomyPerspective(v)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase cursor-pointer ${
                            anatomyPerspective === v
                              ? 'bg-white text-black'
                              : 'bg-[#181822] text-neutral-400 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Vector Anatomy Display */}
                  <div className="relative w-24 sm:w-28 h-44 bg-[#080B12] rounded-xl border border-[#1C2232] flex items-center justify-center p-1 overflow-hidden shadow-inner flex-shrink-0">
                    <img
                      src={getAnatomyImage(anatomyPerspective)}
                      alt="Full Body Anatomy"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    {(() => {
                      const vector = MUSCLE_VECTOR_DATA[anatomyPerspective] || MUSCLE_VECTOR_DATA.front;
                      return (
                        <svg
                          viewBox={`0 0 ${vector.width} ${vector.height}`}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                        >
                          {vector.muscles.map((m, idx) => {
                            const st = getMuscleRecoveryState(muscleStates[m.key], m.key);
                            const isTrainedOrRecovering =
                              st.colorTier === 'dark_red' ||
                              st.colorTier === 'light_red' ||
                              st.colorTier === 'faint_light_color';
                            const fill =
                              st.colorTier === 'dark_red'
                                ? '#DC2626'
                                : isTrainedOrRecovering
                                ? '#F472B6'
                                : '#FFFFFF';
                            return (
                              <path
                                key={`${m.key}-${idx}`}
                                d={m.path}
                                fill={fill}
                                fillOpacity={isTrainedOrRecovering ? 0.88 : 0.0}
                                stroke="none"
                              />
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* Editable Notes Card */}
                <div className="p-3.5 bg-[#08080A] rounded-2xl border border-[#1A1A22] text-xs text-neutral-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                      Personal Note:
                    </span>
                    {!editingNote ? (
                      <button
                        onClick={() => {
                          setNoteDraft(selectedEntry.notes || '');
                          setEditingNote(true);
                        }}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Note
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleUpdateSelectedEntry({ notes: noteDraft });
                          setEditingNote(false);
                        }}
                        className="text-[10px] bg-white text-black px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    )}
                  </div>
                  {editingNote ? (
                    <input
                      type="text"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#121218] border border-white/40 text-white text-xs focus:outline-none"
                      placeholder="Enter workout or physique note..."
                    />
                  ) : (
                    <p className="text-neutral-300 text-xs italic">
                      "{selectedEntry.notes || 'Physique condition recorded.'}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ================= COMPARISON MODE ================= */
        <div className="bg-[#0A0A0D] border border-[#1A1A22] rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#181822]">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <BatLogo className="w-6 h-auto text-white" /> Physique Transformation Timeline
              </h3>
              <p className="text-xs text-neutral-400">
                Comparing Day {baselineEntry?.dayNumber || 1} Baseline vs Day {selectedEntry?.dayNumber || 1}
              </p>
            </div>
            <button
              onClick={() => setComparisonMode(false)}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white text-black cursor-pointer"
            >
              Back to Single View
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {baselineEntry && (
              <div className="bg-[#0E0E12] border border-[#202028] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-400 uppercase">
                    Day {baselineEntry.dayNumber} (Baseline)
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {baselineEntry.date}
                  </span>
                </div>
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#22222A] relative">
                  <img
                    src={baselineEntry.photoUrl}
                    alt="Baseline"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                    {baselineEntry.weightKg} {baselineEntry.weightUnit || 'kg'}
                  </div>
                </div>
              </div>
            )}

            {selectedEntry && (
              <div className="bg-[#0E0E12] border border-white/40 rounded-2xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase flex items-center gap-2">
                    <BatLogo className="w-5 h-auto text-white" />
                    <span>Day {selectedEntry.dayNumber} (Selected)</span>
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {selectedEntry.date}
                  </span>
                </div>
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/30 relative">
                  <img
                    src={selectedEntry.photoUrl}
                    alt="Current Day"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                    {selectedEntry.weightKg} {selectedEntry.weightUnit || 'kg'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Carousel Row */}
      <div className="bg-[#0A0A0D] border border-[#1A1A22] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
            {userProfile?.name ? `${userProfile.name}'s` : 'Member'} Timeline ({entries.length}{' '}
            {entries.length === 1 ? 'Photo' : 'Photos'})
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {entries.length > 0
              ? 'Tap any photo to view or edit Day # and workout minutes'
              : 'Starts at Day 1'}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 font-mono border border-dashed border-[#1E1E28] rounded-xl">
            Zero photos logged. Your first photo will automatically start at Day 1.
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                className={`flex-shrink-0 w-28 p-2 rounded-xl border cursor-pointer transition select-none group relative ${
                  selectedEntry?.id === entry.id
                    ? 'bg-white/10 border-white shadow-md'
                    : 'bg-[#0E0E12] border-[#202028] hover:border-[#383844]'
                }`}
              >
                {/* Quick Delete X on thumbnail */}
                <button
                  onClick={(e) => handleDeleteEntry(entry.id, e)}
                  className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-black/80 hover:bg-white text-neutral-300 hover:text-black flex items-center justify-center opacity-80 group-hover:opacity-100 transition"
                  title="Delete photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="w-full aspect-square rounded-lg overflow-hidden bg-black mb-1.5 border border-[#1F1F26]">
                  <img
                    src={entry.photoUrl}
                    alt={`Day ${entry.dayNumber}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-white">Day {entry.dayNumber}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {entry.workoutDurationMinutes || 0} mins
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
