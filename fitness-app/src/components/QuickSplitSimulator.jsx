import React from 'react';
import { FastForward, RotateCcw } from 'lucide-react';
import BatLogo from './BatLogo';

export default function QuickSplitSimulator({
  onBlastSplit,
  onFastForward,
  onResetDemo,
}) {
  return (
    <div className="bg-[#09090d] border border-[#1e1e28] rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-lg bg-white flex items-center justify-center text-black">
            <BatLogo className="w-5 h-auto text-black" />
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider">
            FITBAT • MUSCLE STIMULATOR CONTROLS
          </span>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">
          Interactive Heatmap Simulation: Dark Red (&lt;24h) &harr; Light Pink (&gt;24h) &harr; White (&gt;72h)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <button
          onClick={() => onBlastSplit('push')}
          className="p-2.5 rounded-xl bg-red-950/90 border border-red-700/80 text-white text-xs font-black hover:bg-red-900 transition flex flex-col items-center justify-center text-center shadow-lg"
        >
          <span className="text-xs uppercase tracking-wider">Blast Push Split</span>
          <span className="text-[10px] text-red-300 font-mono mt-0.5">Dark Red (0h)</span>
        </button>

        <button
          onClick={() => onBlastSplit('pull')}
          className="p-2.5 rounded-xl bg-red-950/90 border border-red-700/80 text-white text-xs font-black hover:bg-red-900 transition flex flex-col items-center justify-center text-center shadow-lg"
        >
          <span className="text-xs uppercase tracking-wider">Blast Pull Split</span>
          <span className="text-[10px] text-red-300 font-mono mt-0.5">Dark Red (0h)</span>
        </button>

        <button
          onClick={() => onBlastSplit('legs')}
          className="p-2.5 rounded-xl bg-red-950/90 border border-red-700/80 text-white text-xs font-black hover:bg-red-900 transition flex flex-col items-center justify-center text-center shadow-lg"
        >
          <span className="text-xs uppercase tracking-wider">Blast Leg Day</span>
          <span className="text-[10px] text-red-300 font-mono mt-0.5">Dark Red (0h)</span>
        </button>

        <button
          onClick={() => onFastForward(30)}
          className="p-2.5 rounded-xl bg-[#14141c] border border-[#242432] text-white text-xs font-bold hover:bg-white hover:text-black transition flex flex-col items-center justify-center text-center"
        >
          <span className="text-xs flex items-center gap-1 font-black uppercase">
            <FastForward className="w-3.5 h-3.5" /> +30h Elapse
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">Turns to Light Pink</span>
        </button>

        <button
          onClick={() => onFastForward(72)}
          className="p-2.5 rounded-xl bg-[#14141c] border border-[#242432] text-white text-xs font-bold hover:bg-white hover:text-black transition flex flex-col items-center justify-center text-center"
        >
          <span className="text-xs flex items-center gap-1 font-black uppercase">
            <FastForward className="w-3.5 h-3.5" /> +72h Elapse
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">Fully Recovered (White)</span>
        </button>

        <button
          onClick={onResetDemo}
          className="p-2.5 rounded-xl bg-[#0e0e14] border border-[#1e1e28] text-neutral-400 text-xs font-bold hover:text-white hover:border-white transition flex flex-col items-center justify-center text-center"
        >
          <span className="text-xs flex items-center gap-1 font-black uppercase">
            <RotateCcw className="w-3 h-3" /> Reset Demo
          </span>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">Initial Baseline</span>
        </button>
      </div>
    </div>
  );
}
