import React, { useState } from 'react';
import { CLASSES, RACES, SkillDef } from '../data/aethelgard';
import { Heart, Zap, Target } from 'lucide-react';

interface SkillHotbarProps {
  character: any;
  party: any[];
  onCastSkill: (charId: string, skill: SkillDef, targetName: string | null, mode: string) => void;
  onUpdateHp: (charId: string, delta: number) => void;
  onUpdateResource: (charId: string, delta: number) => void;
}

const TYPE_ACCENT: Record<string, string> = {
  Attack: 'border-rose-500/30 hover:border-rose-400/70 hover:bg-rose-950/40',
  Heal: 'border-emerald-500/30 hover:border-emerald-400/70 hover:bg-emerald-950/40',
  Buff: 'border-amber-500/30 hover:border-amber-400/70 hover:bg-amber-950/40',
  Utility: 'border-indigo-500/30 hover:border-indigo-400/70 hover:bg-indigo-950/40'
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

  if (!character) return null;

  const clsDef = CLASSES.find((c) => c.id === character.classId) || CLASSES[0];
  const raceDef = RACES.find((r) => r.id === character.raceId) || RACES[1];
  const allSkills: SkillDef[] = [...clsDef.skills, raceDef.racialSkill];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[96%] w-max">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-3">

        {/* Compact Character Pill */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800 shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-white/80 shadow"
            style={{ backgroundColor: character.color || '#6366f1' }}
          >
            {character.icon || '🧙'}
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-white leading-none">{character.name.split('(')[0].trim()}</div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-rose-300">
                <Heart className="w-3 h-3 text-rose-400" />
                <button onClick={() => onUpdateHp(character.id, -1)} className="hover:text-white px-0.5">-</button>
                <span className="font-bold">{character.hp}/{character.maxHp}</span>
                <button onClick={() => onUpdateHp(character.id, 1)} className="hover:text-white px-0.5">+</button>
              </span>
              <span className="flex items-center gap-1 text-sky-300">
                <Zap className="w-3 h-3 text-sky-400" />
                <button onClick={() => onUpdateResource(character.id, -1)} className="hover:text-white px-0.5">-</button>
                <span className="font-bold">{character.mp ?? 0}/{character.maxMp ?? 0}</span>
                <button onClick={() => onUpdateResource(character.id, 1)} className="hover:text-white px-0.5">+</button>
              </span>
            </div>
          </div>
        </div>

        {/* Sleek Skill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll max-w-[520px]">
          {allSkills.map((sk) => {
            const noResource = sk.cost > 0 && (character.mp ?? 0) < sk.cost;
            return (
              <button
                key={sk.id}
                disabled={noResource}
                title={sk.desc}
                onClick={() => onCastSkill(character.id, sk, targetName || null, mode)}
                className={`px-2.5 py-1.5 rounded-xl border bg-slate-950/70 transition shrink-0 text-left cursor-pointer ${
                  noResource ? 'opacity-40 border-slate-800 cursor-not-allowed' : TYPE_ACCENT[sk.type] || TYPE_ACCENT.Utility
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 whitespace-nowrap">
                  <span>{sk.icon}</span>
                  <span>{sk.name.split('(')[0].trim()}</span>
                  {sk.cost > 0 && (
                    <span className="text-[10px] px-1 rounded bg-sky-500/20 text-sky-300 font-mono">{sk.cost}</span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                  {sk.dice ? `${sk.dice} ${sk.effectLabel}` : sk.effectLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Target & Mode */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-800 shrink-0 text-[11px]">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none max-w-[110px]"
          >
            <option value="">เป้าหมาย</option>
            {party.filter((p) => p.id !== character.id).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => setMode(mode === 'normal' ? 'adv' : mode === 'adv' ? 'dis' : 'normal')}
            className={`px-2 py-1 rounded-lg font-bold border transition ${
              mode === 'adv'
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : mode === 'dis'
                ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="สลับโหมดทอย: ปกติ / Advantage / Disadvantage"
          >
            {mode === 'normal' ? 'ปกติ' : mode === 'adv' ? 'Adv' : 'Dis'}
          </button>
        </div>
      </div>
    </div>
  );
};
