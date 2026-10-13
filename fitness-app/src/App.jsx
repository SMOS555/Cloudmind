import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BodyAnatomy from './components/BodyAnatomy';
import MuscleDetailModal from './components/MuscleDetailModal';
import WorkoutLogger from './components/WorkoutLogger';
import AICoach from './components/AICoach';
import DailyRoutineTracker from './components/DailyRoutineTracker';
import WorkoutHistory from './components/WorkoutHistory';
import QuickSplitSimulator from './components/QuickSplitSimulator';
import DailyProgressStudio from './components/DailyProgressStudio';
import StepCounterPage from './components/StepCounterPage';
import BatLogo from './components/BatLogo';
import LoginProfileModal from './components/LoginProfileModal';
import { isPrimaryGoogleFitSAccount } from './services/googleFitService';
import {
  INITIAL_MUSCLE_STATES,
  INITIAL_WORKOUT_HISTORY,
  INITIAL_DAILY_ROUTINE,
} from './data/defaultState';
import {
  getMuscleRecoveryState,
  calculateOverallReadiness,
  MUSCLE_METADATA,
} from './utils/recoveryEngine';
import {
  Flame,
  Activity,
  Dumbbell,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Footprints,
} from 'lucide-react';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState('anatomy');

  // Helper to build personalised routine targets from member biometrics
  const buildPersonalisedRoutine = (profile, baseRoutine = INITIAL_DAILY_ROUTINE) => {
    if (!profile || !profile.weight || profile.weight <= 0) return baseRoutine;
    const weightKg =
      profile.weightUnit === 'lbs' ? profile.weight * 0.453592 : Number(profile.weight);
    const proteinGoal = Math.round(weightKg * 2.2);
    const waterGoal = Number((weightKg * 0.045).toFixed(1));
    const workoutGoal =
      profile.level === 'advanced' ? 75 : profile.level === 'beginner' ? 45 : 60;
    const stepGoal =
      profile.goal === 'shred' || profile.goal === 'endurance'
        ? 12000
        : profile.goal === 'strength'
          ? 8000
          : 10000;
    return {
      ...baseRoutine,
      proteinGoalGrams: proteinGoal,
      waterGoalLiters: waterGoal,
      dailyWorkoutGoalMinutes: workoutGoal,
      stepGoal,
    };
  };

  // Multi-Member List
  const [members, setMembers] = useState(() => {
    const savedList = localStorage.getItem('fitbat_members_list');
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const legacy = localStorage.getItem('fitbat_user_profile');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed && parsed.name) {
          const withId = { ...parsed, id: parsed.id || 'member-1' };
          localStorage.setItem('fitbat_members_list', JSON.stringify([withId]));
          localStorage.setItem('fitbat_user_profile', JSON.stringify(withId));
          return [withId];
        }
      } catch (e) {}
    }
    return [];
  });

  // Active Member Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('fitbat_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          return { ...parsed, id: parsed.id || 'member-1' };
        }
      } catch (e) {}
    }
    return null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedFlag = localStorage.getItem('fitbat_is_logged_in');
    const savedProfile = localStorage.getItem('fitbat_user_profile');
    if (savedFlag === 'false') return false;
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return Boolean(parsed && parsed.email);
      } catch (e) {}
    }
    return false;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadMemberData = (memberId, type, fallbackVal) => {
    const id = memberId || 'member-1';
    const key = `fitbat_${type}_${id}`;
    let raw = localStorage.getItem(key);
    if (!raw && id === 'member-1') {
      if (type === 'muscles') raw = localStorage.getItem('fitbat_muscle_states');
      if (type === 'history') raw = localStorage.getItem('fitbat_workout_history');
      if (type === 'routine') raw = localStorage.getItem('fitbat_daily_routine');
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Clean any leftover demo values (streakDays: 14 or workoutMinutesToday: 52)
        if (type === 'routine') {
          let modified = false;
          const updatedRoutine = { ...parsed };
          if (updatedRoutine.streakDays === 14 || updatedRoutine.workoutMinutesToday === 52) {
            updatedRoutine.streakDays = 0;
            updatedRoutine.workoutMinutesToday = 0;
            modified = true;
          }
          // Check member's email/profile to sync 2,302 steps for the primary 'S' Google Fit account (kingsmos0510@gmail.com)
          // and keep other accounts at their own independent step count
          const memberObj = members.find((m) => m.id === id) || userProfile;
          const isPrimaryS = isPrimaryGoogleFitSAccount(memberObj?.email, memberObj);
          if (isPrimaryS && (updatedRoutine.stepsToday || 0) < 2302) {
            updatedRoutine.stepsToday = 2302;
            modified = true;
          } else if (!isPrimaryS && updatedRoutine.stepsToday === 2302) {
            updatedRoutine.stepsToday = 0;
            modified = true;
          }
          if (modified) {
            localStorage.setItem(key, JSON.stringify(updatedRoutine));
            if (id === 'member-1') {
              localStorage.setItem('fitbat_daily_routine', JSON.stringify(updatedRoutine));
            }
          }
          return updatedRoutine;
        }
        // Clean any leftover demo workout history entries (wk-1, wk-2, wk-3)
        if (type === 'history' && Array.isArray(parsed)) {
          const hasDemo = parsed.some((w) => ['wk-1', 'wk-2', 'wk-3'].includes(w.id));
          if (hasDemo) {
            const realOnly = parsed.filter((w) => !['wk-1', 'wk-2', 'wk-3'].includes(w.id));
            localStorage.setItem(key, JSON.stringify(realOnly));
            if (id === 'member-1') {
              localStorage.setItem('fitbat_workout_history', JSON.stringify(realOnly));
            }
            return realOnly;
          }
        }
        // Clean any leftover demo muscle states from old initial seed
        if (type === 'muscles' && parsed && typeof parsed === 'object') {
          const hasDemoMuscles = Object.values(parsed).some(
            (m) =>
              m?.sessionName &&
              (m.sessionName.includes('Gotham') ||
                m.sessionName.includes('Dark Knight') ||
                m.sessionName.includes('Heavy Push'))
          );
          if (hasDemoMuscles) {
            localStorage.setItem(key, JSON.stringify(INITIAL_MUSCLE_STATES));
            if (id === 'member-1') {
              localStorage.setItem('fitbat_muscle_states', JSON.stringify(INITIAL_MUSCLE_STATES));
            }
            return INITIAL_MUSCLE_STATES;
          }
        }
        return parsed;
      } catch (e) {}
    }
    return fallbackVal;
  };

  const activeMemberId = userProfile?.id || 'member-1';

  // Muscle states per member
  const [muscleStates, setMuscleStates] = useState(() =>
    loadMemberData(activeMemberId, 'muscles', INITIAL_MUSCLE_STATES)
  );

  // Workout History per member
  const [workoutHistory, setWorkoutHistory] = useState(() =>
    loadMemberData(activeMemberId, 'history', INITIAL_WORKOUT_HISTORY)
  );

  // Daily Routine per member
  const [dailyRoutine, setDailyRoutine] = useState(() =>
    loadMemberData(
      activeMemberId,
      'routine',
      buildPersonalisedRoutine(userProfile, INITIAL_DAILY_ROUTINE)
    )
  );

  // Selected muscle for detail modal
  const [selectedMuscleKey, setSelectedMuscleKey] = useState(null);

  // Mobile frame wrapper toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  // Sync active member data to local storage only when a member is logged in
  useEffect(() => {
    if (!userProfile?.id || !isLoggedIn) return;
    localStorage.setItem(`fitbat_muscles_${userProfile.id}`, JSON.stringify(muscleStates));
    if (userProfile.id === 'member-1') {
      localStorage.setItem('fitbat_muscle_states', JSON.stringify(muscleStates));
    }
  }, [muscleStates, userProfile?.id, isLoggedIn]);

  useEffect(() => {
    if (!userProfile?.id || !isLoggedIn) return;
    localStorage.setItem(`fitbat_history_${userProfile.id}`, JSON.stringify(workoutHistory));
    if (userProfile.id === 'member-1') {
      localStorage.setItem('fitbat_workout_history', JSON.stringify(workoutHistory));
    }
  }, [workoutHistory, userProfile?.id, isLoggedIn]);

  useEffect(() => {
    if (!userProfile?.id || !isLoggedIn) return;
    localStorage.setItem(`fitbat_routine_${userProfile.id}`, JSON.stringify(dailyRoutine));
    if (userProfile.id === 'member-1') {
      localStorage.setItem('fitbat_daily_routine', JSON.stringify(dailyRoutine));
    }
  }, [dailyRoutine, userProfile?.id, isLoggedIn]);

  useEffect(() => {
    if (userProfile && isLoggedIn) {
      localStorage.setItem('fitbat_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile, isLoggedIn]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch between members in 1 click
  const handleSelectMember = (memberId) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    setUserProfile(target);
    localStorage.setItem('fitbat_user_profile', JSON.stringify(target));
    if (target.email) {
      setIsLoggedIn(true);
      localStorage.setItem('fitbat_is_logged_in', 'true');
      setShowProfileModal(false);
    }
    setMuscleStates(loadMemberData(target.id, 'muscles', INITIAL_MUSCLE_STATES));
    setWorkoutHistory(loadMemberData(target.id, 'history', INITIAL_WORKOUT_HISTORY));
    setDailyRoutine(
      loadMemberData(
        target.id,
        'routine',
        buildPersonalisedRoutine(target, INITIAL_DAILY_ROUTINE)
      )
    );
    showToast(`Logged in as: ${target.email || target.name}`);
  };

  // Save or create member with personalised targets + Google Fit steps
  const handleSaveProfile = (newProfile, isNewMember = false, initialGoogleFitSteps = null) => {
    const memberWithId = {
      ...newProfile,
      id: newProfile.id || `member-${Date.now()}`,
    };

    const updatedMembers = isNewMember
      ? [...members, memberWithId]
      : members.some((m) => m.id === memberWithId.id)
      ? members.map((m) => (m.id === memberWithId.id ? memberWithId : m))
      : [...members, memberWithId];

    setMembers(updatedMembers);
    localStorage.setItem('fitbat_members_list', JSON.stringify(updatedMembers));
    setUserProfile(memberWithId);
    localStorage.setItem('fitbat_user_profile', JSON.stringify(memberWithId));
    setIsLoggedIn(true);
    localStorage.setItem('fitbat_is_logged_in', 'true');
    setShowProfileModal(false);

    if (isNewMember) {
      const freshRoutine = buildPersonalisedRoutine(memberWithId, {
        ...INITIAL_DAILY_ROUTINE,
        stepsToday:
          typeof initialGoogleFitSteps === 'number' && initialGoogleFitSteps > 0
            ? initialGoogleFitSteps
            : 0,
        lastStepSyncSource: memberWithId.email
          ? `Google Fit (${memberWithId.email})`
          : 'Google Fit Sync',
      });
      setMuscleStates(INITIAL_MUSCLE_STATES);
      setWorkoutHistory([]);
      setDailyRoutine(freshRoutine);
      localStorage.setItem(
        `fitbat_muscles_${memberWithId.id}`,
        JSON.stringify(INITIAL_MUSCLE_STATES)
      );
      localStorage.setItem(`fitbat_history_${memberWithId.id}`, JSON.stringify([]));
      localStorage.setItem(`fitbat_routine_${memberWithId.id}`, JSON.stringify(freshRoutine));
      localStorage.setItem(`fitbat_progress_${memberWithId.id}`, JSON.stringify([]));
      showToast(
        `Logged in: ${memberWithId.email || memberWithId.name} • Google Fit Synced`
      );
    } else {
      const savedMuscles = loadMemberData(memberWithId.id, 'muscles', INITIAL_MUSCLE_STATES);
      const savedHistory = loadMemberData(memberWithId.id, 'history', INITIAL_WORKOUT_HISTORY);
      const savedRoutine = loadMemberData(
        memberWithId.id,
        'routine',
        buildPersonalisedRoutine(memberWithId, INITIAL_DAILY_ROUTINE)
      );
      const updatedRoutine = buildPersonalisedRoutine(memberWithId, savedRoutine);
      if (typeof initialGoogleFitSteps === 'number' && initialGoogleFitSteps >= 0) {
        updatedRoutine.stepsToday = initialGoogleFitSteps;
        updatedRoutine.lastStepSyncSource = memberWithId.email
          ? `Google Fit (${memberWithId.email})`
          : 'Google Fit Sync';
      }
      setMuscleStates(savedMuscles);
      setWorkoutHistory(savedHistory);
      setDailyRoutine(updatedRoutine);
      localStorage.setItem(
        `fitbat_muscles_${memberWithId.id}`,
        JSON.stringify(savedMuscles)
      );
      localStorage.setItem(
        `fitbat_history_${memberWithId.id}`,
        JSON.stringify(savedHistory)
      );
      localStorage.setItem(
        `fitbat_routine_${memberWithId.id}`,
        JSON.stringify(updatedRoutine)
      );
      showToast(
        `Logged in: ${memberWithId.email || memberWithId.name} • Google Fit Synced`
      );
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('fitbat_is_logged_in', 'false');
    setUserProfile(null);
    localStorage.removeItem('fitbat_user_profile');
    setShowProfileModal(false);
    showToast('Logged out successfully.');
  };

  const handleDeleteMember = (memberId) => {
    const remaining = members.filter((m) => m.id !== memberId);
    localStorage.removeItem(`fitbat_muscles_${memberId}`);
    localStorage.removeItem(`fitbat_history_${memberId}`);
    localStorage.removeItem(`fitbat_routine_${memberId}`);
    localStorage.removeItem(`fitbat_progress_${memberId}`);
    setMembers(remaining);
    localStorage.setItem('fitbat_members_list', JSON.stringify(remaining));
    if (remaining.length > 0) {
      handleSelectMember(remaining[0].id);
    } else {
      setUserProfile(null);
    }
  };

  const handleResetAllData = () => {
    localStorage.removeItem(`fitbat_muscles_${activeMemberId}`);
    localStorage.removeItem(`fitbat_history_${activeMemberId}`);
    localStorage.removeItem(`fitbat_routine_${activeMemberId}`);
    localStorage.removeItem(`fitbat_progress_${activeMemberId}`);
    if (activeMemberId === 'member-1') {
      localStorage.removeItem('fitbat_muscle_states');
      localStorage.removeItem('fitbat_workout_history');
      localStorage.removeItem('fitbat_daily_routine');
      localStorage.removeItem('fitbat_progress_entries');
    }
    const freshRoutine = buildPersonalisedRoutine(userProfile, INITIAL_DAILY_ROUTINE);
    setMuscleStates(INITIAL_MUSCLE_STATES);
    setWorkoutHistory([]);
    setDailyRoutine(freshRoutine);
    showToast(`Records reset for ${userProfile?.name || 'member'}. Starting fresh at Day 1.`);
  };

  // Callback when a workout is finished in the logger
  const handleCompleteWorkout = (newWorkoutRecord, targetedMuscles, loggedMinutes) => {
    // 1. Update Workout History
    setWorkoutHistory([newWorkoutRecord, ...workoutHistory]);

    // 2. Mark targeted muscles as RECENTLY TRAINED (Dark Red, 0h elapsed)
    const updatedMuscles = { ...muscleStates };
    const nowIso = new Date().toISOString();

    targetedMuscles.forEach((muscleKey) => {
      updatedMuscles[muscleKey] = {
        lastTrainedTime: nowIso,
        sessionName: newWorkoutRecord.title,
        intensity: 'Maximal',
      };
    });
    setMuscleStates(updatedMuscles);

    // 3. Update Daily Workout Time & Routine
    setDailyRoutine((prev) => ({
      ...prev,
      workoutMinutesToday: prev.workoutMinutesToday + loggedMinutes,
      weeklyWorkoutMinutes: prev.weeklyWorkoutMinutes + loggedMinutes,
      checklist: prev.checklist.map((item) =>
        item.id === 'chk-3' ? { ...item, done: true } : item
      ),
    }));

    showToast(`Workout logged! ${targetedMuscles.length} targeted muscle groups are now highlighted in DARK RED.`);
    setActiveTab('anatomy');
  };

  // Update specific muscle's elapsed hours via modal simulation
  const handleUpdateMuscleHours = (muscleKey, hours) => {
    const updated = { ...muscleStates };
    const simulatedDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    updated[muscleKey] = {
      ...(updated[muscleKey] || {}),
      lastTrainedTime: simulatedDate,
    };
    setMuscleStates(updated);
  };

  // Simulator blast splits
  const handleBlastSplit = (splitType) => {
    const updated = { ...muscleStates };
    const nowIso = new Date().toISOString();

    let targeted = [];
    if (splitType === 'push') {
      targeted = ['chest', 'triceps', 'deltoids_front'];
    } else if (splitType === 'pull') {
      targeted = ['lats', 'upper_back', 'biceps', 'deltoids_rear', 'traps'];
    } else if (splitType === 'legs') {
      targeted = ['quads', 'hamstrings', 'glutes', 'calves_back'];
    }

    targeted.forEach((m) => {
      updated[m] = {
        lastTrainedTime: nowIso,
        sessionName: `${splitType.toUpperCase()} Day Blast`,
      };
    });

    setMuscleStates(updated);
    showToast(`${splitType.toUpperCase()} muscles blasted! Now glowing in DARK RED.`);
  };

  // Simulator fast forward elapsed time
  const handleFastForward = (hoursToAdd) => {
    const updated = { ...muscleStates };
    Object.keys(updated).forEach((key) => {
      if (updated[key]?.lastTrainedTime) {
        const prevTime = new Date(updated[key].lastTrainedTime).getTime();
        updated[key].lastTrainedTime = new Date(
          prevTime - hoursToAdd * 60 * 60 * 1000
        ).toISOString();
      }
    });
    setMuscleStates(updated);
    showToast(`Time simulated forward by +${hoursToAdd} hours. Check the Light Color recovery transition!`);
  };

  const handleResetDemo = () => {
    setMuscleStates(INITIAL_MUSCLE_STATES);
    setWorkoutHistory(INITIAL_WORKOUT_HISTORY);
    setDailyRoutine(INITIAL_DAILY_ROUTINE);
    showToast('Reset to demo baseline with balanced Dark Red & Light Color recovery states.');
  };

  // AI load workout callback
  const handleApplySuggestedWorkout = (splitName) => {
    setActiveTab('logger');
    showToast(`AI suggested '${splitName}' loaded into workout recorder!`);
  };

  // AI Auto-Log Parsed Workout
  const handleAutoLogParsedWorkout = (parsedResult) => {
    const newWorkoutRecord = {
      id: `wo-ai-${Date.now()}`,
      title: parsedResult.title,
      split: 'AI Fast-Log',
      date: new Date().toISOString(),
      durationMinutes: 45,
      volumeKg: 8500,
      rpeAvg: 8.5,
      targetedMuscles: parsedResult.targetedMuscles,
      exercises: parsedResult.exercises.map((e) => ({
        name: e.name,
        sets: e.sets.map((s, idx) => ({
          setNum: idx + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          completed: true,
        })),
      })),
      notes: 'Logged automatically via VULCAN AI Natural Language Processor.',
    };

    handleCompleteWorkout(newWorkoutRecord, parsedResult.targetedMuscles, 45);
  };

  // Overall readiness & dynamic status texts for top summary bar
  const overallReadiness = calculateOverallReadiness(muscleStates);

  const fatiguedMuscleNames = Object.entries(muscleStates)
    .filter(([key, data]) => getMuscleRecoveryState(key, data).status === 'FATIGUED')
    .map(([key]) => MUSCLE_METADATA[key]?.name || key);

  const recoveringMuscleNames = Object.entries(muscleStates)
    .filter(([key, data]) => getMuscleRecoveryState(key, data).status === 'RECOVERING')
    .map(([key]) => MUSCLE_METADATA[key]?.name || key);

  const recentBlastLabel =
    fatiguedMuscleNames.length > 0
      ? fatiguedMuscleNames.slice(0, 2).join(' & ') +
        (fatiguedMuscleNames.length > 2 ? ` +${fatiguedMuscleNames.length - 2}` : '')
      : workoutHistory.length > 0
      ? workoutHistory[0].title
      : 'No Workout Logged';

  const recoveringLabel =
    recoveringMuscleNames.length > 0
      ? recoveringMuscleNames.slice(0, 2).join(' & ') +
        (recoveringMuscleNames.length > 2 ? ` +${recoveringMuscleNames.length - 2}` : '')
      : 'All Muscles Fresh';

  // Render main tab view content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'anatomy':
        return (
          <div className="space-y-6">
            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                onClick={() => setActiveTab('logger')}
                className="p-3.5 rounded-2xl bg-[#09090d] border border-[#1e1e28] hover:border-white/40 transition flex items-center gap-3 shadow-lg cursor-pointer"
                title="Log a workout session"
              >
                <div className="w-9 h-9 rounded-xl bg-[#14141c] border border-white/20 flex items-center justify-center text-white flex-shrink-0">
                  <BatLogo className="w-5 h-auto text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">
                    Recent Blast
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    {recentBlastLabel}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#09090d] border border-[#1e1e28] flex items-center gap-3 shadow-lg">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    recoveringMuscleNames.length > 0
                      ? 'bg-pink-950/50 border border-pink-700/60 text-pink-300'
                      : 'bg-[#14141c] border border-white/20 text-white'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">
                    Recovering
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    {recoveringLabel}
                  </div>
                </div>
              </div>

              {/* Daily Step Tracker & Goal Quick Pill -> Opens Dedicated Steps Window */}
              <div
                onClick={() => setActiveTab('steps')}
                className="p-3.5 rounded-2xl bg-[#09090d] border border-[#1e1e28] hover:border-white/50 transition flex items-center justify-between gap-2 shadow-lg cursor-pointer"
                title="Open Dedicated Step Counter Window"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                    <Footprints className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">
                      Steps Today
                    </div>
                    <div className="text-xs font-black font-mono text-white truncate">
                      {(dailyRoutine.stepsToday || 0).toLocaleString()} /{' '}
                      {((dailyRoutine.stepGoal || 10000) / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDailyRoutine((prev) => ({
                      ...prev,
                      stepsToday: (prev.stepsToday || 0) + 1000,
                    }));
                  }}
                  className="px-2 py-1 rounded-lg bg-[#14141c] hover:bg-white hover:text-black text-[10px] font-black text-white border border-white/20 transition cursor-pointer flex-shrink-0"
                  title="Quick +1,000 steps"
                >
                  +1k
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#09090d] border border-[#1e1e28] flex items-center gap-3 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-black" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">
                    Today Workout Time
                  </div>
                  <div className="text-xs font-black font-mono text-white">
                    {dailyRoutine.workoutMinutesToday} Mins Logged
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#09090d] border border-[#1e1e28] flex items-center gap-3 shadow-lg col-span-2 sm:col-span-1">
                <div className="w-9 h-9 rounded-xl bg-[#14141c] border border-white/20 flex items-center justify-center text-white flex-shrink-0">
                  <BatLogo className="w-6 h-auto text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase font-black tracking-wider">
                    Readiness Score
                  </div>
                  <div className="text-xs font-black font-mono text-white">
                    {overallReadiness}% Capacity
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Simulation Toolbar */}
            <QuickSplitSimulator
              onBlastSplit={handleBlastSplit}
              onFastForward={handleFastForward}
              onResetDemo={handleResetDemo}
            />

            {/* Interactive Anatomy Heatmap */}
            <BodyAnatomy
              muscleStates={muscleStates}
              onSelectMuscle={(key) => setSelectedMuscleKey(key)}
              selectedMuscleKey={selectedMuscleKey}
              onResetDemo={handleResetDemo}
            />

            {/* Quick Action to Log, Consult AI, or Open Photo Window */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('progress')}
                className="p-5 rounded-2xl bg-[#08080c] border border-[#1e1e28] hover:border-white transition text-left flex items-center justify-between group shadow-xl cursor-pointer"
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2 mb-1.5">
                    <BatLogo className="w-5 h-auto text-white" /> Progress Studio
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    Track Progress &amp; Anatomy &rarr;
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Capture physique paired with duration &amp; anatomy
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition" />
              </button>

              <button
                onClick={() => setActiveTab('logger')}
                className="p-5 rounded-2xl bg-[#08080c] border border-[#1e1e28] hover:border-white transition text-left flex items-center justify-between group shadow-xl cursor-pointer"
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2 mb-1.5">
                    <Dumbbell className="w-4 h-4 text-white" /> Start Workout Session
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    Open Workout Logger &rarr;
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Targeted muscles turn Dark Red upon completion
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition" />
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className="p-5 rounded-2xl bg-[#08080c] border border-[#1e1e28] hover:border-white transition text-left flex items-center justify-between group shadow-xl cursor-pointer"
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2 mb-1.5">
                    <BatLogo className="w-5 h-auto text-white" /> King Bat AI
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    Consult King Bat AI &rarr;
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Analyzes fatigued vs ready muscle groups
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition" />
              </button>
            </div>
          </div>
        );

      case 'steps':
        return (
          <StepCounterPage
            key={activeMemberId}
            routine={dailyRoutine}
            onUpdateRoutine={(updated) => setDailyRoutine(updated)}
            userProfile={userProfile}
            onOpenLoginModal={() => setShowProfileModal(true)}
          />
        );

      case 'progress':
        return (
          <DailyProgressStudio
            key={activeMemberId}
            muscleStates={muscleStates}
            dailyWorkoutMinutes={dailyRoutine.workoutMinutesToday}
            streakDays={dailyRoutine.streakDays}
            userProfile={userProfile}
            onOpenProfileModal={() => setShowProfileModal(true)}
            currentWorkoutTitle="Today Resistance Training"
          />
        );

      case 'logger':
        return (
          <WorkoutLogger
            onCompleteWorkout={handleCompleteWorkout}
            onSelectTargetMuscles={(muscles) => {
              // Pre-highlight on anatomy if needed
            }}
          />
        );

      case 'ai':
        return (
          <AICoach
            key={activeMemberId}
            muscleStates={muscleStates}
            dailyRoutine={dailyRoutine}
            userProfile={userProfile}
            onApplySuggestedWorkout={handleApplySuggestedWorkout}
            onAutoLogParsedWorkout={handleAutoLogParsedWorkout}
          />
        );

      case 'routine':
        return (
          <DailyRoutineTracker
            key={activeMemberId}
            routine={dailyRoutine}
            onUpdateRoutine={(updated) => setDailyRoutine(updated)}
            userProfile={userProfile}
            onOpenStepsTab={() => setActiveTab('steps')}
          />
        );

      case 'history':
        return <WorkoutHistory workoutHistory={workoutHistory} />;

      default:
        return null;
    }
  };

  // If not logged in, render the Full-Screen Login Page first
  if (!isLoggedIn || !userProfile || !userProfile.email) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center font-sans selection:bg-white selection:text-black batcave-pattern">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[60] max-w-md bg-[#0C0C10] border-2 border-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <div className="px-2 py-1.5 rounded-xl bg-white flex items-center justify-center text-black font-bold flex-shrink-0">
              <BatLogo className="w-6 h-auto text-black" />
            </div>
            <p className="text-xs font-bold text-white leading-snug">{toastMessage}</p>
          </div>
        )}
        <LoginProfileModal
          isOpen={true}
          onClose={() => {}}
          currentProfile={userProfile}
          members={members}
          onSelectMember={handleSelectMember}
          onSaveProfile={handleSaveProfile}
          onDeleteMember={handleDeleteMember}
          onResetAllData={handleResetAllData}
          onLogout={handleLogout}
          initialSteps={dailyRoutine.stepsToday || 0}
          isFirstTime={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-white selection:text-black batcave-pattern">
      {/* Toast Alert - White & Black Bat Style */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#0C0C10] border-2 border-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="px-2 py-1.5 rounded-xl bg-white flex items-center justify-center text-black font-bold flex-shrink-0">
            <BatLogo className="w-6 h-auto text-black" />
          </div>
          <p className="text-xs font-bold text-white leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dailyWorkoutMinutes={dailyRoutine.workoutMinutesToday}
        streakDays={dailyRoutine.streakDays}
        userProfile={userProfile}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-4 sm:px-6">
        {isMobileFrame ? (
          // Mobile Phone Shell Simulator Frame
          <div className="max-w-md mx-auto my-4 bg-[#050508] border-8 border-[#1C1C24] rounded-[48px] shadow-[0_0_60px_rgba(255,255,255,0.15)] overflow-hidden relative">
            {/* Phone Notch / Speaker */}
            <div className="w-32 h-5 bg-[#1C1C24] rounded-b-2xl mx-auto mb-2 flex items-center justify-center">
              <div className="w-10 h-1 bg-[#2C2C38] rounded-full" />
            </div>

            {/* Inner Content with mobile padding */}
            <div className="p-4 max-h-[800px] overflow-y-auto scrollbar-thin">
              {renderTabContent()}
            </div>

            {/* Home indicator bar */}
            <div className="w-28 h-1 bg-neutral-600 rounded-full mx-auto my-3" />
          </div>
        ) : (
          // Desktop Full Cockpit Dashboard
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
        )}
      </main>

      {/* Account Switcher / Profile Modal when already logged in */}
      <LoginProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentProfile={userProfile}
        members={members}
        onSelectMember={handleSelectMember}
        onSaveProfile={handleSaveProfile}
        onDeleteMember={handleDeleteMember}
        onResetAllData={handleResetAllData}
        onLogout={handleLogout}
        initialSteps={dailyRoutine.stepsToday || 0}
        isFirstTime={false}
      />

      {/* Muscle Recovery Inspection Modal */}
      {selectedMuscleKey && (
        <MuscleDetailModal
          muscleKey={selectedMuscleKey}
          muscleData={muscleStates[selectedMuscleKey]}
          onClose={() => setSelectedMuscleKey(null)}
          onUpdateMuscleHours={handleUpdateMuscleHours}
        />
      )}

      {/* Footer - Bat Theme */}
      <footer className="border-t border-[#181820] bg-[#000000] py-4 text-center text-xs text-neutral-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BatLogo className="w-6 h-auto text-white" />
            <span>FITBAT • Tactical Fitness</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            Bat Protocol • Recovery Heatmap Powered
          </span>
        </div>
      </footer>
    </div>
  );
}
