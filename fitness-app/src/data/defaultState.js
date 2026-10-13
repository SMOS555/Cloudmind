// Clean Zero-State for FITBAT - No Fake/Pre-filled Demo Data

export const INITIAL_MUSCLE_STATES = {
  chest: { lastTrainedTime: null, sessionName: null, intensity: null },
  deltoids_front: { lastTrainedTime: null, sessionName: null, intensity: null },
  deltoids_side: { lastTrainedTime: null, sessionName: null, intensity: null },
  deltoids_rear: { lastTrainedTime: null, sessionName: null, intensity: null },
  biceps: { lastTrainedTime: null, sessionName: null, intensity: null },
  triceps: { lastTrainedTime: null, sessionName: null, intensity: null },
  forearms: { lastTrainedTime: null, sessionName: null, intensity: null },
  traps: { lastTrainedTime: null, sessionName: null, intensity: null },
  lats: { lastTrainedTime: null, sessionName: null, intensity: null },
  upper_back: { lastTrainedTime: null, sessionName: null, intensity: null },
  lower_back: { lastTrainedTime: null, sessionName: null, intensity: null },
  abs: { lastTrainedTime: null, sessionName: null, intensity: null },
  obliques: { lastTrainedTime: null, sessionName: null, intensity: null },
  quads: { lastTrainedTime: null, sessionName: null, intensity: null },
  hamstrings: { lastTrainedTime: null, sessionName: null, intensity: null },
  glutes: { lastTrainedTime: null, sessionName: null, intensity: null },
  calves_front: { lastTrainedTime: null, sessionName: null, intensity: null },
  calves_back: { lastTrainedTime: null, sessionName: null, intensity: null },
};

export const INITIAL_WORKOUT_HISTORY = [];

export const INITIAL_DAILY_ROUTINE = {
  date: new Date().toISOString().split('T')[0],
  streakDays: 0,
  workoutMinutesToday: 0,
  dailyWorkoutGoalMinutes: 60,
  weeklyWorkoutMinutes: 0,
  weeklyGoalMinutes: 300,
  stepsToday: 0,
  stepGoal: 10000,
  waterLiters: 0,
  waterGoalLiters: 3.5,
  sleepHours: 0,
  sleepGoalHours: 8.0,
  proteinGrams: 0,
  proteinGoalGrams: 160,
  checklist: [
    { id: 'chk-1', text: 'Morning Hydration & Electrolytes', done: false },
    { id: 'chk-2', text: 'Pre-Workout Dynamic Warmup', done: false },
    { id: 'chk-3', text: 'Daily Resistance Training Session', done: false },
    { id: 'chk-4', text: 'Hit Daily Step Goal', done: false },
    { id: 'chk-5', text: 'Hit Daily Protein Target', done: false },
    { id: 'chk-6', text: 'Evening Mobility & Sleep Recovery', done: false },
  ],
};
