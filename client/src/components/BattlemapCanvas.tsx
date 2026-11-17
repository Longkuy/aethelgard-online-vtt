import React, { useState } from 'react';
import { ACTS } from '../data/aethelgard';
import { ZoomIn, ZoomOut, Grid, Crosshair, Ruler, EyeOff, CloudFog } from 'lucide-react';

interface Token {
  id: string;
  label: string;
  icon: string;
  avatarUrl?: string | null;
  color: string;
  x: number;
  y: number;
  type: 'party' | 'enemy' | 'npc';
  size?: 1 | 2 | 3;
  hidden?: boolean;
  conditions?: string[];
}

interface Ping {
  id: number;
  x: number;
  y: number;
  senderName: string;
  color: string;
}

interface BattlemapCanvasProps {
  act: string | number;
  customMapUrl?: string | null;
  customMapName?: string | null;
  fog?: string[];
  isDM: boolean;
  tokens: Token[];
  pings: Ping[];
  selectedCharId: string | null;
  onMoveToken: (tokenId: string, x: number, y: number) => void;
  onSelectToken: (tokenId: string) => void;
  onPingMap: (x: number, y: number) => void;
  onToggleFog?: (cells: string[], mode: 'add' | 'remove' | 'toggle') => void;
  onSetAllFog?: (enabled: boolean) => void;
}

const CONDITION_EMOJI: Record<string, string> = {
  Poisoned: '🤢',
  Stunned: '💫',
  Prone: '⬇️',
  Burn: '🔥',
  Frozen: '❄️',
  Buffed: '🛡️'
};

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  act,
  customMapUrl,
  customMapName,
  fog = [],
  isDM,
  tokens,
  pings,
  selectedCharId,
  onMoveToken,
  onSelectToken,
  onPingMap,
  onToggleFog,
  onSetAllFog
}) => {
  const [zoom, setZoom] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(18);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const [tool, setTool] = useState<'move' | 'ping' | 'ruler' | 'fog'>('move');
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerHover, setRulerHover] = useState<{ x: number; y: number } | null>(null);

  const scene = act === 'custom' && customMapUrl
    ? { title: customMapName || 'Custom Map', mapImg: customMapUrl }
    : ACTS[act] || ACTS[1];

  const fogSet = new Set(fog);

  // Filter tokens: normal players don't see hidden tokens or tokens standing in fog
  const visibleTokens = tokens.filter((t) => {
    if (isDM) return true;
    if (t.hidden) return false;
    if (fogSet.has(`${t.x}-${t.y}`)) return false;
    return true;
  });

  const handleCellClick = (x: number, y: number) => {
    if (tool === 'ping') {
      onPingMap(x, y);
      setTool('move');
      return;
    }

    if (tool === 'fog' && isDM && onToggleFog) {
      onToggleFog([`${x}-${y}`], 'toggle');
      return;
    }

    if (tool === 'ruler') {
      if (!rulerStart) {
        setRulerStart({ x, y });
        setRulerHover({ x, y });
      } else {
        setRulerStart(null);
        setRulerHover(null);
      }
      return;
    }

    // Move / Select mode
    const tokenHere = visibleTokens.find((t) => {
      const s = t.size || 1;
      return x >= t.x && x < t.x + s && y >= t.y && y < t.y + s;
    });

    if (tokenHere) {
      setActiveTokenId(activeTokenId === tokenHere.id ? null : tokenHere.id);
      onSelectToken(tokenHere.id);
      return;
    }

    if (activeTokenId) {
      onMoveToken(activeTokenId, x, y);
      setActiveTokenId(null);
    }
  };

  const rulerDistCells = rulerStart && rulerHover
    ? Math.max(Math.abs(rulerHover.x - rulerStart.x), Math.abs(rulerHover.y - rulerStart.y))
    : 0;

  return (
    <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
      {/* Floating Map Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-full px-2.5 py-1 shadow-xl text-xs">
        <button
          onClick={() => { setTool(tool === 'ping' ? 'move' : 'ping'); setRulerStart(null); }}
          className={`px-2 py-1 rounded-full flex items-center gap-1 font-medium transition ${
            tool === 'ping' ? 'bg-amber-500 text-slate-950' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="ชี้ตำแหน่งบนแผนที่"
        >
          <Crosshair className="w-3.5 h-3.5" /> Ping
        </button>
        <button
          onClick={() => { setTool(tool === 'ruler' ? 'move' : 'ruler'); setRulerStart(null); }}
          className={`px-2 py-1 rounded-full flex items-center gap-1 font-medium transition ${
            tool === 'ruler' ? 'bg-sky-500 text-slate-950' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="วัดระยะ (1 ช่อง = 5 ft)"
        >
          <Ruler className="w-3.5 h-3.5" /> วัดระยะ
        </button>

        {isDM && (
          <>
            <button
              onClick={() => { setTool(tool === 'fog' ? 'move' : 'fog'); setRulerStart(null); }}
              className={`px-2 py-1 rounded-full flex items-center gap-1 font-medium transition ${
                tool === 'fog' ? 'bg-purple-500 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="วาด/ลบหมอกบังแผนที่ (Fog of War)"
            >
              <CloudFog className="w-3.5 h-3.5" /> หมอก
            </button>
            {tool === 'fog' && onSetAllFog && (
              <div className="flex items-center gap-1 ml-0.5">
                <button
                  onClick={() => onSetAllFog(true)}
                  className="px-2 py-0.5 rounded-full bg-purple-600/40 hover:bg-purple-600 text-[10px] font-bold text-purple-200"
                >
                  บังทั้งหมด
                </button>
                <button
                  onClick={() => onSetAllFog(false)}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                >
                  เปิดทั้งหมด
                </button>
              </div>
            )}
          </>
        )}

        <div className="h-3.5 w-px bg-slate-700/70 mx-0.5" />
        <Grid className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="range"
          min={0}
          max={60}
          value={gridOpacity}
          onChange={(e) => setGridOpacity(Number(e.target.value))}
          className="w-12 accent-indigo-500"
          title="ความชัดตาราง"
        />
        <div className="h-3.5 w-px bg-slate-700/70 mx-0.5" />
        <button onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))} className="p-1 rounded-full hover:bg-slate-800 text-slate-300">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] w-9 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} className="p-1 rounded-full hover:bg-slate-800 text-slate-300">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ruler Distance Pill */}
      {tool === 'ruler' && (
        <div className="absolute top-14 right-3 z-20 px-3 py-1.5 rounded-xl bg-sky-950/90 border border-sky-500/60 text-xs font-bold text-sky-200 shadow-lg">
          {rulerStart
            ? `📏 ระยะ: ${rulerDistCells} ช่อง (${rulerDistCells * 5} ft) — คลิกอีกช่องเพื่อรีเซ็ต`
            : '📏 คลิกช่องเริ่มต้นเพื่อวัดระยะ'}
        </div>
      )}

      {/* Map Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 pb-28 custom-scroll">
        <div
          className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-transform origin-center select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          <img src={scene.mapImg} alt={scene.title} className="absolute inset-0 w-full h-full object-cover" />

          {/* 16x9 Tactical Grid */}
          <div className="relative z-10 w-full h-full grid grid-cols-16 grid-rows-9">
            {Array.from({ length: 9 }).map((_, y) =>
              Array.from({ length: 16 }).map((__, x) => {
                const cellKey = `${x}-${y}`;
                const isFogged = fogSet.has(cellKey);
                const isMiasma = act === 3 && ((x >= 11 && x <= 13 && y >= 2 && y <= 4) || (x === 9 && y === 5));
                const isRulerCell =
                  tool === 'ruler' &&
                  rulerStart &&
                  rulerHover &&
                  Math.max(Math.abs(x - rulerStart.x), Math.abs(y - rulerStart.y)) <= rulerDistCells &&
                  (x === rulerStart.x ||
                    y === rulerStart.y ||
                    Math.abs(x - rulerStart.x) === Math.abs(y - rulerStart.y) ||
                    (x === rulerHover.x && y === rulerHover.y));

                // Token anchored at top-left (x, y)
                const token = visibleTokens.find((t) => t.x === x && t.y === y);
                const isMoving = token && activeTokenId === token.id;
                const isSelected = token && selectedCharId === token.id;
                const tokenSize = token?.size || 1;

                return (
                  <div
                    key={cellKey}
                    onClick={() => handleCellClick(x, y)}
                    onMouseEnter={() => {
                      if (tool === 'ruler' && rulerStart) setRulerHover({ x, y });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragTokenId) {
                        onMoveToken(dragTokenId, x, y);
                        setDragTokenId(null);
                        setActiveTokenId(null);
                      }
                    }}
                    style={{ borderColor: `rgba(255,255,255,${gridOpacity / 100})` }}
                    className={`border relative flex items-center justify-center cursor-pointer transition hover:bg-white/10 ${
                      isMiasma ? 'bg-purple-600/20' : ''
                    } ${isRulerCell ? 'bg-sky-400/25 ring-1 ring-sky-400/50' : ''} ${
                      activeTokenId && !token ? 'hover:ring-1 hover:ring-emerald-400/70' : ''
                    }`}
                  >
                    {/* Fog of War Overlay */}
                    {isFogged && (
                      <div
                        className={`absolute inset-0 z-20 pointer-events-none ${
                          isDM ? 'bg-slate-950/60 border border-purple-500/30' : 'bg-slate-950'
                        }`}
                      />
                    )}

                    {/* Token (supports 1x1, 2x2, 3x3 sizes) */}
                    {token && (
                      <div
                        draggable={tool === 'move'}
                        onDragStart={() => setDragTokenId(token.id)}
                        style={{
                          backgroundColor: token.color,
                          width: tokenSize > 1 ? `${tokenSize * 100 - 12}%` : '82%',
                          height: tokenSize > 1 ? `${tokenSize * 100 - 12}%` : '82%',
                          top: tokenSize > 1 ? '6%' : undefined,
                          left: tokenSize > 1 ? '6%' : undefined
                        }}
                        className={`${
                          tokenSize > 1 ? 'absolute z-15' : 'relative z-10'
                        } rounded-full flex flex-col items-center justify-center shadow-lg border-2 overflow-visible transition-transform ${
                          token.hidden ? 'opacity-50 border-dashed' : ''
                        } ${
                          isMoving
                            ? 'border-amber-300 ring-4 ring-amber-400/50 scale-110'
                            : isSelected
                            ? 'border-white ring-2 ring-indigo-400 scale-105'
                            : 'border-white/90 hover:scale-105'
                        }`}
                        title={token.label}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {token.avatarUrl ? (
                            <img src={token.avatarUrl} alt={token.label} className="w-full h-full object-cover pointer-events-none" />
                          ) : (
                            <>
                              <span className={`${tokenSize > 1 ? 'text-2xl' : 'text-sm'} leading-none`}>{token.icon}</span>
                              <span className="text-[9px] font-bold text-white leading-none mt-0.5 drop-shadow truncate max-w-[90%]">
                                {token.label}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Hidden badge for DM */}
                        {token.hidden && isDM && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center">
                            <EyeOff className="w-2.5 h-2.5 text-amber-300" />
                          </span>
                        )}

                        {/* Condition Badges */}
                        {token.conditions && token.conditions.length > 0 && (
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 bg-slate-950/90 border border-slate-700 rounded-full px-1 py-0.25 text-[9px] leading-none shadow">
                            {token.conditions.slice(0, 3).map((cond) => (
                              <span key={cond} title={cond}>{CONDITION_EMOJI[cond] || '⚡'}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Animated Pings Layer */}
          {pings.map((p) => (
            <div
              key={p.id}
              style={{
                left: `${((p.x + 0.5) / 16) * 100}%`,
                top: `${((p.y + 0.5) / 9) * 100}%`
              }}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full border-4 animate-ping opacity-75" style={{ borderColor: p.color }} />
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-bold text-white whitespace-nowrap text-center">
                {p.senderName}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
