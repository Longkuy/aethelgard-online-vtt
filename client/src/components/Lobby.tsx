import React, { useState } from 'react';
import { RACES, CLASSES } from '../data/aethelgard';
import { Swords, Users, Sparkles, Dices, Shield } from 'lucide-react';

interface LobbyProps {
  initialRoom: string;
  onJoin: (payload: { roomId: string; playerName: string; role: 'dm' | 'player'; character: any }) => void;
}

const ICONS = ['⚔️', '🔮', '🛡️', '🏹', '🗡️', '🕊️', '🐉', '🐺', '🦇', '🧜', '👺', '🎵'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const Lobby: React.FC<LobbyProps> = ({ initialRoom, onJoin }) => {
  const [roomId, setRoomId] = useState(initialRoom || 'AETHEL');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole] = useState<'player' | 'dm'>('player');
  const [mode, setMode] = useState<'create' | 'quick'>('create');

  // Character builder state
  const [charName, setCharName] = useState('อาเธอร์ (Arthur)');
  const [raceIdx, setRaceIdx] = useState(0);
  const [subraceIdx, setSubraceIdx] = useState(0);
  const [classIdx, setClassIdx] = useState(0);
  const [subclassIdx, setSubclassIdx] = useState(0);
  const [icon, setIcon] = useState('🔮');
  const [color, setColor] = useState('#8b5cf6');
  const [stats, setStats] = useState([12, 14, 13, 16, 10, 8]);

  const race = RACES[raceIdx];
  const subrace = race.subraces[subraceIdx] || race.subraces[0];
  const cls = CLASSES[classIdx];
  const subclass = cls.subclasses[subclassIdx] || cls.subclasses[0];
  const conMod = Math.floor((stats[2] - 10) / 2);
  const dexMod = Math.floor((stats[1] - 10) / 2);
  const maxHp = Math.max(5, cls.hp + conMod);
  const ac = 10 + dexMod + (cls.group === 'Aura' || cls.id === 'paladin' ? 2 : 0);

  const rollStats = () => {
    setStats(
      Array.from({ length: 6 }, () => {
        const r = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
        return r[1] + r[2] + r[3];
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pName = playerName.trim() || (role === 'dm' ? 'Dungeon Master' : 'นักผจญภัย');
    let character = null;

    if (role === 'player' && mode === 'create') {
      character = {
        id: 'char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        name: charName.trim() || pName,
        player: pName,
        raceId: race.id,
        raceName: `${race.name.split('(')[0].trim()} (${subrace.name})`,
        classId: cls.id,
        className: `${cls.name.split('(')[0].trim()} (${subclass.split('(')[0].trim()})`,
        hp: maxHp,
        maxHp,
        ac,
        mp: cls.maxMp,
        maxMp: cls.maxMp,
        resName: cls.resName,
        init: 10 + dexMod,
        icon,
        color,
        isEnemy: false,
        stats
      };
    }

    onJoin({ roomId: roomId.trim() || 'AETHEL', playerName: pName, role, character });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Room Join Card */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Aethelgard Online</h1>
              <p className="text-xs text-slate-400">Roll20-Style VTT • เล่นออนไลน์กับเพื่อน</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">รหัสห้อง (Room Code)</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="เช่น AETHEL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold tracking-wider focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">ส่งรหัสห้องหรือ URL นี้ให้เพื่อนเพื่อเข้าห้องเดียวกัน</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ชื่อของคุณ (Player Name)</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="เช่น บอส, นนท์, มายด์"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">บทบาทในห้อง</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('player')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'player' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" /> ผู้เล่น (Player)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('dm')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'dm' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Dungeon Master
                </button>
              </div>
            </div>

            {role === 'player' && (
              <div className="pt-1">
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className={`flex-1 py-2 rounded-lg border font-semibold ${
                      mode === 'create' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    ✨ สร้างตัวละครใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('quick')}
                    className={`flex-1 py-2 rounded-lg border font-semibold ${
                      mode === 'quick' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ ใช้ตัวละครในห้อง
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            🚀 เข้าสู่โต๊ะผจญภัย (Join Room)
          </button>
        </form>

        {/* Right: Character Creator Preview */}
        <div className={`lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl ${role === 'dm' || mode === 'quick' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> สร้างตัวละคร Aethelgard
            </h2>
            <button
              type="button"
              onClick={rollStats}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold flex items-center gap-1"
            >
              <Dices className="w-3.5 h-3.5" /> สุ่มสเตตัส 4d6
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">ชื่อตัวละคร</label>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block font-semibold text-slate-300 mb-1">ไอคอน & สีหมาก</label>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {ICONS.slice(0, 6).map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-7 h-7 rounded border text-sm shrink-0 ${icon === ic ? 'bg-indigo-600 border-white' : 'bg-slate-950 border-slate-800'}`}
                    >
                      {ic}
                    </button>
                  ))}
                  {COLORS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full shrink-0 border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">เผ่าพันธุ์ (9 เผ่า)</label>
              <select
                value={raceIdx}
                onChange={(e) => { setRaceIdx(Number(e.target.value)); setSubraceIdx(0); }}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
              >
                {RACES.map((r, i) => (
                  <option key={r.id} value={i}>{r.icon} {r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">สายพันธุ์ย่อย / ตระกูล</label>
              <select
                value={subraceIdx}
                onChange={(e) => setSubraceIdx(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
              >
                {race.subraces.map((sr, i) => (
                  <option key={sr.name} value={i}>{sr.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">อาชีพ (16 อาชีพ)</label>
              <select
                value={classIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setClassIdx(idx);
                  setSubclassIdx(0);
                  setIcon(CLASSES[idx].icon);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
              >
                {CLASSES.map((c, i) => (
                  <option key={c.id} value={i}>{c.icon} {c.name} [{c.group}]</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">สายย่อย / คำสาบาน</label>
              <select
                value={subclassIdx}
                onChange={(e) => setSubclassIdx(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
              >
                {cls.subclasses.map((sc, i) => (
                  <option key={sc} value={i}>{sc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((lb, i) => {
              const mod = Math.floor((stats[i] - 10) / 2);
              return (
                <div key={lb} className={`p-2 rounded-lg bg-slate-950 border ${lb === cls.mainStat ? 'border-indigo-500' : 'border-slate-800'}`}>
                  <div className="text-[10px] font-bold text-slate-400">{lb} {lb === cls.mainStat ? '★' : ''}</div>
                  <div className="font-mono font-bold text-sm">{stats[i]}</div>
                  <div className="text-[10px] text-indigo-400 font-mono">{mod >= 0 ? '+' : ''}{mod}</div>
                </div>
              );
            })}
          </div>

          {/* Skills Preview */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">⚡ สกิลที่จะได้ใช้ในเกม ({cls.skills.length + 1} สกิล)</span>
              <span className="text-emerald-400 font-mono font-bold">HP {maxHp} • AC {ac} • {cls.resName} {cls.maxMp}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cls.skills.map((s) => (
                <span key={s.id} className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
                  {s.icon} {s.name.split('(')[0]}
                </span>
              ))}
              <span className="px-2 py-1 rounded-md bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-[11px]">
                {race.racialSkill.icon} {race.racialSkill.name} (สกิลเผ่า)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
