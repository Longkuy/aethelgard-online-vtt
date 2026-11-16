import React, { useState } from 'react';
import { ACTS } from '../data/aethelgard';
import { MessageSquare, Dices, Crown, Send } from 'lucide-react';

interface ChatAndDiceProps {
  logs: any[];
  act: string | number;
  isDM: boolean;
  playerName: string;
  onRollDice: (sides: number, mod: number, mode: string) => void;
  onSendChat: (text: string, isNarration?: boolean) => void;
  onSetAct: (act: string | number) => void;
  onSpawnEnemies: () => void;
  onResetRoom: () => void;
}

export const ChatAndDice: React.FC<ChatAndDiceProps> = ({
  logs,
  act,
  isDM,
  onRollDice,
  onSendChat,
  onSetAct,
  onSpawnEnemies,
  onResetRoom
}) => {
  const [tab, setTab] = useState<'chat' | 'dm'>('chat');
  const [text, setText] = useState('');
  const [mod, setMod] = useState(0);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendChat(text.trim(), false);
    setText('');
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            tab === 'chat' ? 'border-indigo-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> แชท & ทอยเต๋า
        </button>
        <button
          onClick={() => setTab('dm')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            tab === 'dm' ? 'border-amber-500 text-amber-300 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" /> ฉาก & DM Tools
        </button>
      </div>

      {tab === 'chat' ? (
        <>
          {/* Quick Dice Bar */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold"><Dices className="w-3.5 h-3.5 text-indigo-400" /> ทอยด่วน</span>
              <div className="flex items-center gap-1">
                <span>Mod:</span>
                <button onClick={() => setMod((m) => m - 1)} className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700">-</button>
                <span className="w-6 text-center font-mono font-bold text-white">{mod >= 0 ? `+${mod}` : mod}</span>
                <button onClick={() => setMod((m) => m + 1)} className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700">+</button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1 text-[11px] font-bold font-mono">
              {[4, 6, 8, 10, 12, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => onRollDice(d, mod, 'normal')}
                  className={`py-1.5 rounded-lg border transition cursor-pointer ${
                    d === 20
                      ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  d{d}
                </button>
              ))}
            </div>
          </div>

          {/* Rich Log Feed */}
          <div className="flex-1 overflow-y-auto custom-scroll p-2.5 space-y-2 text-xs">
            {logs.map((l) => {
              if (l.type === 'skill') {
                return (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <span>{l.casterIcon}</span> {l.who}
                      </span>
                      <span className="text-[10px] text-slate-500">{l.time}</span>
                    </div>
                    <div className="text-indigo-300 font-bold flex items-center gap-1">
                      <span>{l.skillIcon}</span> {l.skillName}
                      {l.targetName && <span className="text-amber-300 font-normal">→ {l.targetName}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {l.hit && (
                        <div className={`p-1.5 rounded-lg bg-slate-900 border text-center ${l.hit.isCrit ? 'border-emerald-500' : l.hit.isFumble ? 'border-rose-500' : 'border-slate-800'}`}>
                          <div className="text-[10px] text-slate-400">ทอยโจมตี/เช็ก</div>
                          <div className={`font-mono font-black text-sm ${l.hit.isCrit ? 'text-emerald-400' : l.hit.isFumble ? 'text-rose-400' : 'text-white'}`}>
                            {l.hit.total} {l.hit.isCrit ? 'CRIT!' : l.hit.isFumble ? 'MISS!' : ''}
                          </div>
                        </div>
                      )}
                      {l.effect && (
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                          <div className="text-[10px] text-slate-400">{l.effectLabel}</div>
                          <div className="font-mono font-black text-sm text-amber-300">
                            {l.effect.total}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">[{l.effect.rolls.join('+')}]</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (l.type === 'dice') {
                return (
                  <div key={l.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-400">{l.who}</span>{' '}
                      <span className="text-slate-400">ทอย {l.label}</span>
                      <div className="text-[10px] text-slate-500">[{l.detail}] {l.mod !== 0 ? (l.mod > 0 ? `+${l.mod}` : l.mod) : ''}</div>
                    </div>
                    <div className={`text-lg font-mono font-black ${l.isCrit ? 'text-emerald-400' : l.isFumble ? 'text-rose-400' : 'text-white'}`}>
                      {l.total}
                    </div>
                  </div>
                );
              }

              if (l.type === 'narration') {
                return (
                  <div key={l.id} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-700/40 text-amber-200 italic leading-relaxed">
                    📖 {l.text}
                  </div>
                );
              }

              return (
                <div key={l.id} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="font-bold text-emerald-400">[{l.who}]</span>{' '}
                  <span className="text-slate-200">{l.text}</span>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 flex gap-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="พิมพ์ข้อความ / Roleplay..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      ) : (
        /* DM & Scene Tools */
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-4 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-300">🗺️ เปลี่ยนฉากแผนที่ (Scenes)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {[1, 2, 3, 'world'].map((a) => (
                <button
                  key={String(a)}
                  onClick={() => onSetAct(a)}
                  className={`text-left p-2.5 rounded-xl border transition ${
                    act === a ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{ACTS[a].title}</div>
                  <div className="text-[10px] text-slate-400">{ACTS[a].badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-amber-300">📖 บทบรรยายฉากปัจจุบัน</div>
            <p className="text-[11px] text-slate-300 leading-relaxed italic">{ACTS[act]?.narration}</p>
            <button
              onClick={() => onSendChat(ACTS[act]?.narration || '', true)}
              className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              📢 ส่งบทบรรยายเข้าแชท
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="font-bold text-slate-300">⚔️ เครื่องมือ DM</div>
            <button
              onClick={onSpawnEnemies}
              className="w-full py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-bold"
            >
              🐺 เสกมอนสเตอร์ Act 3 (ก็อบลิน 2 + หมาป่า Miasma 1)
            </button>
            {isDM && (
              <button
                onClick={onResetRoom}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                ↺ รีเซ็ตห้องใหม่ทั้งหมด
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
