// Recovery Engine for Vulcan / Built Fitness App
// Follows exact Built aesthetic:
// - Recently trained (<24h): Intense Dark/Vivid Red
// - Recovering (24-72h): Light Pink / Coral / Salmon tint
// - Recovered (>72h): Crisp Off-White with athletic graphite contour

export const MUSCLE_METADATA = {
  chest: { name: 'Pectorals (Chest)', view: 'front', recoveryHoursNeeded: 60, sideGroup: 'chest' },
  deltoids_front: { name: 'Front Deltoids', view: 'front', recoveryHoursNeeded: 48, sideGroup: 'shoulders' },
  deltoids_rear: { name: 'Rear Deltoids', view: 'back', recoveryHoursNeeded: 48, sideGroup: 'shoulders' },
  deltoids_side: { name: 'Lateral Deltoids', view: 'side', recoveryHoursNeeded: 48, sideGroup: 'shoulders' },
  biceps: { name: 'Biceps Brachii', view: 'front', recoveryHoursNeeded: 44, sideGroup: 'arms' },
  triceps: { name: 'Triceps Brachii', view: 'back', recoveryHoursNeeded: 48, sideGroup: 'arms' },
  forearms: { name: 'Forearms', view: 'front', recoveryHoursNeeded: 36, sideGroup: 'arms' },
  abs: { name: 'Rectus Abdominis (Core)', view: 'front', recoveryHoursNeeded: 36, sideGroup: 'core' },
  obliques: { name: 'Obliques', view: 'front', recoveryHoursNeeded: 36, sideGroup: 'core' },
  quads: { name: 'Quadriceps', view: 'front', recoveryHoursNeeded: 72, sideGroup: 'legs' },
  traps: { name: 'Trapezius', view: 'back', recoveryHoursNeeded: 48, sideGroup: 'back' },
  upper_back: { name: 'Upper Back / Rhomboids', view: 'back', recoveryHoursNeeded: 60, sideGroup: 'back' },
  lats: { name: 'Latissimus Dorsi', view: 'back', recoveryHoursNeeded: 60, sideGroup: 'back' },
  lower_back: { name: 'Lower Back (Erectors)', view: 'back', recoveryHoursNeeded: 72, sideGroup: 'back' },
  glutes: { name: 'Gluteus Maximus', view: 'back', recoveryHoursNeeded: 68, sideGroup: 'legs' },
  hamstrings: { name: 'Hamstrings', view: 'back', recoveryHoursNeeded: 70, sideGroup: 'legs' },
  calves_front: { name: 'Tibialis Anterior (Shins)', view: 'front', recoveryHoursNeeded: 40, sideGroup: 'legs' },
  calves_back: { name: 'Gastrocnemius (Calves)', view: 'back', recoveryHoursNeeded: 40, sideGroup: 'legs' },
};

/**
 * Calculates recovery status for a single muscle
 */
export function getMuscleRecoveryState(muscleData, muscleKey) {
  const meta = MUSCLE_METADATA[muscleKey] || {
    name: muscleKey,
    recoveryHoursNeeded: 48,
  };

  if (!muscleData || !muscleData.lastTrainedTime) {
    return {
      muscleKey,
      name: meta.name,
      hoursAgo: null,
      recoveryPercent: 100,
      fatiguePercent: 0,
      status: 'recovered',
      statusLabel: 'Fully Recovered (Ready)',
      colorTier: 'ready',
      fillColor: '#E8ECF2', // Crisp athletic off-white (Built app style)
      strokeColor: '#2B3142',
      glow: false,
      hoursRemaining: 0,
      recommendation: 'Prime for training. Maximum neural and muscular readiness.',
    };
  }

  const now = Date.now();
  const trainedAt = new Date(muscleData.lastTrainedTime).getTime();
  const hoursAgo = Math.max(0, (now - trainedAt) / (1000 * 60 * 60));

  const recoveryTimeNeeded = meta.recoveryHoursNeeded;
  let recoveryPercent = Math.min(100, Math.round((hoursAgo / recoveryTimeNeeded) * 100));
  if (muscleData.overridePercent !== undefined) {
    recoveryPercent = muscleData.overridePercent;
  }
  const fatiguePercent = Math.max(0, 100 - recoveryPercent);
  const hoursRemaining = Math.max(0, Math.round(recoveryTimeNeeded - hoursAgo));

  // Visual categorization matching the user's reference images:
  // - Recently trained (< 24h): Intense Dark Red / Vivid Red
  // - Recovering (24h - 48h): Light Rose / Coral / Pink
  // - Late recovery (48h - 72h): Very Faint Blush / Peach
  // - Recovered (> 72h): Crisp Off-White with clean dark borders
  if (hoursAgo < 24) {
    return {
      muscleKey,
      name: meta.name,
      hoursAgo: Number(hoursAgo.toFixed(1)),
      recoveryPercent,
      fatiguePercent,
      status: 'recently_trained',
      statusLabel: 'Recently Trained (Hypertrophy Window)',
      colorTier: 'dark_red',
      fillColor: '#D32F2F', // Intense Dark Crimson (Built style)
      fillColorSecondary: '#B71C1C',
      strokeColor: '#FF5252',
      glow: true,
      hoursRemaining,
      recommendation: 'Muscle fibers actively repairing. Heavy mechanical load not advised.',
    };
  } else if (hoursAgo >= 24 && hoursAgo < 48) {
    return {
      muscleKey,
      name: meta.name,
      hoursAgo: Number(hoursAgo.toFixed(1)),
      recoveryPercent,
      fatiguePercent,
      status: 'recovering_mid',
      statusLabel: 'Intermediate Recovery',
      colorTier: 'light_red',
      fillColor: '#F87171', // Light coral / pink (Built app style)
      fillColorSecondary: '#FCA5A5',
      strokeColor: '#EF4444',
      glow: false,
      hoursRemaining,
      recommendation: 'Moderate recovery achieved. Mobility or active rest advised.',
    };
  } else if (hoursAgo >= 48 && hoursAgo < 72) {
    return {
      muscleKey,
      name: meta.name,
      hoursAgo: Number(hoursAgo.toFixed(1)),
      recoveryPercent,
      fatiguePercent,
      status: 'recovering_late',
      statusLabel: 'Almost Recovered',
      colorTier: 'faint_light_color',
      fillColor: '#FECDD3', // Faint soft blush / peach
      fillColorSecondary: '#FFE4E6',
      strokeColor: '#FDA4AF',
      glow: false,
      hoursRemaining,
      recommendation: 'Near 100% capacity. Ready for progressive overload.',
    };
  } else {
    return {
      muscleKey,
      name: meta.name,
      hoursAgo: Number(hoursAgo.toFixed(1)),
      recoveryPercent: 100,
      fatiguePercent: 0,
      status: 'recovered',
      statusLabel: 'Fully Recovered (Ready)',
      colorTier: 'ready',
      fillColor: '#E8ECF2', // Crisp off-white from Built screenshots
      strokeColor: '#2B3142',
      glow: false,
      hoursRemaining: 0,
      recommendation: '100% recovered. Optimal target for today’s session!',
    };
  }
}

export function calculateOverallReadiness(muscleStates) {
  const keys = Object.keys(MUSCLE_METADATA);
  let totalPercent = 0;

  keys.forEach((key) => {
    const state = getMuscleRecoveryState(muscleStates[key], key);
    totalPercent += state.recoveryPercent;
  });

  return Math.round(totalPercent / keys.length);
}
