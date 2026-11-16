import React, { useState } from 'react';
import { ACTS } from '../data/aethelgard';
import { Dices, Crown, PlusCircle, Shield, Sword, Backpack, Sparkles, Plus, X, User, Upload } from 'lucide-react';

interface CharacterAndDiceProps {
  character: any;
  act: string | number;
  isDM: boolean;
  onRollDice: (sides: number, mod: number, mode: string, label?: string) => void;
  onUpdateEquipment: (charId: string, equipment: any) => void;
  onSetAct: (act: string | number) => void;
  onSpawnEnemies: () => void;
  onSpawnCustom: (entity: { name: string; kind: 'enemy' | 'npc'; hp: number; ac: number; init: number; icon: string; avatarUrl?: string | null }) => void;
  onResetRoom: () => void;
}

const ENTITY_ICONS = ['👺', '🐺', '🐉', '🦇', '💀', '🧙', '🧝', '🍺', '👑', '🛡️'];
const STAT_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const CharacterAndDice: React.FC<CharacterAndDiceProps> = ({
  character,
  act,
  isDM,
  onRollDice,
  onUpdateEquipment,
  onSetAct,
  onSpawnEnemies,
  onSpawnCustom,
  onResetRoom
}) => {
  const [tab, setTab] = useState<'sheet' | 'dm'>(isDM ? 'dm' : 'sheet');
  const [mod, setMod] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [editingSlot, setEditingSlot] = useState<'weapon' | 'armor' | 'accessory' | null>(null);
  const [slotInput, setSlotInput] = useState('');

  // Custom Spawner state (DM Only)
  const [spName, setSpName] = useState('');
  const [spKind, setSpKind] = useState<'enemy' | 'npc'>('enemy');
  const [spHp, setSpHp] = useState(12);
  const [spAc, setSpAc] = useState(13);
  const [spInit, setSpInit] = useState(12);
  const [spIcon, setSpIcon] = useState('👺');
  const [spAvatarUrl, setSpAvatarUrl] = useState<string | null>(null);

  const activeTab = isDM ? tab : 'sheet';

  const equip = character?.equipment || {
    weapon: 'อาวุธเริ่มต้น',
    armor: 'ชุดนักผจญภัย',
    accessory: '—',
    bag: []
  };

  const handleSaveSlot = (slot: 'weapon' | 'armor' | 'accessory') => {
    if (!character) return;
    onUpdateEquipment(character.id, { ...equip, [slot]: slotInput.trim() || '—' });
    setEditingSlot(null);
  };

  const handleAddBagItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !newItem.trim()) return;
    onUpdateEquipment(character.id, { ...equip, bag: [...(equip.bag || []), newItem.trim()] });
    setNewItem('');
  };

  const handleRemoveBagItem = (idx: number) => {
    if (!character) return;
    const nextBag = [...(equip.bag || [])];
    nextBag.splice(idx, 1);
    onUpdateEquipment(character.id, { ...equip, bag: nextBag });
  };

  const handleSpawnAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setSpAvatarUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSpawnCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onSpawnCustom({
      name: spName.trim() || (spKind === 'enemy' ? 'มอนสเตอร์' : 'NPC'),
      kind: spKind,
      hp: spHp,
      ac: spAc,
      init: spInit,
      icon: spIcon,
      avatarUrl: spAvatarUrl
    });
    setSpName('');
    setSpAvatarUrl(null);
  };

  return (
    <aside className="w-76 bg-slate-900/95 border-l border-slate-800/80 flex flex-col shrink-0">
      {/* Top Tabs: Player only sees Character Sheet; DM sees DM Tools + Inspect */}
      <div className="flex border-b border-slate-800/80 text-xs font-bold">
        <button
          onClick={() => setTab('sheet')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'sheet' ? 'border-indigo-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" /> {isDM ? 'ข้อมูลตัวละคร' : 'ตัวละคร & ของสวมใส่'}
        </button>
        {isDM && (
          <button
            onClick={() => setTab('dm')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'dm' ? 'border-amber-500 text-amber-300 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> DM Tools
          </button>
        )}
      </div>

      {/* Quick Dice Tray (Always visible at top) */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/50 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-semibold"><Dices className="w-3.5 h-3.5 text-indigo-400" /> ทอยลูกเต๋า</span>
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

      {activeTab === 'sheet' ? (
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3 text-xs">
          {!character ? (
            <div className="text-center text-slate-500 py-10">
              ยังไม่มีตัวละครที่เลือก
            </div>
          ) : (
            <>
              {/* Character Header */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white/80 overflow-hidden shrink-0 shadow"
                  style={{ backgroundColor: character.color || '#6366f1' }}
                >
                  {character.avatarUrl ? (
                    <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    character.icon || '🧙'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate">{character.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{character.raceName}</div>
                  <div className="text-[11px] text-indigo-400 font-semibold truncate">{character.className}</div>
                </div>
              </div>

              {/* Core Combat Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">HP</div>
                  <div className="font-mono font-black text-sm text-emerald-400">{character.hp}/{character.maxHp}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">เกราะ (AC)</div>
                  <div className="font-mono font-black text-sm text-white">{character.ac || 12}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">{character.resName || 'Mana'}</div>
                  <div className="font-mono font-black text-sm text-sky-400">{character.mp ?? 0}/{character.maxMp ?? 0}</div>
                </div>
              </div>

              {/* 6 Ability Scores (Click to Roll Stat Check!) */}
              {character.stats && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>📊 ค่าพลัง (คลิกเพื่อทอยเช็ก)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {STAT_LABELS.map((lb, i) => {
                      const val = character.stats[i] ?? 10;
                      const statMod = Math.floor((val - 10) / 2);
                      return (
                        <button
                          key={lb}
                          onClick={() => onRollDice(20, statMod, 'normal', `${lb} Check`)}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 transition cursor-pointer"
                          title={`คลิกเพื่อทอย d20 ${statMod >= 0 ? `+${statMod}` : statMod}`}
                        >
                          <div className="text-[10px] font-bold text-slate-400">{lb}</div>
                          <div className="font-mono font-black text-sm text-white">{val}</div>
                          <div className="text-[10px] font-mono text-indigo-400">{statMod >= 0 ? `+${statMod}` : statMod}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Equipment Slots */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">⚔️ ของสวมใส่ (คลิกเพื่อแก้ไข)</div>
                {[
                  { key: 'weapon' as const, label: 'อาวุธ', icon: <Sword className="w-3.5 h-3.5 text-rose-400" />, val: equip.weapon },
                  { key: 'armor' as const, label: 'ชุดเกราะ', icon: <Shield className="w-3.5 h-3.5 text-sky-400" />, val: equip.armor },
                  { key: 'accessory' as const, label: 'เครื่องประดับ', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, val: equip.accessory }
                ].map((slot) => (
                  <div key={slot.key} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {editingSlot === slot.key ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={slotInput}
                          onChange={(e) => setSlotInput(e.target.value)}
                          autoFocus
                          className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSlot(slot.key)}
                        />
                        <button onClick={() => handleSaveSlot(slot.key)} className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">
                          บันทึก
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingSlot(slot.key); setSlotInput(slot.val || ''); }}
                        className="w-full flex items-center justify-between text-left hover:opacity-80"
                      >
                        <span className="flex items-center gap-1.5 text-slate-400 shrink-0">
                          {slot.icon} {slot.label}:
                        </span>
                        <span className="font-semibold text-slate-100 truncate ml-2">{slot.val || '—'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Inventory Bag */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Backpack className="w-3.5 h-3.5 text-emerald-400" /> กระเป๋าไอเทม
                </div>
                <div className="space-y-1">
                  {(equip.bag || []).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="truncate text-slate-200">{item}</span>
                      <button onClick={() => handleRemoveBagItem(idx)} className="text-slate-500 hover:text-rose-400 ml-2">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddBagItem} className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="เพิ่มไอเทม / เงิน..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      ) : (
        /* DM ONLY PANEL */
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-4 text-xs">
          <form onSubmit={handleSpawnCustom} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> เสก NPC / มอนสเตอร์กำหนดเอง
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => { setSpKind('enemy'); setSpIcon('👺'); }}
                className={`py-1.5 rounded-lg border font-bold ${spKind === 'enemy' ? 'bg-rose-600/25 border-rose-500 text-rose-300' : 'border-slate-800 text-slate-400'}`}
              >
                👺 มอนสเตอร์
              </button>
              <button
                type="button"
                onClick={() => { setSpKind('npc'); setSpIcon('🧑'); }}
                className={`py-1.5 rounded-lg border font-bold ${spKind === 'npc' ? 'bg-amber-600/25 border-amber-500 text-amber-300' : 'border-slate-800 text-slate-400'}`}
              >
                🧑 NPC
              </button>
            </div>

            <input
              type="text"
              value={spName}
              onChange={(e) => setSpName(e.target.value)}
              placeholder={spKind === 'enemy' ? 'ชื่อมอนสเตอร์ (เช่น ไวเวิร์นคลั่ง)' : 'ชื่อ NPC (เช่น พ่อค้าซิกกี้)'}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-amber-500"
            />

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                <div className="text-[10px] text-slate-400">HP</div>
                <input type="number" min={1} value={spHp} onChange={(e) => setSpHp(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                <div className="text-[10px] text-slate-400">AC</div>
                <input type="number" min={1} value={spAc} onChange={(e) => setSpAc(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                <div className="text-[10px] text-slate-400">Init</div>
                <input type="number" value={spInit} onChange={(e) => setSpInit(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {spAvatarUrl ? (
                  <img src={spAvatarUrl} alt="spawn-avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{spIcon}</span>
                )}
              </div>
              <div className="flex-1 flex items-center gap-1.5">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-semibold transition">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{spAvatarUrl ? 'เปลี่ยนรูป' : 'ใส่รูป'}</span>
                  <input type="file" accept="image/*" onChange={handleSpawnAvatarUpload} className="hidden" />
                </label>
                {spAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setSpAvatarUrl(null)}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 transition"
                    title="ลบรูป"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {ENTITY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSpIcon(ic)}
                  className={`w-6 h-6 rounded border text-xs ${spIcon === ic ? 'bg-amber-500 border-white' : 'bg-slate-900 border-slate-800'}`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <button type="submit" className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
              ✨ เสกลงกระดาน
            </button>
          </form>

          <div className="space-y-2">
            <div className="font-bold text-slate-300">🗺️ เปลี่ยนฉากแผนที่ (Scenes)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {[1, 2, 3, 'world'].map((a) => (
                <button
                  key={String(a)}
                  onClick={() => onSetAct(a)}
                  className={`text-left p-2 rounded-xl border transition ${
                    act === a ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{ACTS[a].title}</div>
                  <div className="text-[10px] text-slate-400">{ACTS[a].badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={onSpawnEnemies}
              className="w-full py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-bold"
            >
              🐺 เสกชุดมอนสเตอร์ Act 3 (ด่วน)
            </button>
            <button
              onClick={onResetRoom}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              ↺ รีเซ็ตห้องใหม่ทั้งหมด
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
