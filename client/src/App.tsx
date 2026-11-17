import { useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Lobby } from './components/Lobby';
import { BattlemapCanvas } from './components/BattlemapCanvas';
import { SkillHotbar } from './components/SkillHotbar';
import { TurnTracker } from './components/TurnTracker';
import { CharacterAndDice } from './components/CharacterAndDice';
import { DiceRollOverlay } from './components/DiceRollOverlay';
import { SkillDef } from './data/aethelgard';
import { createInitialRoomState, applyRoomAction } from './lib/roomEngine';
import { Share2, LogOut, Swords, Check, PanelLeft, PanelRight, ScrollText, X } from 'lucide-react';

export function App() {
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<DataConnection[]>([]);
  const hostConnRef = useRef<DataConnection | null>(null);
  const roomStateRef = useRef<any>(null);

  const [roomState, setRoomState] = useState<any>(null);
  const [session, setSession] = useState<{ roomId: string; playerName: string; role: 'dm' | 'player'; myCharId: string | null } | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [pings, setPings] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [connectingMsg, setConnectingMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLeft, setShowLeft] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));
  const [showRight, setShowRight] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));
  const [showLog, setShowLog] = useState(false);

  const urlRoom = new URLSearchParams(window.location.search).get('room') || 'AETHEL';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const triggerPing = (ping: any) => {
    setPings((prev) => [...prev, ping]);
    setTimeout(() => {
      setPings((prev) => prev.filter((p) => p.id !== ping.id));
    }, 1500);
  };

  const broadcastState = (nextState: any) => {
    roomStateRef.current = nextState;
    setRoomState(nextState);
    try {
      localStorage.setItem(`aethelgard_room_${nextState.roomId}`, JSON.stringify(nextState));
    } catch {
      // ignore storage quota errors
    }
    connsRef.current.forEach((c) => {
      if (c.open) c.send({ type: 'room_state', state: nextState });
    });
  };

  const handleExportRoom = () => {
    if (!roomStateRef.current) return;
    const blob = new Blob([JSON.stringify(roomStateRef.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aethelgard-room-${roomStateRef.current.roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dispatchAction = (action: { type: string; payload?: any }) => {
    if (session?.role === 'dm') {
      const { room, error } = applyRoomAction(roomStateRef.current, action);
      if (error) {
        showToast(error);
        return;
      }
      broadcastState(room);
    } else if (hostConnRef.current?.open) {
      hostConnRef.current.send({ type: 'action', action });
    }
  };

  const emitPing = (x: number, y: number) => {
    const ping = {
      id: Date.now() + Math.random(),
      x,
      y,
      senderName: session?.playerName || 'Player',
      color: activeChar?.color || '#f59e0b'
    };
    if (session?.role === 'dm') {
      triggerPing(ping);
      connsRef.current.forEach((c) => {
        if (c.open) c.send({ type: 'map_ping', ping });
      });
    } else if (hostConnRef.current?.open) {
      hostConnRef.current.send({ type: 'map_ping', ping });
    }
  };

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  const handleJoin = ({ roomId, playerName, role, character }: { roomId: string; playerName: string; role: 'dm' | 'player'; character: any }) => {
    const cleanRoom = roomId.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16) || 'AETHEL';
    const url = new URL(window.location.href);
    url.searchParams.set('room', cleanRoom);
    window.history.replaceState({}, '', url.toString());

    peerRef.current?.destroy();
    connsRef.current = [];
    hostConnRef.current = null;

    setSession({ roomId: cleanRoom, playerName, role, myCharId: character?.id || null });
    if (character?.id) setSelectedCharId(character.id);

    const hostPeerId = `aethelgard-vtt-${cleanRoom.toLowerCase()}`;

    if (role === 'dm') {
      // Host creates or restores authoritative state from localStorage
      let initial = createInitialRoomState(cleanRoom);
      try {
        const savedRaw = localStorage.getItem(`aethelgard_room_${cleanRoom}`);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed && Array.isArray(parsed.party) && Array.isArray(parsed.tokens)) {
            initial = { ...initial, ...parsed, players: {} };
          }
        }
      } catch {
        // ignore parse errors
      }
      initial.players['host'] = { socketId: 'host', name: playerName, role: 'dm' };
      roomStateRef.current = initial;
      setRoomState(initial);
      setSelectedCharId(initial.party[0]?.id || null);

      const peer = new Peer(hostPeerId);
      peerRef.current = peer;

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          showToast(`รหัสห้อง "${cleanRoom}" มีคนเปิดอยู่แล้ว! ลองเปลี่ยนรหัสห้องใหม่`);
        } else {
          showToast('เชื่อมต่อ PeerJS ไม่สำเร็จ: ' + err.type);
        }
      });

      peer.on('connection', (conn) => {
        connsRef.current.push(conn);
        conn.on('open', () => {
          conn.send({ type: 'room_state', state: roomStateRef.current });
        });
        conn.on('data', (data: any) => {
          if (data?.type === 'action') {
            const payload = data.action.type === 'player_join'
              ? { ...data.action.payload, peerId: conn.peer }
              : data.action.payload;
            const { room, error } = applyRoomAction(roomStateRef.current, { type: data.action.type, payload });
            if (error) {
              conn.send({ type: 'toast_error', message: error });
              return;
            }
            broadcastState(room);
          } else if (data?.type === 'map_ping') {
            triggerPing(data.ping);
            connsRef.current.forEach((c) => {
              if (c.open) c.send({ type: 'map_ping', ping: data.ping });
            });
          }
        });
        conn.on('close', () => {
          connsRef.current = connsRef.current.filter((c) => c !== conn);
          const { room } = applyRoomAction(roomStateRef.current, { type: 'player_leave', payload: { peerId: conn.peer } });
          broadcastState(room);
        });
      });
    } else {
      // Player joins Host's Peer ID
      setConnectingMsg(`กำลังเชื่อมต่อเข้าห้อง ${cleanRoom}...`);
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(hostPeerId, { reliable: true });
        hostConnRef.current = conn;

        conn.on('open', () => {
          setConnectingMsg(null);
          conn.send({
            type: 'action',
            action: {
              type: 'player_join',
              payload: { playerName, role, character }
            }
          });
        });

        conn.on('data', (data: any) => {
          if (data?.type === 'room_state') {
            roomStateRef.current = data.state;
            setRoomState(data.state);
            setSelectedCharId((prev) => {
              if (prev && data.state.party.some((c: any) => c.id === prev)) return prev;
              return character?.id || data.state.party[0]?.id || null;
            });
          } else if (data?.type === 'map_ping') {
            triggerPing(data.ping);
          } else if (data?.type === 'toast_error') {
            showToast(data.message);
          }
        });

        conn.on('close', () => {
          showToast('DM ปิดห้องหรือการเชื่อมต่อหลุด');
        });
      });

      peer.on('error', (err) => {
        setConnectingMsg(null);
        if (err.type === 'peer-unavailable') {
          showToast(`ไม่พบห้อง "${cleanRoom}" — ให้ DM เปิดห้องก่อนแล้วลองใหม่ครับ`);
        } else {
          showToast('เชื่อมต่อไม่สำเร็จ: ' + err.type);
        }
        setSession(null);
      });
    }
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (connectingMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">{connectingMsg}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-slate-400 underline mt-2">
          ยกเลิก
        </button>
      </div>
    );
  }

  if (!session || !roomState) {
    return (
      <>
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-2xl">
            ⚠️ {toast}
          </div>
        )}
        <Lobby initialRoom={urlRoom} onJoin={handleJoin} />
      </>
    );
  }

  const activeChar = roomState.party.find((c: any) => c.id === selectedCharId) || roomState.party[0] || null;
  const isDM = session.role === 'dm';
  const sortedForTurn = [...(isDM ? roomState.party : roomState.party.filter((m: any) => !m.hidden))].sort(
    (a: any, b: any) => (b.init || 0) - (a.init || 0)
  );
  const combatTurn = {
    inCombat: Boolean(roomState.inCombat),
    round: roomState.round || 1,
    currentChar:
      roomState.inCombat && sortedForTurn.length > 0
        ? sortedForTurn[(roomState.turnIndex || 0) % sortedForTurn.length]
        : null
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Roll20-style Compact Header */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-2 sm:px-3 flex items-center justify-between shrink-0 z-40 gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <span className="hidden md:inline font-bold text-sm tracking-tight">Aethelgard Online</span>
          <span className="text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 font-mono text-indigo-300 font-bold truncate">
            {roomState.roomId}
          </span>
          <span className={`hidden sm:inline-block text-[11px] px-2 py-0.5 rounded font-bold truncate max-w-[120px] ${isDM ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isDM ? '👑 DM' : `🎮 ${session.playerName}`}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => setShowLog((v) => !v)}
            className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              showLog ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'border-transparent text-slate-300 hover:bg-slate-800'
            }`}
            title="ดูบันทึกการต่อสู้และทอยเต๋าย้อนหลัง"
          >
            <ScrollText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">บันทึก</span>
          </button>
          <button
            onClick={() => {
              setShowLeft((v) => {
                const next = !v;
                if (next && window.innerWidth < 768) setShowRight(false);
                return next;
              });
            }}
            className={`p-1.5 rounded-lg border text-xs transition ${showLeft ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
            title="ซ่อน/แสดงแถบปาร์ตี้"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowRight((v) => {
                const next = !v;
                if (next && window.innerWidth < 768) setShowLeft(false);
                return next;
              });
            }}
            className={`p-1.5 rounded-lg border text-xs transition ${showRight ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
            title="ซ่อน/แสดงตัวละครและเต๋า"
          >
            <PanelRight className="w-4 h-4" />
          </button>
          <div className="hidden sm:block h-4 w-px bg-slate-800 mx-0.5" />
          <button
            onClick={copyInvite}
            className="px-2 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="คัดลอกลิงก์ชวนเพื่อน"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'คัดลอกลิงก์แล้ว!' : 'ชวนเพื่อน'}</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="ออกจากห้อง"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-2xl max-w-[90vw] text-center">
          ⚠️ {toast}
        </div>
      )}

      {/* Collapsible Combat Log Drawer */}
      {showLog && (
        <div className="fixed top-14 left-2 right-2 sm:left-auto sm:right-4 z-40 sm:w-80 max-h-[65vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <ScrollText className="w-3.5 h-3.5 text-indigo-400" /> บันทึกการต่อสู้ & ทอยเต๋า
            </span>
            <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll p-2.5 space-y-2 text-xs">
            {(roomState.logs || []).map((lg: any) => (
              <div key={lg.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-slate-200">{lg.who}</span>
                  <span>{lg.time}</span>
                </div>
                {lg.type === 'dice' && (
                  <div className="text-slate-200">
                    🎲 {lg.label}: <span className="font-mono font-bold text-indigo-300">{lg.total}</span>{' '}
                    <span className="text-[10px] text-slate-400">({lg.detail}{lg.mod ? `${lg.mod >= 0 ? `+${lg.mod}` : lg.mod}` : ''})</span>
                    {lg.isCrit && <span className="ml-1 text-amber-300 font-bold">CRIT!</span>}
                    {lg.isFumble && <span className="ml-1 text-rose-400 font-bold">FUMBLE!</span>}
                  </div>
                )}
                {lg.type === 'skill' && (
                  <div className="space-y-0.5">
                    <div className="font-bold text-indigo-300">
                      {lg.skillIcon} {lg.skillName}
                      {lg.targetName && <span className="text-slate-300 font-normal"> → {lg.targetName}</span>}
                    </div>
                    {lg.hit && (
                      <div className="text-[11px] text-slate-300">
                        Hit: <span className="font-mono font-bold text-white">{lg.hit.total}</span>
                        {lg.hitOutcome === 'hit' && <span className="ml-1.5 text-emerald-400 font-bold">🎯 โดน!</span>}
                        {lg.hitOutcome === 'miss' && <span className="ml-1.5 text-slate-400 font-bold">💨 พลาด (AC {lg.targetAc})</span>}
                      </div>
                    )}
                    {lg.effect && (
                      <div className="text-[11px] text-slate-300">
                        {lg.effectLabel}: <span className="font-mono font-bold text-amber-300">{lg.effect.total}</span>
                        {lg.hpDelta < 0 && <span className="ml-1.5 text-rose-400 font-bold">({lg.hpDelta} HP)</span>}
                        {lg.hpDelta > 0 && <span className="ml-1.5 text-emerald-400 font-bold">(+{lg.hpDelta} HP)</span>}
                      </div>
                    )}
                  </div>
                )}
                {lg.type !== 'dice' && lg.type !== 'skill' && (
                  <div className="text-slate-300">{lg.text}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animated Dice Roll Overlay */}
      <DiceRollOverlay latestLog={roomState.logs?.[0]} />

      {/* Main Roll20 3-Column Workspace (Slide-over Drawers on Mobile) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {(showLeft || showRight) && (
          <div
            onClick={() => {
              setShowLeft(false);
              setShowRight(false);
            }}
            className="fixed inset-0 top-12 bg-black/50 backdrop-blur-[1px] z-30 md:hidden"
          />
        )}

        {showLeft && (
          <div className="fixed top-12 bottom-14 md:bottom-0 left-0 z-35 flex md:static md:z-auto shadow-2xl md:shadow-none">
            <TurnTracker
              party={roomState.party}
              inCombat={Boolean(roomState.inCombat)}
              round={roomState.round || 1}
              turnIndex={roomState.turnIndex}
              selectedCharId={selectedCharId}
              players={roomState.players}
              isDM={isDM}
              onSelectChar={(id) => setSelectedCharId(id)}
              onRollInit={() => dispatchAction({ type: 'roll_initiative' })}
              onStartCombat={() => dispatchAction({ type: 'start_combat' })}
              onEndCombat={() => dispatchAction({ type: 'end_combat' })}
              onNextTurn={() => dispatchAction({ type: 'next_turn' })}
              onRemoveEntity={(charId) => dispatchAction({ type: 'remove_entity', payload: { charId } })}
              onToggleHidden={(charId) => dispatchAction({ type: 'toggle_token_hidden', payload: { charId } })}
            />
          </div>
        )}

        {/* Center Map + Floating Bottom Skill Hotbar */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <BattlemapCanvas
            act={roomState.act}
            customMapUrl={roomState.customMapUrl}
            customMapName={roomState.customMapName}
            fog={roomState.fog || []}
            isDM={isDM}
            myCharId={session.myCharId}
            combatTurn={combatTurn}
            tokens={roomState.tokens}
            pings={pings}
            selectedCharId={selectedCharId}
            onMoveToken={(tokenId, x, y) =>
              dispatchAction({
                type: 'move_token',
                payload: { tokenId, x, y, actorRole: session.role, actorCharId: session.myCharId }
              })
            }
            onSelectToken={(tokenId) => {
              if (roomState.party.some((c: any) => c.id === tokenId)) {
                setSelectedCharId(tokenId);
              }
            }}
            onPingMap={emitPing}
            onToggleFog={(cells, mode) => dispatchAction({ type: 'toggle_fog', payload: { cells, mode } })}
            onSetAllFog={(enabled) => dispatchAction({ type: 'set_all_fog', payload: { enabled } })}
          />

          <SkillHotbar
            character={activeChar}
            party={roomState.party}
            onCastSkill={(charId, skill: SkillDef, targetName, targetId, mode) =>
              dispatchAction({ type: 'cast_skill', payload: { charId, skill, targetName, targetId, mode } })
            }
            onUpdateHp={(charId, delta) => dispatchAction({ type: 'update_hp', payload: { charId, delta } })}
            onUpdateResource={(charId, delta) => dispatchAction({ type: 'update_resource', payload: { charId, delta } })}
            onUpgradeSkill={(charId, skillId) => dispatchAction({ type: 'upgrade_skill', payload: { charId, skillId } })}
          />
        </div>

        {showRight && (
          <div className="fixed top-12 bottom-14 md:bottom-0 right-0 z-35 flex md:static md:z-auto shadow-2xl md:shadow-none">
            <CharacterAndDice
              character={
                isDM
                  ? activeChar
                  : roomState.party.find((c: any) => c.id === session.myCharId) || activeChar
              }
              act={roomState.act}
              customMapName={roomState.customMapName}
              isDM={isDM}
              onRollDice={(sides, mod, mode, label) =>
                dispatchAction({ type: 'roll_dice', payload: { sides, mod, mode, label, rollerName: session.playerName } })
              }
              onUpdateEquipment={(charId, equipment) =>
                dispatchAction({ type: 'update_equipment', payload: { charId, equipment } })
              }
              onEditStats={(charId, patch) =>
                dispatchAction({ type: 'edit_character_stats', payload: { charId, ...patch } })
              }
              onToggleCondition={(charId, condition) =>
                dispatchAction({ type: 'toggle_condition', payload: { charId, condition } })
              }
              onSetTokenSize={(charId, size) =>
                dispatchAction({ type: 'set_token_size', payload: { charId, size } })
              }
              onGrantSp={(charId, amount) =>
                dispatchAction({ type: 'grant_sp', payload: { charId, amount } })
              }
              onSetAct={(act) => dispatchAction({ type: 'set_act', payload: act })}
              onSetCustomMap={(mapUrl, mapName) =>
                dispatchAction({ type: 'set_custom_map', payload: { mapUrl, mapName } })
              }
              onSpawnEnemies={() => dispatchAction({ type: 'spawn_enemies' })}
              onSpawnCustom={(entity) => dispatchAction({ type: 'spawn_custom_entity', payload: entity })}
              onResetRoom={() => dispatchAction({ type: 'reset_room' })}
              onExportRoom={handleExportRoom}
              onImportRoom={(state) => dispatchAction({ type: 'import_room', payload: { state } })}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb-friendly) */}
      <nav className="md:hidden h-14 bg-slate-900/95 border-t border-slate-800 grid grid-cols-4 shrink-0 z-40">
        <button
          onClick={() => { setShowLeft(false); setShowRight(false); setShowLog(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            !showLeft && !showRight && !showLog ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-400'
          }`}
        >
          <span className="text-base leading-none">🗺️</span>
          <span>แผนที่</span>
        </button>
        <button
          onClick={() => { setShowLeft((v) => !v); setShowRight(false); setShowLog(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            showLeft ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-400'
          }`}
        >
          <span className="text-base leading-none">👥</span>
          <span>ปาร์ตี้/เทิร์น</span>
        </button>
        <button
          onClick={() => { setShowRight((v) => !v); setShowLeft(false); setShowLog(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            showRight ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-400'
          }`}
        >
          <span className="text-base leading-none">🎒</span>
          <span>{isDM ? 'ตัวละคร/DM' : 'ตัวละคร/เต๋า'}</span>
        </button>
        <button
          onClick={() => { setShowLog((v) => !v); setShowLeft(false); setShowRight(false); }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            showLog ? 'text-indigo-400 bg-indigo-950/30' : 'text-slate-400'
          }`}
        >
          <span className="text-base leading-none">📜</span>
          <span>บันทึก</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
