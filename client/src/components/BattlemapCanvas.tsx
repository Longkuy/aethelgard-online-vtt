import React, { useState } from 'react';
import { ACTS } from '../data/aethelgard';
import { ZoomIn, ZoomOut, Grid, Crosshair } from 'lucide-react';

interface Token {
  id: string;
  label: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  type: 'party' | 'enemy' | 'npc';
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
  tokens: Token[];
  pings: Ping[];
  selectedCharId: string | null;
  onMoveToken: (tokenId: string, x: number, y: number) => void;
  onSelectToken: (tokenId: string) => void;
  onPingMap: (x: number, y: number) => void;
}

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  act,
  tokens,
  pings,
  selectedCharId,
  onMoveToken,
  onSelectToken,
  onPingMap
}) => {
  const [zoom, setZoom] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(25);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [pingMode, setPingMode] = useState(false);

  const scene = ACTS[act] || ACTS[1];

  const handleCellClick = (x: number, y: number) => {
    if (pingMode) {
      onPingMap(x, y);
      setPingMode(false);
      return;
    }

    const tokenHere = tokens.find((t) => t.x === x && t.y === y);
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

  return (
    <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
      {/* Top Floating Scene Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-lg">
          <div className="text-xs font-bold text-slate-100">{scene.title}</div>
          <div className="text-[11px] text-slate-400">{scene.badge} • คลิกหมากแล้วคลิกช่องเพื่อเดิน</div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1.5 shadow-lg text-xs">
          <button
            onClick={() => setPingMode(!pingMode)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition ${
              pingMode ? 'bg-amber-500 text-slate-950' : 'hover:bg-slate-800 text-slate-200'
            }`}
            title="ชี้ตำแหน่งบนแผนที่ให้เพื่อนเห็น"
          >
            <Crosshair className="w-3.5 h-3.5" /> Ping
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <Grid className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <input
            type="range"
            min={0}
            max={70}
            value={gridOpacity}
            onChange={(e) => setGridOpacity(Number(e.target.value))}
            className="w-16 accent-indigo-500"
            title="ความชัดตาราง"
          />
          <div className="h-4 w-px bg-slate-700" />
          <button onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))} className="p-1.5 rounded-lg hover:bg-slate-800">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} className="p-1.5 rounded-lg hover:bg-slate-800">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Map Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 pb-36 custom-scroll">
        <div
          className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-2xl transition-transform origin-center select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          <img src={scene.mapImg} alt={scene.title} className="absolute inset-0 w-full h-full object-cover" />

          {/* 16x9 Tactical Grid */}
          <div className="relative z-10 w-full h-full grid grid-cols-16 grid-rows-9">
            {Array.from({ length: 9 }).map((_, y) =>
              Array.from({ length: 16 }).map((__, x) => {
                const token = tokens.find((t) => t.x === x && t.y === y);
                const isMoving = token && activeTokenId === token.id;
                const isSelected = token && selectedCharId === token.id;
                const isMiasma = act === 3 && ((x >= 11 && x <= 13 && y >= 2 && y <= 4) || (x === 9 && y === 5));

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{ borderColor: `rgba(255,255,255,${gridOpacity / 100})` }}
                    className={`border relative flex items-center justify-center cursor-pointer transition hover:bg-white/15 ${
                      isMiasma ? 'bg-purple-600/20' : ''
                    } ${activeTokenId && !token ? 'hover:ring-1 hover:ring-emerald-400' : ''}`}
                  >
                    {token && (
                      <div
                        className={`w-[82%] h-[82%] rounded-full flex flex-col items-center justify-center shadow-xl border-2 transition-transform ${
                          isMoving
                            ? 'border-amber-300 ring-4 ring-amber-400/50 scale-115'
                            : isSelected
                            ? 'border-white ring-2 ring-indigo-400 scale-105'
                            : 'border-white/90 hover:scale-105'
                        }`}
                        style={{ backgroundColor: token.color }}
                      >
                        <span className="text-sm leading-none">{token.icon}</span>
                        <span className="text-[9px] font-bold text-white leading-none mt-0.5 drop-shadow truncate max-w-[90%]">
                          {token.label}
                        </span>
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
              className="absolute z-30 pointer-events-none"
              style={{
                left: `${((p.x + 0.5) / 16) * 100}%`,
                top: `${((p.y + 0.5) / 9) * 100}%`
              }}
            >
              <div
                className="w-12 h-12 rounded-full border-4 map-ping-ring"
                style={{ borderColor: p.color }}
              />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-bold text-white whitespace-nowrap">
                {p.senderName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
