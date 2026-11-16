import React, { useState } from 'react';
import { CLASSES, RACES, SkillDef } from '../data/aethelgard';
import { Heart, Zap, Target, Sparkles, X, ArrowUpCircle } from 'lucide-react';

interface SkillHotbarProps {
  character: any;
  party: any[];
  onCastSkill: (charId: string, skill: SkillDef, targetName: string | null, mode: string) => void;
  onUpdateHp: (charId: string, delta: number) => void;
  onUpdateResource: (charId: string, delta: number) => void;
  onUpgradeSkill: (charId: string, skillId: string) => void;
}

const TYPE_ACCENT: Record<string, string> = {
  Attack: 'border-rose-500/35 bg-rose-950/25 hover:border-rose-400 hover:bg-rose-950/45',
  Heal: 'border-emerald-500/35 bg-emerald-950/25 hover:border-emerald-400 hover:bg-emerald-950/45',
  Buff: 'border-amber-500/35 bg-amber-950/25 hover:border-amber-400 hover:bg-amber-950/45',
  Utility: 'border-indigo-500/35 bg-indigo-950/25 hover:border-indigo-400 hover:bg-indigo-950/45'
};

export const SkillHotbar: React.FC<SkillHotbarProps> = ({
  character,
  party,
  onCastSkill,
  onUpdateHp,
  onUpdateResource,
  onUpgradeSkill
}) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [targetName, setTargetName] = useState<string>('');
  const [mode, setMode] = useState<string>('normal');

  if (!character) return null;

  const clsDef = CLASSES.find((c) => c.id === character.classId) || CLASSES[0];
  const raceDef = RACES.find((r) => r.id === character.raceId) || RACES[1];
  const allSkills: SkillDef[] = [...clsDef.skills, raceDef.racialSkill];
  const sp = character.skillPoints || 0;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95%]">

      {/* Popover Skill Menu (Opened via Button) */}
      {openMenu && (
        <div className="w-[340px] sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-xs text-white">สกิลของ {character.name.split('(')[0].trim()}</span>
              {sp > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  เหลือ {sp} SP อัปสกิลได้!
                </span>
              )}
            </div>
            <button onClick={() => setOpenMenu(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target & Roll Mode */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none w-full"
              >
                <option value="" className="bg-slate-900">ไม่ระบุเป้าหมาย</option>
                {party.filter((p) => p.id !== character.id).map((p) => (
                  <option key={p.id} value={p.name} className="bg-slate-900">{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              {[
                { id: 'normal', label: 'ปกติ' },
                { id: 'adv', label: 'Adv' },
                { id: 'dis', label: 'Dis' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-1 rounded font-bold transition ${
                    mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skill List */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scroll pr-1">
            {allSkills.map((sk) => {
              const lv = character.skillLevels?.[sk.id] || 1;
              const lvBonus = lv - 1;
              const noResource = sk.cost > 0 && (character.mp ?? 0) < sk.cost;
              return (
                <div
                  key={sk.id}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    noResource ? 'opacity-45 border-slate-800 bg-slate-950' : TYPE_ACCENT[sk.type] || TYPE_ACCENT.Utility
                  }`}
                >
                  <button
                    disabled={noResource}
                    onClick={() => {
                      onCastSkill(character.id, sk, targetName || null, mode);
                      setOpenMenu(false);
                    }}
                    className="flex-1 text-left cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span className="text-base">{sk.icon}</span>
                      <span>{sk.name.split('(')[0].trim()}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-amber-300 font-mono">Lv.{lv}</span>
                      {sk.cost > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                          {sk.cost} {character.resName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300/85 mt-0.5">{sk.desc}</p>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {sk.hitBonus !== null ? `Hit: d20+${sk.hitBonus + lvBonus}` : `ระยะ: ${sk.range}`}
                      {sk.dice ? ` • ${sk.dice}${lvBonus > 0 ? `+${lvBonus}` : ''} ${sk.effectLabel}` : ` • ${sk.effectLabel}`}
                    </div>
                  </button>

                  {sp > 0 && lv < 3 && (
                    <button
                      onClick={() => onUpgradeSkill(character.id, sk.id)}
                      className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0"
                      title="ใช้ 1 SP อัปเกรดสกิล"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" /> อัป
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimal Bottom Character Pill + Skill Menu Button */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white/80 overflow-hidden shrink-0"
            style={{ backgroundColor: character.color || '#6366f1' }}
          >
            {character.avatarUrl ? (
              <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              character.icon || '🧙'
            )}
          </div>
          <span className="font-bold text-xs text-white whitespace-nowrap">{character.name.split('(')[0].trim()}</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2.5 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-rose-300">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <button onClick={() => onUpdateHp(character.id, -1)} className="hover:text-white px-0.5">-</button>
            <span className="font-bold">{character.hp}/{character.maxHp}</span>
            <button onClick={() => onUpdateHp(character.id, 1)} className="hover:text-white px-0.5">+</button>
          </span>
          <span className="flex items-center gap-1 text-sky-300">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <button onClick={() => onUpdateResource(character.id, -1)} className="hover:text-white px-0.5">-</button>
            <span className="font-bold">{character.mp ?? 0}/{character.maxMp ?? 0}</span>
            <button onClick={() => onUpdateResource(character.id, 1)} className="hover:text-white px-0.5">+</button>
          </span>
        </div>

        <button
          onClick={() => setOpenMenu((v) => !v)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
            openMenu ? 'bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          สกิล {sp > 0 ? `(+${sp} SP)` : ''}
        </button>
      </div>
    </div>
  );
};
