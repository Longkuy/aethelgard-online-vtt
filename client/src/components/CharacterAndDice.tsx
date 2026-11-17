import React, { useState } from 'react';
import { ACTS } from '../data/aethelgard';
import { Dices, Crown, PlusCircle, Backpack, Plus, X, User, Upload, Edit3, Download, Map } from 'lucide-react';

interface CharacterAndDiceProps {
  character: any;
  act: string | number;
  customMapName?: string | null;
  isDM: boolean;
  onRollDice: (sides: number, mod: number, mode: string, label?: string) => void;
  onUpdateEquipment: (charId: string, equipment: any) => void;
  onEditStats: (charId: string, patch: { ac?: number; maxHp?: number; hp?: number; stats?: number[] }) => void;
  onToggleCondition: (charId: string, condition: string) => void;
  onSetTokenSize: (charId: string, size: 1 | 2 | 3) => void;
  onGrantSp: (charId: string | 'ALL', amount: number) => void;
  onSetAct: (act: string | number) => void;
  onSetCustomMap: (mapUrl: string, mapName: string) => void;
  onSpawnEnemies: () => void;
  onSpawnCustom: (entity: { name: string; kind: 'enemy' | 'npc'; hp: number; ac: number; init: number; icon: string; avatarUrl?: string | null; size?: 1 | 2 | 3; hidden?: boolean }) => void;
  onResetRoom: () => void;
  onExportRoom: () => void;
  onImportRoom: (state: any) => void;
}

const ENTITY_ICONS = ['👺', '🐺', '🐉', '🦇', '💀', '🧙', '🧝', '🍺', '👑', '🛡️'];
const STAT_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ITEM_ICONS = ['🧪', '🍖', '⚔️', '🛡️', '💍', '🗝️', '📜', '💎', '🔥', '🎒'];
const CONDITIONS = [
  { id: 'Poisoned', label: 'พิษ', emoji: '🤢' },
  { id: 'Stunned', label: 'มึนงง', emoji: '💫' },
  { id: 'Prone', label: 'ล้ม', emoji: '⬇️' },
  { id: 'Burn', label: 'ไฟไหม้', emoji: '🔥' },
  { id: 'Frozen', label: 'แช่แข็ง', emoji: '❄️' },
  { id: 'Buffed', label: 'บัฟ', emoji: '🛡️' }
];
const EQUIP_SLOTS = [
  { key: 'head' as const, label: 'หมวก/ศีรษะ', emoji: '🪖' },
  { key: 'weapon' as const, label: 'อาวุธหลัก', emoji: '⚔️' },
  { key: 'offhand' as const, label: 'มือรอง/โล่', emoji: '🛡️' },
  { key: 'armor' as const, label: 'ชุดเกราะ', emoji: '🥋' },
  { key: 'accessory' as const, label: 'เครื่องประดับ', emoji: '💍' },
  { key: 'boots' as const, label: 'รองเท้า', emoji: '🥾' }
];
type EquipSlotKey = typeof EQUIP_SLOTS[number]['key'];
type BagItem = { id: string; name: string; icon: string; qty: number };
const BAG_CAPACITY = 12;

export const CharacterAndDice: React.FC<CharacterAndDiceProps> = ({
  character,
  act,
  customMapName,
  isDM,
  onRollDice,
  onUpdateEquipment,
  onEditStats,
  onToggleCondition,
  onSetTokenSize,
  onGrantSp,
  onSetAct,
  onSetCustomMap,
  onSpawnEnemies,
  onSpawnCustom,
  onResetRoom,
  onExportRoom,
  onImportRoom
}) => {
  const [tab, setTab] = useState<'sheet' | 'dm'>(isDM ? 'dm' : 'sheet');
  const [mod, setMod] = useState(0);

  // Edit stats state
  const [editingStats, setEditingStats] = useState(false);
  const [editHp, setEditHp] = useState(10);
  const [editMaxHp, setEditMaxHp] = useState(10);
  const [editAc, setEditAc] = useState(12);
  const [editStatArr, setEditStatArr] = useState<number[]>([10, 10, 10, 10, 10, 10]);

  // Equipment & Bag Slot UI state
  const [editingSlot, setEditingSlot] = useState<EquipSlotKey | null>(null);
  const [slotInput, setSlotInput] = useState('');
  const [selectedBagIdx, setSelectedBagIdx] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('🧪');
  const [newItemQty, setNewItemQty] = useState(1);

  // Custom Spawner state (DM Only)
  const [spName, setSpName] = useState('');
  const [spKind, setSpKind] = useState<'enemy' | 'npc'>('enemy');
  const [spHp, setSpHp] = useState(12);
  const [spAc, setSpAc] = useState(13);
  const [spInit, setSpInit] = useState(12);
  const [spIcon, setSpIcon] = useState('👺');
  const [spAvatarUrl, setSpAvatarUrl] = useState<string | null>(null);
  const [spSize, setSpSize] = useState<1 | 2 | 3>(1);
  const [spHidden, setSpHidden] = useState(false);

  const activeTab = isDM ? tab : 'sheet';

  const equip = character?.equipment || {
    head: '',
    weapon: 'อาวุธเริ่มต้น',
    offhand: '',
    armor: 'ชุดนักผจญภัย',
    accessory: '',
    boots: '',
    gold: 0,
    bag: []
  };

  // Normalize legacy string bag items into structured BagItem objects
  const normalizedBag: (BagItem | null)[] = Array.from({ length: BAG_CAPACITY }, (_, idx) => {
    const raw = (equip.bag || [])[idx];
    if (!raw) return null;
    if (typeof raw === 'string') {
      return { id: `legacy_${idx}`, name: raw, icon: '🎒', qty: 1 };
    }
    return raw;
  });

  const compactBag = (slots: (BagItem | null)[]) => slots.filter((s): s is BagItem => s !== null);

  const handleSaveSlot = (slot: EquipSlotKey) => {
    if (!character) return;
    onUpdateEquipment(character.id, { ...equip, [slot]: slotInput.trim() });
    setEditingSlot(null);
  };

  const handleClearSlot = (slot: EquipSlotKey) => {
    if (!character) return;
    onUpdateEquipment(character.id, { ...equip, [slot]: '' });
    setEditingSlot(null);
  };

  const handleAdjustGold = (delta: number) => {
    if (!character) return;
    const nextGold = Math.max(0, (Number(equip.gold) || 0) + delta);
    onUpdateEquipment(character.id, { ...equip, gold: nextGold });
  };

  const handleSaveBagSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || selectedBagIdx === null || !newItemName.trim()) return;
    const nextSlots = [...normalizedBag];
    nextSlots[selectedBagIdx] = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      name: newItemName.trim(),
      icon: newItemIcon,
      qty: Math.max(1, newItemQty)
    };
    onUpdateEquipment(character.id, { ...equip, bag: compactBag(nextSlots) });
    setSelectedBagIdx(null);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleBagQty = (idx: number, delta: number) => {
    if (!character) return;
    const nextSlots = [...normalizedBag];
    const item = nextSlots[idx];
    if (!item) return;
    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      nextSlots[idx] = null;
      setSelectedBagIdx(null);
    } else {
      nextSlots[idx] = { ...item, qty: nextQty };
    }
    onUpdateEquipment(character.id, { ...equip, bag: compactBag(nextSlots) });
  };

  const handleRemoveBagItem = (idx: number) => {
    if (!character) return;
    const nextSlots = [...normalizedBag];
    nextSlots[idx] = null;
    onUpdateEquipment(character.id, { ...equip, bag: compactBag(nextSlots) });
    setSelectedBagIdx(null);
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

  const handleCustomMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1280;
        const maxH = 720;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onSetCustomMap(canvas.toDataURL('image/jpeg', 0.75), file.name.replace(/\.[^.]+$/, ''));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        onImportRoom(parsed);
      } catch {
        // invalid JSON ignored
      }
    };
    reader.readAsText(file);
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
      avatarUrl: spAvatarUrl,
      size: spSize,
      hidden: spHidden
    });
    setSpName('');
    setSpAvatarUrl(null);
    setSpSize(1);
    setSpHidden(false);
  };

  return (
    <aside className="w-[92vw] sm:w-80 md:w-76 bg-slate-900/95 border-l border-slate-800/80 flex flex-col shrink-0">
      {/* Top Tabs: Player only sees Character Sheet; DM sees DM Tools + Inspect */}
      <div className="flex border-b border-slate-800/80 text-xs font-bold">
        <button
          onClick={() => setTab('sheet')}
          className={`flex-1 py-3 md:py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'sheet' ? 'border-indigo-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" /> {isDM ? 'ข้อมูลตัวละคร' : 'ตัวละคร & ของสวมใส่'}
        </button>
        {isDM && (
          <button
            onClick={() => setTab('dm')}
            className={`flex-1 py-3 md:py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
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
          <div className="flex items-center gap-1.5">
            <span>Mod:</span>
            <button onClick={() => setMod((m) => m - 1)} className="w-7 h-7 md:w-5 md:h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold">-</button>
            <span className="w-6 text-center font-mono font-bold text-white">{mod >= 0 ? `+${mod}` : mod}</span>
            <button onClick={() => setMod((m) => m + 1)} className="w-7 h-7 md:w-5 md:h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold">+</button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5 md:gap-1 text-xs md:text-[11px] font-bold font-mono">
          {[4, 6, 8, 10, 12, 20].map((d) => (
            <button
              key={d}
              onClick={() => onRollDice(d, mod, 'normal')}
              className={`py-2.5 md:py-1.5 rounded-lg border transition cursor-pointer ${
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
              <div className="space-y-1.5">
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

                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingStats) {
                        setEditHp(character.hp ?? 10);
                        setEditMaxHp(character.maxHp ?? 10);
                        setEditAc(character.ac ?? 12);
                        setEditStatArr(character.stats ? [...character.stats] : [10, 10, 10, 10, 10, 10]);
                      }
                      setEditingStats((v) => !v);
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1 transition"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" /> {editingStats ? 'ปิดการแก้ไข' : 'แก้ HP / AC / ค่าพลัง'}
                  </button>
                  {isDM && (
                    <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                      {([1, 2, 3] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => onSetTokenSize(character.id, sz)}
                          className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                            (character.size || 1) === sz ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                          title={`ขนาด Token ${sz}x${sz}`}
                        >
                          {sz}x{sz}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {editingStats && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/60 space-y-2">
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <div className="text-[10px] text-slate-400">HP</div>
                        <input type="number" min={0} value={editHp} onChange={(e) => setEditHp(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <div className="text-[10px] text-slate-400">MaxHP</div>
                        <input type="number" min={1} value={editMaxHp} onChange={(e) => setEditMaxHp(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <div className="text-[10px] text-slate-400">AC</div>
                        <input type="number" min={1} value={editAc} onChange={(e) => setEditAc(Number(e.target.value))} className="w-full text-center bg-transparent font-mono font-bold" />
                      </div>
                    </div>
                    {character.stats && (
                      <div className="grid grid-cols-3 gap-1 text-center">
                        {STAT_LABELS.map((lb, idx) => (
                          <div key={lb} className="bg-slate-900 border border-slate-800 rounded-lg p-1">
                            <div className="text-[9px] text-slate-400">{lb}</div>
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={editStatArr[idx] ?? 10}
                              onChange={(e) => {
                                const next = [...editStatArr];
                                next[idx] = Number(e.target.value);
                                setEditStatArr(next);
                              }}
                              className="w-full text-center bg-transparent font-mono font-bold text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onEditStats(character.id, {
                          hp: editHp,
                          maxHp: editMaxHp,
                          ac: editAc,
                          stats: character.stats ? editStatArr : undefined
                        });
                        setEditingStats(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      บันทึกค่าพลัง
                    </button>
                  </div>
                )}
              </div>

              {/* Status Conditions */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">⚡ สถานะ (Conditions)</div>
                <div className="flex flex-wrap gap-1">
                  {CONDITIONS.map((cond) => {
                    const active = (character.conditions || []).includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => onToggleCondition(character.id, cond.id)}
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold transition ${
                          active
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {cond.emoji} {cond.label}
                      </button>
                    );
                  })}
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

              {/* Equipment Slots (6-Slot RPG Grid) */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">⚔️ ช่องสวมใส่ (คลิกช่องเพื่อใส่/เปลี่ยน)</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {EQUIP_SLOTS.map((slot) => {
                    const val = (equip[slot.key] as string) || '';
                    const isEditing = editingSlot === slot.key;
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingSlot(null);
                          } else {
                            setEditingSlot(slot.key);
                            setSlotInput(val);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isEditing
                            ? 'bg-indigo-950/60 border-indigo-500'
                            : val
                            ? 'bg-slate-950 border-slate-700/80 hover:border-indigo-500/70'
                            : 'bg-slate-950/50 border-dashed border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none shrink-0">{slot.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-slate-400 leading-tight">{slot.label}</div>
                            <div className={`text-[11px] font-semibold truncate ${val ? 'text-slate-100' : 'text-slate-600 italic'}`}>
                              {val || 'ว่าง'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {editingSlot && (
                  <div className="p-2 rounded-xl bg-slate-950 border border-indigo-500/70 space-y-1.5">
                    <div className="text-[10px] text-indigo-300 font-semibold">
                      แก้ไขช่อง: {EQUIP_SLOTS.find((s) => s.key === editingSlot)?.label}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={slotInput}
                        onChange={(e) => setSlotInput(e.target.value)}
                        autoFocus
                        placeholder="ชื่อไอเทมสวมใส่..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSlot(editingSlot)}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveSlot(editingSlot)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                      >
                        ใส่
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearSlot(editingSlot)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white"
                        title="ถอดออก"
                      >
                        ถอด
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gold Purse */}
              <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-950 border border-amber-500/30">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span>💰</span>
                  <span className="font-mono text-sm">{Number(equip.gold) || 0}</span>
                  <span className="text-[10px] text-amber-400/80 font-normal">Gold</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button onClick={() => handleAdjustGold(-1)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">-1</button>
                  <button onClick={() => handleAdjustGold(1)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300">+1</button>
                  <button onClick={() => handleAdjustGold(5)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300">+5</button>
                </div>
              </div>

              {/* Inventory Bag (12-Slot RPG Grid) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Backpack className="w-3.5 h-3.5 text-emerald-400" /> สล็อตกระเป๋า ({compactBag(normalizedBag).length}/{BAG_CAPACITY})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {normalizedBag.map((item, idx) => {
                    const isSelected = selectedBagIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBagIdx(null);
                          } else {
                            setSelectedBagIdx(idx);
                            setNewItemName(item?.name || '');
                            setNewItemIcon(item?.icon || '🧪');
                            setNewItemQty(item?.qty || 1);
                          }
                        }}
                        title={item ? `${item.name} (x${item.qty})` : `ช่องว่าง #${idx + 1} (คลิกเพื่อเพิ่ม)`}
                        className={`relative h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400/50'
                            : item
                            ? 'bg-slate-950 border-slate-700/80 hover:border-emerald-500/70'
                            : 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-600 text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {item ? (
                          <>
                            <span className="text-lg leading-none">{item.icon}</span>
                            <span className="text-[9px] text-slate-300 truncate w-full text-center mt-0.5 px-0.5">
                              {item.name}
                            </span>
                            {item.qty > 1 && (
                              <span className="absolute top-0.5 right-1 text-[9px] font-mono font-bold text-emerald-300 bg-slate-900/90 px-1 rounded">
                                x{item.qty}
                              </span>
                            )}
                          </>
                        ) : (
                          <Plus className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Bag Slot Actions / Editor */}
                {selectedBagIdx !== null && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/60 space-y-2">
                    {normalizedBag[selectedBagIdx] ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-slate-100 truncate">
                            <span className="text-base">{normalizedBag[selectedBagIdx]!.icon}</span>
                            <span className="truncate">{normalizedBag[selectedBagIdx]!.name}</span>
                            <span className="text-[11px] font-mono text-emerald-400">x{normalizedBag[selectedBagIdx]!.qty}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBagIdx(null)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleBagQty(selectedBagIdx, -1)}
                            className="py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40"
                          >
                            ใช้ (-1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBagQty(selectedBagIdx, 1)}
                            className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                          >
                            เพิ่ม (+1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBagItem(selectedBagIdx)}
                            className="py-1 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/40"
                          >
                            ทิ้ง
                          </button>
                        </div>
                      </>
                    ) : (
                      <form onSubmit={handleSaveBagSlot} className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                          <span>เพิ่มไอเทมลงสล็อต #{selectedBagIdx + 1}</span>
                          <button type="button" onClick={() => setSelectedBagIdx(null)} className="text-slate-500 hover:text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ITEM_ICONS.map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => setNewItemIcon(ic)}
                              className={`w-6 h-6 rounded border text-xs ${
                                newItemIcon === ic ? 'bg-emerald-600 border-white' : 'bg-slate-900 border-slate-800'
                              }`}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            autoFocus
                            placeholder="ชื่อไอเทม..."
                            className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="number"
                            min={1}
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Number(e.target.value))}
                            className="w-12 px-1.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center font-mono"
                            title="จำนวน"
                          />
                          <button type="submit" className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                            ใส่
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
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

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">ขนาด:</span>
                {([1, 2, 3] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSpSize(sz)}
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${
                      spSize === sz ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {sz}x{sz}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spHidden}
                  onChange={(e) => setSpHidden(e.target.checked)}
                  className="accent-amber-500"
                />
                <span>🙈 ซ่อนตัวก่อน</span>
              </label>
            </div>

            <button type="submit" className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
              ✨ เสกลงกระดาน
            </button>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">🗺️ เปลี่ยนฉากแผนที่ (Scenes)</span>
              <label className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer">
                <Map className="w-3 h-3" /> อัปโหลดแผนที่
                <input type="file" accept="image/*" onChange={handleCustomMapUpload} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {act === 'custom' && customMapName && (
                <div className="p-2 rounded-xl border bg-amber-600/20 border-amber-500 text-amber-200">
                  <div className="font-bold">🖼️ {customMapName}</div>
                  <div className="text-[10px] text-amber-300/80">แผนที่อัปโหลดเอง</div>
                </div>
              )}
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
              onClick={() => onGrantSp('ALL', 1)}
              className="w-full py-2 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 font-bold"
            >
              ⬆️ แจก +1 Skill Point ให้ปาร์ตี้
            </button>
            <button
              onClick={onSpawnEnemies}
              className="w-full py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-bold"
            >
              🐺 เสกชุดมอนสเตอร์ Act 3 (ด่วน)
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onExportRoom}
                className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> เซฟไฟล์ห้อง
              </button>
              <label className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-sky-400" /> โหลดไฟล์ห้อง
                <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
            <button
              onClick={onResetRoom}
              className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold"
            >
              ↺ รีเซ็ตห้องใหม่ทั้งหมด
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
