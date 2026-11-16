import React, { useEffect, useState } from 'react';

interface DiceRollOverlayProps {
  latestLog: any;
}

export const DiceRollOverlay: React.FC<DiceRollOverlayProps> = ({ latestLog }) => {
  const [visible, setVisible] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [displayNum, setDisplayNum] = useState<number>(20);

  useEffect(() => {
    if (!latestLog) return;
    if (latestLog.type !== 'dice' && latestLog.type !== 'skill') return;

    const finalVal =
      latestLog.type === 'dice'
        ? latestLog.total
        : latestLog.hit?.total ?? latestLog.effect?.total ?? null;

    if (finalVal === null || finalVal === undefined) return;

    setVisible(true);
    setRolling(true);

    const interval = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 20) + 1);
    }, 65);

    const landTimer = setTimeout(() => {
      clearInterval(interval);
      setRolling(false);
      setDisplayNum(finalVal);
    }, 650);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(landTimer);
      clearTimeout(hideTimer);
    };
  }, [latestLog?.id]);

  if (!visible || !latestLog) return null;

  const isCrit = latestLog.type === 'dice' ? latestLog.isCrit : latestLog.hit?.isCrit;
  const isFumble = latestLog.type === 'dice' ? latestLog.isFumble : latestLog.hit?.isFumble;
  const title = latestLog.type === 'dice' ? `${latestLog.who} ทอย ${latestLog.label}` : `${latestLog.who} ใช้ ${latestLog.skillName}`;
  const sub =
    latestLog.type === 'skill' && latestLog.effect
      ? `${latestLog.effectLabel}: ${latestLog.effect.total}`
      : latestLog.type === 'dice'
      ? `[${latestLog.detail}]`
      : '';

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          !rolling && isCrit
            ? 'bg-emerald-950/90 border-emerald-400 shadow-emerald-500/30 scale-105'
            : !rolling && isFumble
            ? 'bg-rose-950/90 border-rose-400 shadow-rose-500/30'
            : 'bg-slate-900/90 border-indigo-500/60 shadow-indigo-500/20'
        }`}
      >
        {/* Animated Die */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl border-2 shadow-inner transition-transform ${
            rolling
              ? 'animate-spin bg-indigo-600/30 border-indigo-400 text-indigo-200'
              : isCrit
              ? 'bg-emerald-500 text-slate-950 border-emerald-200 scale-110'
              : isFumble
              ? 'bg-rose-500 text-white border-rose-200'
              : 'bg-indigo-600 text-white border-indigo-300'
          }`}
        >
          {displayNum}
        </div>

        <div className="min-w-[140px]">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>{title}</span>
            {!rolling && isCrit && <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px]">🔥 CRIT!</span>}
            {!rolling && isFumble && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px]">💀 MISS!</span>}
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-0.5">
            {rolling ? 'กำลังทอยลูกเต๋า...' : sub}
          </div>
        </div>
      </div>
    </div>
  );
};
