import React, { useState } from 'react';
import { RACES, CLASSES } from '../data/aethelgard';
import { Swords, Users, Sparkles, Shield, Upload, Plus, Minus } from 'lucide-react';

interface LobbyProps {
  initialRoom: string;
  onJoin: (payload: { roomId: string; playerName: string; role: 'dm' | 'player'; character: any }) => void;
}

const ICONS = ['⚔️', '🔮', '🛡️', '🏹', '🗡️', '🕊️', '🐉', '🐺', '🦇', '🧜', '👺', '🎵'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const Lobby: React.FC<LobbyProps> = ({ initialRoom, onJoin }) => {
  const hasUrlRoom = new URLSearchParams(window.location.search).has('room');
  const [roomId, setRoomId] = useState(initialRoom || 'AETHEL');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole] = useState<'player' | 'dm'>(hasUrlRoom ? 'player' : 'dm');
  const [mode, setMode] = useState<'create' | 'spectate'>('create');
  const [savedChars, setSavedChars] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('aethelgard_saved_chars');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Character builder state
  const [charName, setCharName] = useState('อาเธอร์ (Arthur)');
  const [raceIdx, setRaceIdx] = useState(0);
  const [subraceIdx, setSubraceIdx] = useState(0);
  const [classIdx, setClassIdx] = useState(0);
  const [subclassIdx, setSubclassIdx] = useState(0);
  const [icon, setIcon] = useState('🔮');
  const [color, setColor] = useState('#8b5cf6');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Stat points & Skill points
  const [bonusStats, setBonusStats] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const MAX_STAT_POINTS = 10;
  const usedStatPoints = bonusStats.reduce((a, b) => a + b, 0);
  const remainingStatPoints = MAX_STAT_POINTS - usedStatPoints;

  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const MAX_SKILL_POINTS = 3;
  const usedSkillPoints = Object.values(skillLevels).reduce((a, lv) => a + Math.max(0, lv - 1), 0);
  const remainingSkillPoints = MAX_SKILL_POINTS - usedSkillPoints;

  const race = RACES[raceIdx];
  const subrace = race.subraces[subraceIdx] || race.subraces[0];
  const cls = CLASSES[classIdx];
  const subclass = cls.subclasses[subclassIdx] || cls.subclasses[0];

  const finalStats = race.baseStats.map((base, i) => base + bonusStats[i]);
  const conMod = Math.floor((finalStats[2] - 10) / 2);
  const dexMod = Math.floor((finalStats[1] - 10) / 2);
  const maxHp = Math.max(5, cls.hp + conMod);
  const ac = 10 + dexMod + (cls.group === 'Aura' || cls.id === 'paladin' ? 2 : 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const adjStat = (idx: number, delta: number) => {
    setBonusStats((prev) => {
      const next = [...prev];
      if (delta > 0 && remainingStatPoints <= 0) return prev;
      if (delta < 0 && next[idx] <= 0) return prev;
      if (delta > 0 && race.baseStats[idx] + next[idx] >= 20) return prev;
      next[idx] += delta;
      return next;
    });
  };

  const adjSkillLv = (skillId: string, delta: number) => {
    setSkillLevels((prev) => {
      const cur = prev[skillId] || 1;
      if (delta > 0 && (remainingSkillPoints <= 0 || cur >= 3)) return prev;
      if (delta < 0 && cur <= 1) return prev;
      return { ...prev, [skillId]: cur + delta };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pName = playerName.trim() || (role === 'dm' ? 'Dungeon Master' : 'นักผจญภัย');
    let character: any = null;

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
        avatarUrl,
        color,
        isEnemy: false,
        stats: finalStats,
        skillLevels,
        skillPoints: remainingSkillPoints,
        equipment: {
          head: '',
          weapon: cls.group === 'Magic' ? 'คทามานาฝึกหัด' : cls.id === 'ranger' ? 'ธนูยาว' : cls.id === 'rogue' ? 'มีดสั้นคู่' : 'ดาบ/ค้อนเหล็กกล้า',
          offhand: cls.id === 'paladin' || cls.id === 'fighter' ? 'โล่ไม้โอ๊ค' : '',
          armor: cls.group === 'Aura' || cls.id === 'paladin' ? 'เกราะโซ่ / เกราะหนัง' : 'เสื้อคลุมนักผจญภัย',
          accessory: 'ตราประจำกิลด์ Crosshaven',
          boots: 'รองเท้าหนังนักเดินทาง',
          gold: 10,
          bag: [
            { id: 'st_1', name: 'ยาฟื้นฟู HP', icon: '🧪', qty: 2 },
            { id: 'st_2', name: 'เสบียงแห้ง', icon: '🍖', qty: 3 },
            { id: 'st_3', name: 'คบเพลิง', icon: '🔥', qty: 2 }
          ]
        }
      };
      try {
        const nextSaved = [character, ...savedChars.filter((c) => c.name !== character.name)].slice(0, 5);
        localStorage.setItem('aethelgard_saved_chars', JSON.stringify(nextSaved));
        setSavedChars(nextSaved);
      } catch {
        // ignore storage quota errors
      }
    }

    onJoin({ roomId: roomId.trim() || 'AETHEL', playerName: pName, role, character });
  };

  const allSkills = [...cls.skills, race.racialSkill];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Room Join Card */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Aethelgard Online</h1>
              <p className="text-xs text-slate-400">เข้าห้องเพื่อเล่นกับเพื่อน</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">รหัสห้อง (Room Code)</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold tracking-wider focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">ชื่อผู้เล่น</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="เช่น บอส, นนท์, มายด์"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">บทบาท</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('player')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'player' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> ผู้เล่น
                </button>
                <button
                  type="button"
                  onClick={() => setRole('dm')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                    role === 'dm' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Host (DM)
                </button>
              </div>
            </div>

            {role === 'player' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`py-1.5 rounded-lg border font-semibold ${
                    mode === 'create' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  ✨ สร้างตัวละคร
                </button>
                <button
                  type="button"
                  onClick={() => setMode('spectate')}
                  className={`py-1.5 rounded-lg border font-semibold ${
                    mode === 'spectate' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  👀 เข้าชมห้อง
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition cursor-pointer"
          >
            🚀 เข้าสู่โต๊ะผจญภัย
          </button>

          {role === 'player' && savedChars.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400">💾 ตัวละครที่เซฟไว้ (คลิกเพื่อเข้าเล่นต่อ)</div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll">
                {savedChars.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() =>
                      onJoin({
                        roomId: roomId.trim() || 'AETHEL',
                        playerName: playerName.trim() || sc.player || sc.name,
                        role: 'player',
                        character: sc
                      })
                    }
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/70 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {sc.avatarUrl ? (
                        <img src={sc.avatarUrl} alt={sc.name} className="w-7 h-7 rounded-full object-cover border border-white/50 shrink-0" />
                      ) : (
                        <span className="text-base shrink-0">{sc.icon || '🧙'}</span>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 truncate">{sc.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{sc.className}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">เข้าเล่น →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Right: Character Creator */}
        <div className={`lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl ${role === 'dm' || mode === 'spectate' ? 'opacity-45 pointer-events-none' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> สร้างตัวละคร Aethelgard
            </h2>
            <div className="text-xs font-mono text-emerald-400 font-bold">
              HP {maxHp} • AC {ac} • {cls.resName} {cls.maxMp}
            </div>
          </div>

          {/* Identity + Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <label className="relative cursor-pointer group shrink-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-white/80 overflow-hidden shadow-lg"
                style={{ backgroundColor: color }}
              >
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : icon}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>

            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ชื่อตัวละคร</label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">อัปโหลดรูปตัวเอง / เลือกสีกรอบ</label>
                <div className="flex items-center gap-1.5">
                  <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer font-semibold flex items-center gap-1 shrink-0">
                    <Upload className="w-3 h-3" /> ใส่รูป
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  {avatarUrl && (
                    <button type="button" onClick={() => setAvatarUrl(null)} className="text-[11px] text-rose-400 hover:underline">
                      ลบรูป
                    </button>
                  )}
                  <div className="flex gap-1 ml-auto">
                    {COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-4 h-4 rounded-full border ${color === c ? 'border-white scale-125' : 'border-transparent opacity-70'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Race & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">เผ่าพันธุ์ (Base Stat ต่างกันตามเผ่า)</label>
              <select
                value={raceIdx}
                onChange={(e) => { setRaceIdx(Number(e.target.value)); setSubraceIdx(0); setBonusStats([0,0,0,0,0,0]); }}
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
              <label className="block font-semibold text-slate-300 mb-1">อาชีพ</label>
              <select
                value={classIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setClassIdx(idx);
                  setSubclassIdx(0);
                  setIcon(CLASSES[idx].icon);
                  setSkillLevels({});
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

          {/* Stat Points Allocation */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">📊 ค่าพลังพื้นฐานเผ่า + แต้มอัป (Stat Points)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-mono font-bold">
                เหลือ {remainingStatPoints} แต้ม
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((lb, i) => {
                const total = finalStats[i];
                const mod = Math.floor((total - 10) / 2);
                const isMain = lb === cls.mainStat;
                return (
                  <div key={lb} className={`p-2 rounded-xl bg-slate-950 border ${isMain ? 'border-indigo-500' : 'border-slate-800'}`}>
                    <div className="text-[10px] font-bold text-slate-400">{lb} {isMain ? '★' : ''}</div>
                    <div className="flex items-center justify-center gap-1 my-1">
                      <button type="button" onClick={() => adjStat(i, -1)} className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-sm w-6">{total}</span>
                      <button type="button" onClick={() => adjStat(i, 1)} className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono">
                      Base {race.baseStats[i]} ({mod >= 0 ? `+${mod}` : mod})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Points Allocation */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">⚡ อัปเกรดสกิลเริ่มต้น (Skill Points)</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                เหลือ {remainingSkillPoints} SP
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allSkills.map((sk) => {
                const lv = skillLevels[sk.id] || 1;
                return (
                  <div key={sk.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold truncate">{sk.icon} {sk.name.split('(')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Lv.{lv} {lv > 1 ? `(+${lv - 1} Hit/Dmg)` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => adjSkillLv(sk.id, -1)} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-amber-300">Lv.{lv}</span>
                      <button type="button" onClick={() => adjSkillLv(sk.id, 1)} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
