import React, { useState, useEffect } from 'react';
import BatLogo from './BatLogo';
import {
  User,
  Mail,
  Scale,
  Ruler,
  Target,
  ShieldCheck,
  X,
  Check,
  Footprints,
  LogOut,
} from 'lucide-react';
import { syncGoogleFitByEmail } from '../services/googleFitService';

export default function LoginProfileModal({
  isOpen,
  onClose,
  currentProfile,
  members = [],
  onSaveProfile,
  onResetAllData,
  onLogout,
  isFirstTime = false,
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [goal, setGoal] = useState('hypertrophy');
  const [level, setLevel] = useState('intermediate');

  useEffect(() => {
    if (!isFirstTime && currentProfile?.email) {
      // Editing currently logged-in user's own profile
      setEmail(currentProfile.email || '');
      setName(currentProfile.name || '');
      setWeight(currentProfile.weight || '');
      setWeightUnit(currentProfile.weightUnit || 'kg');
      setHeight(currentProfile.height || '');
      setHeightUnit(currentProfile.heightUnit || 'cm');
      setGoal(currentProfile.goal || 'hypertrophy');
      setLevel(currentProfile.level || 'intermediate');
    } else {
      // Logged-out Login Page: always start with clean, blank login fields
      setEmail('');
      setName('');
      setWeight('');
      setWeightUnit('kg');
      setHeight('');
      setHeightUnit('cm');
      setGoal('hypertrophy');
      setLevel('intermediate');
    }
  }, [currentProfile, isFirstTime, isOpen]);

  if (!isOpen) return null;

  // Auto-derive display name (or restore saved member metrics) when typing email
  const handleEmailChange = (val) => {
    setEmail(val);
    const clean = val.trim().toLowerCase();
    const existing = members.find((m) => m.email && m.email.toLowerCase() === clean);
    if (existing) {
      setName(existing.name || '');
      setWeight(existing.weight || '');
      setWeightUnit(existing.weightUnit || 'kg');
      setHeight(existing.height || '');
      setHeightUnit(existing.heightUnit || 'cm');
      setGoal(existing.goal || 'hypertrophy');
      setLevel(existing.level || 'intermediate');
      return;
    }

    if (val.includes('@') && !name.trim()) {
      const prefix = val.split('@')[0].replace(/[0-9._-]+/g, ' ').trim() || val.split('@')[0];
      if (prefix) {
        const formatted = prefix
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setName(formatted);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    let finalName = name.trim();
    if (!finalName) {
      const cleanedPrefix = cleanEmail.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
      finalName = (cleanedPrefix || cleanEmail.split('@')[0]).replace(/\b\w/g, (c) =>
        c.toUpperCase()
      );
    }

    // Check if this email already has an existing profile saved
    const existingByEmail = members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail
    );

    const isNewMemberAccount = !existingByEmail;
    const targetId = existingByEmail?.id || `member-${Date.now()}`;

    const profilePayload = {
      id: targetId,
      name: finalName,
      email: cleanEmail,
      googleFitLinked: true,
      weight: weight ? parseFloat(weight) : existingByEmail?.weight || 75,
      weightUnit,
      height: height ? parseFloat(height) : existingByEmail?.height || 175,
      heightUnit,
      goal,
      level,
      createdAt: existingByEmail?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sync Google Fit specifically for THIS email address
    const syncedFit = await syncGoogleFitByEmail(cleanEmail, 0, profilePayload);

    onSaveProfile(profilePayload, isNewMemberAccount, syncedFit.steps);
    onClose();
  };

  const goals = [
    { id: 'hypertrophy', label: 'Hypertrophy', desc: 'Build Lean Muscle Mass' },
    { id: 'strength', label: 'Raw Strength', desc: 'Max Weight & Power' },
    { id: 'shred', label: 'Tactical Shred', desc: 'Fat Loss & Conditioning' },
    { id: 'endurance', label: 'High Endurance', desc: 'Stamina & Longevity' },
  ];

  const levels = [
    { id: 'beginner', label: 'Recruit' },
    { id: 'intermediate', label: 'Vigilante' },
    { id: 'advanced', label: 'Dark Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#070709] border border-[#22222C] rounded-3xl p-6 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.98)] max-h-[92vh] overflow-y-auto">
        {/* Close Button (Only when already logged in) */}
        {!isFirstTime && currentProfile?.email && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-2.5 rounded-2xl bg-white text-black mb-2.5 shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            <BatLogo className="w-8 h-auto text-black" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-widest uppercase font-sans">
            {isFirstTime || !currentProfile?.email
              ? 'FITBAT MEMBER LOGIN'
              : 'MY ACCOUNT & PROFILE'}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1 font-mono">
            Sign in with your Mail ID — Google Fit connects &amp; syncs automatically
          </p>
        </div>

        {/* Clean Login Form — No Saved Member Switcher List */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Login Mail ID */}
          <div className="p-3.5 rounded-2xl bg-[#0D0D14] border border-[#282838] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-white" /> Login Mail ID *
              </label>
              <span className="px-2 py-0.5 rounded-md bg-white text-black text-[9px] font-mono font-black uppercase flex items-center gap-1">
                <Footprints className="w-3 h-3" /> Auto-Syncs Google Fit
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#07070B] border border-[#2C2C3C] text-white text-sm focus:border-white focus:outline-none transition font-mono placeholder:text-neutral-600"
              />
              {!email.includes('@') && email.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => handleEmailChange(`${email.trim()}@gmail.com`)}
                  className="px-3 py-2 rounded-xl bg-white text-black text-xs font-mono font-black whitespace-nowrap cursor-pointer hover:bg-neutral-200 transition"
                >
                  +@gmail.com
                </button>
              )}
            </div>
          </div>

          {/* 2. Member Name */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white" /> Member Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-filled from your email ID..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F0F14] border border-[#242430] text-white text-sm focus:border-white focus:outline-none transition font-sans placeholder:text-neutral-600"
            />
          </div>

          {/* 3. Bodyweight & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-white" /> Bodyweight
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75"
                  className="w-full px-3 py-2.5 rounded-l-xl bg-[#0F0F14] border border-[#242430] border-r-0 text-white text-sm focus:border-white focus:outline-none transition font-sans placeholder:text-neutral-600"
                />
                <div className="flex rounded-r-xl border border-[#242430] bg-[#14141C] p-1">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      weightUnit === 'kg' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      weightUnit === 'lbs' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    LBS
                  </button>
                </div>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-white" /> Height
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="1"
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="178"
                  className="w-full px-3 py-2.5 rounded-l-xl bg-[#0F0F14] border border-[#242430] border-r-0 text-white text-sm focus:border-white focus:outline-none transition font-sans placeholder:text-neutral-600"
                />
                <div className="flex rounded-r-xl border border-[#242430] bg-[#14141C] p-1">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      heightUnit === 'cm' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      heightUnit === 'ft' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    FT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Primary Fitness Target Goal */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-white" /> Personalised Goal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    goal === g.id
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-[#0E0E14] border-[#22222E] text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider">{g.label}</div>
                  <div className={`text-[10px] ${goal === g.id ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    {g.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Fitness Experience Level */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white" /> Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {levels.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold uppercase transition cursor-pointer ${
                    level === l.id
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-[#0E0E14] border-[#22222E] text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-200 transition font-black uppercase text-xs tracking-widest shadow-[0_4px_25px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isFirstTime || !currentProfile?.email
                  ? 'LOGIN WITH MAIL ID & CONNECT GOOGLE FIT'
                  : 'SAVE ACCOUNT DETAILS'}
              </span>
            </button>
          </div>
        </form>

        {/* Bottom Actions when logged in: Logout or Reset Data */}
        {!isFirstTime && currentProfile?.email && (
          <div className="mt-4 pt-3 border-t border-[#1C1C24] flex flex-wrap items-center justify-between gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Account</span>
              </button>
            )}

            {onResetAllData && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Reset all workout and progress records for ${currentProfile?.name || 'this member'}?`
                    )
                  ) {
                    onResetAllData();
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#14141C] border border-[#2C2C3A] text-neutral-300 hover:bg-white hover:text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <span>Reset Data</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
