import React from 'react';
import { Dices, SkipForward, Users, Swords, Flag } from 'lucide-react';

interface TurnTrackerProps {
  party: any[];
  inCombat: boolean;
  round: number;
  turnIndex: number;
  selectedCharId: string | null;
  players: Record<string, any>;
  isDM: boolean;
  onSelectChar: (id: string) => void;
  onRollInit: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onRemoveEntity: (id: string) => void;
  onToggleHidden?: (id: string) => void;
}

const CONDITION_EMOJI: Record<string, string> = {
  Poisoned: '🤢',
  Stunned: '💫',
  Prone: '⬇️',
  Burn: '🔥',
  Frozen: '❄️',
  Buffed: '🛡️'
};

export const TurnTracker: React.FC<TurnTrackerProps> = ({
  party,
  inCombat,
  round,
  turnIndex,
  selectedCharId,
  players,
  isDM,
  onSelectChar,
  onRollInit,
  onStartCombat,
  onEndCombat,
  onNextTurn,
  onRemoveEntity,
  onToggleHidden
}) => {
  const visibleParty = isDM ? party : party.filter((m) => !m.hidden);
  const sorted = [...visibleParty].sort((a, b) => (b.init || 0) - (a.init || 0));
  const currentTurnChar = inCombat && sorted.length > 0 ? sorted[turnIndex % sorted.length] : null;
  const activeId = currentTurnChar?.id || null;
  const onlineList = Object.values(players || {});

  return (
    <aside className="w-56 bg-slate-900/95 border-r border-slate-800/80 flex flex-col shrink-0">
      <div className="p-2.5 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400">ปาร์ตี้ & เทิร์น</h2>
          <div className="flex gap-1">
            <button
              onClick={onRollInit}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs"
              title="ทอย Initiative ทั้งหมด"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
            {isDM && inCombat && (
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

        {/* Combat Phase Banner & DM Toggle */}
        {inCombat ? (
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" /> Phase ต่อสู้ • R{round}
              </span>
              {isDM && (
                <button
                  onClick={onEndCombat}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-600/80 text-[10px] text-slate-300 hover:text-white font-semibold flex items-center gap-0.5"
                  title="จบการต่อสู้"
                >
                  <Flag className="w-2.5 h-2.5" /> จบ
                </button>
              )}
            </div>
            {currentTurnChar && (
              <div className="text-[11px] text-white font-bold truncate">
                ⏳ เทิร์น: {currentTurnChar.name.split('(')[0].trim()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-slate-400">🌿 นอกการต่อสู้</span>
            {isDM && (
              <button
                onClick={onStartCombat}
                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
              >
                <Swords className="w-3 h-3" /> เริ่มต่อสู้
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
        {sorted.length === 0 && (
          <div className="text-center text-[11px] text-slate-500 py-6 px-2">
            ยังไม่มีผู้เล่นในห้อง<br />ส่งลิงก์ให้เพื่อนเข้ามาสร้างตัวละครได้เลย
          </div>
        )}
        {sorted.map((c) => {
          const isTurn = inCombat && c.id === activeId;
          const isSel = c.id === selectedCharId;
          const pct = Math.max(0, Math.min(100, Math.round((c.hp / c.maxHp) * 100)));

          return (
            <button
              key={c.id}
              onClick={() => onSelectChar(c.id)}
              className={`w-full text-left p-2 rounded-xl border transition cursor-pointer ${
                c.hidden ? 'opacity-60 border-dashed ' : ''
              }${
                isSel
                  ? 'border-indigo-500/80 bg-indigo-950/30'
                  : isTurn
                  ? 'border-amber-500/60 bg-amber-950/20'
                  : c.isEnemy
                  ? 'border-rose-900/40 bg-rose-950/15 hover:bg-rose-950/30'
                  : 'border-slate-800/70 bg-slate-950/50 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} className="w-5 h-5 rounded-full object-cover border border-white/50 shrink-0" />
                  ) : (
                    <span className="text-sm">{c.icon}</span>
                  )}
                  <span className="font-semibold text-xs truncate text-slate-100">{c.name.split('(')[0].trim()}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isTurn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {c.init || 0}
                  </span>
                  {isDM && onToggleHidden && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onToggleHidden(c.id); }}
                      className="text-[10px] text-slate-400 hover:text-amber-300 px-0.5"
                      title={c.hidden ? 'แสดงให้ผู้เล่นเห็น' : 'ซ่อนจากผู้เล่น'}
                    >
                      {c.hidden ? '🙈' : '👁️'}
                    </span>
                  )}
                  {isDM && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onRemoveEntity(c.id); }}
                      className="text-[10px] text-slate-500 hover:text-rose-400 px-0.5"
                      title="ลบออกจากกระดาน"
                    >
                      ✕
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${c.isEnemy ? 'bg-rose-500' : pct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {c.hp}/{c.maxHp}
                </span>
              </div>

              {c.conditions && c.conditions.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.conditions.map((cond: string) => (
                    <span key={cond} className="text-[9px] px-1.5 py-0.25 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {CONDITION_EMOJI[cond] || '⚡'} {cond}
                    </span>
                  ))}
                </div>
              )}
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
