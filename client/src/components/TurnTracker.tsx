import React from 'react';
import { Dices, SkipForward, Users } from 'lucide-react';

interface TurnTrackerProps {
  party: any[];
  turnIndex: number;
  selectedCharId: string | null;
  players: Record<string, any>;
  isDM: boolean;
  onSelectChar: (id: string) => void;
  onRollInit: () => void;
  onNextTurn: () => void;
}

export const TurnTracker: React.FC<TurnTrackerProps> = ({
  party,
  turnIndex,
  selectedCharId,
  players,
  isDM,
  onSelectChar,
  onRollInit,
  onNextTurn
}) => {
  const sorted = [...party].sort((a, b) => (b.init || 0) - (a.init || 0));
  const activeId = sorted[turnIndex % Math.max(1, sorted.length)]?.id;
  const onlineList = Object.values(players || {});

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300">Turn Tracker</h2>
        <div className="flex gap-1">
          <button
            onClick={onRollInit}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
            title="ทอย Initiative ทั้งหมด"
          >
            <Dices className="w-3.5 h-3.5" />
          </button>
          {isDM && (
            <button
              onClick={onNextTurn}
              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1"
              title="เทิร์นถัดไป"
            >
              Next <SkipForward className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-2.5 space-y-2">
        {sorted.map((c) => {
          const isTurn = c.id === activeId;
          const isSel = c.id === selectedCharId;
          const pct = Math.max(0, Math.min(100, Math.round((c.hp / c.maxHp) * 100)));

          return (
            <button
              key={c.id}
              onClick={() => onSelectChar(c.id)}
              className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${
                isSel
                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                  : isTurn
                  ? 'border-amber-500/70 bg-amber-950/20'
                  : c.isEnemy
                  ? 'border-rose-900/50 bg-rose-950/15 hover:bg-rose-950/30'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{c.icon}</span>
                  <span className="font-bold text-xs truncate text-slate-100">{c.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${isTurn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  {c.init || 0}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {c.raceName} • {c.className}
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${c.isEnemy ? 'bg-rose-500' : pct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-300">
                  {c.hp}/{c.maxHp}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Online Players Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" /> ออนไลน์ในห้อง ({onlineList.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {onlineList.map((p: any) => (
            <span
              key={p.socketId}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                p.role === 'dm' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {p.role === 'dm' ? '👑 ' : '● '}
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};
