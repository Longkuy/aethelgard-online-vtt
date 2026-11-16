import { useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Lobby } from './components/Lobby';
import { BattlemapCanvas } from './components/BattlemapCanvas';
import { SkillHotbar } from './components/SkillHotbar';
import { TurnTracker } from './components/TurnTracker';
import { ChatAndDice } from './components/ChatAndDice';
import { SkillDef } from './data/aethelgard';
import { createInitialRoomState, applyRoomAction } from './lib/roomEngine';
import { Share2, LogOut, Swords, Check, PanelLeft, PanelRight } from 'lucide-react';

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
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

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
    connsRef.current.forEach((c) => {
      if (c.open) c.send({ type: 'room_state', state: nextState });
    });
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
      // Host creates authoritative state immediately
      const initial = createInitialRoomState(cleanRoom);
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

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Roll20-style Compact Header */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Aethelgard Online</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-indigo-300 font-bold">
            ห้อง: {roomState.roomId}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${isDM ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isDM ? '👑 Host (DM)' : `🎮 ${session.playerName}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLeft((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs transition ${showLeft ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
            title="ซ่อน/แสดงแถบปาร์ตี้"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRight((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs transition ${showRight ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
            title="ซ่อน/แสดงแชทและเต๋า"
          >
            <PanelRight className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            onClick={copyInvite}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกลิงก์แล้ว!' : 'ชวนเพื่อน'}
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
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-2xl">
          ⚠️ {toast}
        </div>
      )}

      {/* Main Roll20 3-Column Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {showLeft && (
          <TurnTracker
            party={roomState.party}
            turnIndex={roomState.turnIndex}
            selectedCharId={selectedCharId}
            players={roomState.players}
            isDM={isDM}
            onSelectChar={(id) => setSelectedCharId(id)}
            onRollInit={() => dispatchAction({ type: 'roll_initiative' })}
            onNextTurn={() => dispatchAction({ type: 'next_turn' })}
          />
        )}

        {/* Center Map + Floating Bottom Skill Hotbar */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <BattlemapCanvas
            act={roomState.act}
            tokens={roomState.tokens}
            pings={pings}
            selectedCharId={selectedCharId}
            onMoveToken={(tokenId, x, y) => dispatchAction({ type: 'move_token', payload: { tokenId, x, y } })}
            onSelectToken={(tokenId) => {
              if (roomState.party.some((c: any) => c.id === tokenId)) {
                setSelectedCharId(tokenId);
              }
            }}
            onPingMap={emitPing}
          />

          <SkillHotbar
            character={activeChar}
            party={roomState.party}
            onCastSkill={(charId, skill: SkillDef, targetName, mode) =>
              dispatchAction({ type: 'cast_skill', payload: { charId, skill, targetName, mode } })
            }
            onUpdateHp={(charId, delta) => dispatchAction({ type: 'update_hp', payload: { charId, delta } })}
            onUpdateResource={(charId, delta) => dispatchAction({ type: 'update_resource', payload: { charId, delta } })}
          />
        </div>

        {showRight && (
          <ChatAndDice
            logs={roomState.logs}
            act={roomState.act}
            isDM={isDM}
            playerName={session.playerName}
            onRollDice={(sides, mod, mode) =>
              dispatchAction({ type: 'roll_dice', payload: { sides, mod, mode, rollerName: session.playerName } })
            }
            onSendChat={(text, isNarration) =>
              dispatchAction({ type: 'chat_message', payload: { sender: session.playerName, text, isNarration } })
            }
            onSetAct={(act) => dispatchAction({ type: 'set_act', payload: act })}
            onSpawnEnemies={() => dispatchAction({ type: 'spawn_enemies' })}
            onResetRoom={() => dispatchAction({ type: 'reset_room' })}
          />
        )}
      </div>
    </div>
  );
}

export default App;
