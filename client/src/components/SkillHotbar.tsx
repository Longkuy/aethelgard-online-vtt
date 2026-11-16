import React, { useState } from 'react';
import { CLASSES, RACES, SkillDef } from '../data/aethelgard';
import { Heart, Zap, Target, Shield } from 'lucide-react';

interface SkillHotbarProps {
  character: any;
  party: any[];
  onCastSkill: (charId: string, skill: SkillDef, targetName: string | null, mode: string) => void;
  onUpdateHp: (charId: string, delta: number) => void;
  onUpdateResource: (charId: string, delta: number) => void;
}

const TYPE_STYLES: Record<string, string> = {
  Attack: 'border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-200',
  Heal: 'border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200',
  Buff: 'border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200',
  Utility: 'border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200'
};

const TYPE_BADGE: Record<string, string> = {
  Attack: 'bg-rose-500/20 text-rose-300',
  Heal: 'bg-emerald-500/20 text-emerald-300',
  Buff: 'bg-amber-500/20 text-amber-300',
  Utility: 'bg-indigo-500/20 text-indigo-300'
};

export const SkillHotbar: React.FC<SkillHotbarProps> = ({
  character,
  party,
  onCastSkill,
  onUpdateHp,
  onUpdateResource
}) => {
  const [targetName, setTargetName] = useState<string>('');
  const [mode, setMode] = useState<string>('normal');

  if (!character) {
    return (
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-400">
        คลิกเลือกตัวละครในปาร์ตี้ด้านซ้าย หรือคลิกที่หมากบนแผนที่ เพื่อเปิดแถบสกิล (Skill Hotbar)
      </div>
    );
  }

  const clsDef = CLASSES.find((c) => c.id === character.classId) || CLASSES[0];
  const raceDef = RACES.find((r) => r.id === character.raceId) || RACES[1];
  const allSkills: (SkillDef & { isRacial?: boolean })[] = [
    ...clsDef.skills,
    { ...raceDef.racialSkill, isRacial: true }
  ];

  const hpPct = Math.max(0, Math.min(100, Math.round((character.hp / character.maxHp) * 100)));
  const mpPct = character.maxMp ? Math.max(0, Math.min(100, Math.round(((character.mp || 0) / character.maxMp) * 100))) : 0;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-700/80 px-4 py-2.5 shadow-2xl z-30">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center gap-3">

        {/* Left: Character Status Card */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 lg:w-72 shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 border-white/80 shadow shrink-0"
            style={{ backgroundColor: character.color || '#6366f1' }}
          >
            {character.icon || '🧙'}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-xs text-white truncate">{character.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono flex items-center gap-0.5 shrink-0">
                <Shield className="w-2.5 h-2.5" /> {character.ac || 12}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <Heart className="w-3 h-3 text-rose-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${hpPct}%` }} />
              </div>
              <div className="flex items-center gap-0.5 font-mono">
                <button onClick={() => onUpdateHp(character.id, -1)} className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700">-</button>
                <span className="w-9 text-center font-bold">{character.hp}/{character.maxHp}</span>
                <button onClick={() => onUpdateHp(character.id, 1)} className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700">+</button>
              </div>
            </div>

            {/* Mana / Aura / Faith Bar */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <Zap className="w-3 h-3 text-sky-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{ width: `${mpPct}%` }} />
              </div>
              <div className="flex items-center gap-0.5 font-mono">
                <button onClick={() => onUpdateResource(character.id, -1)} className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700">-</button>
                <span className="w-9 text-center font-bold">{character.mp ?? 0}/{character.maxMp ?? 0}</span>
                <button onClick={() => onUpdateResource(character.id, 1)} className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Target & Advantage Quick Controls */}
        <div className="flex lg:flex-col gap-1.5 shrink-0 text-[11px]">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none max-w-[120px]"
            >
              <option value="" className="bg-slate-900">ไม่ระบุเป้าหมาย</option>
              {party.filter((p) => p.id !== character.id).map((p) => (
                <option key={p.id} value={p.name} className="bg-slate-900">
                  {p.isEnemy ? '🎯 ' : '🤝 '} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {[
              { id: 'normal', label: 'ปกติ' },
              { id: 'adv', label: 'Adv' },
              { id: 'dis', label: 'Dis' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Easy-to-Understand Skill Cards */}
        <div className="flex-1 flex gap-2 overflow-x-auto custom-scroll pb-1">
          {allSkills.map((sk) => {
            const noResource = sk.cost > 0 && (character.mp ?? 0) < sk.cost;
            return (
              <button
                key={sk.id}
                disabled={noResource}
                onClick={() => onCastSkill(character.id, sk, targetName || null, mode)}
                className={`group relative min-w-[185px] max-w-[210px] text-left p-2.5 rounded-xl border transition shrink-0 cursor-pointer ${
                  noResource
                    ? 'opacity-45 border-slate-800 bg-slate-950 cursor-not-allowed'
                    : TYPE_STYLES[sk.type] || TYPE_STYLES.Utility
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                    <span className="text-base">{sk.icon}</span>
                    <span className="truncate">{sk.name.split('(')[0]}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${TYPE_BADGE[sk.type]}`}>
                    {sk.cost === 0 ? 'ฟรี' : `${sk.cost} ${character.resName}`}
                  </span>
                </div>

                <p className="text-[10px] text-slate-300/85 mt-1 line-clamp-2 leading-snug">{sk.desc}</p>

                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300">
                    {sk.hitBonus !== null ? `d20+${sk.hitBonus}` : sk.range}
                  </span>
                  <span className="font-bold text-white">
                    {sk.dice ? `${sk.dice} ${sk.effectLabel}` : sk.effectLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
