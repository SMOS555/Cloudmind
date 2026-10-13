import {
  Activity,
  Dumbbell,
  Brain,
  Calendar,
  Clock,
  Camera,
  User,
  Footprints,
  LogOut,
} from 'lucide-react';
import BatLogo from './BatLogo';

export default function Navbar({
  activeTab,
  setActiveTab,
  dailyWorkoutMinutes,
  streakDays,
  userProfile,
  onOpenProfileModal,
  onLogout,
}) {
  const navItems = [
    { id: 'anatomy', label: 'Heatmap', icon: Activity },
    { id: 'steps', label: 'Steps', icon: Footprints },
    { id: 'progress', label: 'Progress', icon: Camera },
    { id: 'ai', label: 'King Bat AI', icon: Brain },
    { id: 'logger', label: 'Workout', icon: Dumbbell },
    { id: 'routine', label: 'Routines', icon: Clock },
    { id: 'history', label: 'History', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md border-b border-[#1A1A22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo (Batman Emblem + FITBAT OS) */}
        <div
          onClick={() => setActiveTab('anatomy')}
          className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
        >
          <div className="p-1.5 rounded-xl bg-[#0E0E14] border border-[#22222E] flex items-center justify-center text-white shadow-md group-hover:border-white transition-all">
            <BatLogo className="w-7 h-auto" variant="metallic" glow={true} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-widest text-white uppercase font-sans">
                FITBAT
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-black uppercase tracking-wider">
                OS
              </span>
            </div>
            <p className="text-[8px] text-neutral-400 font-mono tracking-widest uppercase hidden sm:block">
              TACTICAL FITNESS OS
            </p>
          </div>
        </div>

        {/* Center: Segmented Navigation Pills - Neatly Organized with Dedicated Steps Window */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0A0A0E] p-1 rounded-2xl border border-[#1E1E28] shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Logged-in Email Profile, Logout Button & Log Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* User Profile Pill */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E0E14] border border-[#22222E] hover:border-white text-white transition shadow-sm cursor-pointer group"
            title={
              userProfile?.email
                ? `Logged in as ${userProfile.email} (Click to edit profile)`
                : 'Login with Email ID & Sync Google Fit'
            }
          >
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-black">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black tracking-wider uppercase truncate max-w-[85px] lg:max-w-[115px]">
                {userProfile?.name || 'Login'}
              </span>
              {userProfile?.email ? (
                <span className="text-[9px] font-mono text-neutral-400 leading-none truncate max-w-[85px] lg:max-w-[115px]">
                  {userProfile.email}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-neutral-500 leading-none">
                  Sign in with Mail
                </span>
              )}
            </div>
          </button>

          {/* 1-Click Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-2 rounded-xl bg-[#0E0E14] hover:bg-white hover:text-black border border-[#22222E] text-neutral-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Logout & Return to Login Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          )}

          {/* Primary Action Button: Log Workout */}
          <button
            onClick={() => setActiveTab('logger')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <BatLogo className="w-4 h-auto text-black" />
            <span className="hidden sm:inline">Log Workout</span>
            <span className="sm:hidden">Log</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex items-center justify-around border-t border-[#181820] bg-[#000000] py-2 px-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-1.5 text-[10px] font-bold cursor-pointer flex-shrink-0 ${
                isActive ? 'text-white font-black' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
