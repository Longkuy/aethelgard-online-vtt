import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { BattlemapCanvas } from './components/BattlemapCanvas';
import { SkillHotbar } from './components/SkillHotbar';
import { TurnTracker } from './components/TurnTracker';
import { ChatAndDice } from './components/ChatAndDice';
import { SkillDef } from './data/aethelgard';
import { Share2, LogOut, Swords, Check } from 'lucide-react';

export function App() {
  const socketRef = useRef<Socket | null>(null);
  const [roomState, setRoomState] = useState<any>(null);
  const [session, setSession] = useState<{ roomId: string; playerName: string; role: 'dm' | 'player'; myCharId: string | null } | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [pings, setPings] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlRoom = new URLSearchParams(window.location.search).get('room') || 'AETHEL';

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('room_state', (state: any) => {
      setRoomState(state);
      setSelectedCharId((prev) => {
        if (prev && state.party.some((c: any) => c.id === prev)) return prev;
        return state.party[0]?.id || null;
      });
    });

    socket.on('map_ping', (ping: any) => {
      setPings((prev) => [...prev, ping]);
      setTimeout(() => {
        setPings((prev) => prev.filter((p) => p.id !== ping.id));
      }, 1500);
    });

    socket.on('toast_error', (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = ({ roomId, playerName, role, character }: { roomId: string; playerName: string; role: 'dm' | 'player'; character: any }) => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url.toString());

    setSession({ roomId, playerName, role, myCharId: character?.id || null });
    if (character?.id) setSelectedCharId(character.id);
    socketRef.current?.emit('join_room', { roomId, playerName, role, character });
  };

  const copyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session || !roomState) {
    return <Lobby initialRoom={urlRoom} onJoin={handleJoin} />;
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
            {isDM ? '👑 DM' : `🎮 ${session.playerName}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyInvite}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกลิงก์แล้ว!' : 'ชวนเพื่อนเข้าห้อง'}
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
        <TurnTracker
          party={roomState.party}
          turnIndex={roomState.turnIndex}
          selectedCharId={selectedCharId}
          players={roomState.players}
          isDM={isDM}
          onSelectChar={(id) => setSelectedCharId(id)}
          onRollInit={() => socketRef.current?.emit('roll_initiative')}
          onNextTurn={() => socketRef.current?.emit('next_turn')}
        />

        {/* Center Map + Bottom Skill Hotbar */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <BattlemapCanvas
            act={roomState.act}
            tokens={roomState.tokens}
            pings={pings}
            selectedCharId={selectedCharId}
            onMoveToken={(tokenId, x, y) => socketRef.current?.emit('move_token', { tokenId, x, y })}
            onSelectToken={(tokenId) => {
              if (roomState.party.some((c: any) => c.id === tokenId)) {
                setSelectedCharId(tokenId);
              }
            }}
            onPingMap={(x, y) =>
              socketRef.current?.emit('ping_map', {
                x,
                y,
                senderName: session.playerName,
                color: activeChar?.color || '#f59e0b'
              })
            }
          />

          <SkillHotbar
            character={activeChar}
            party={roomState.party}
            onCastSkill={(charId, skill: SkillDef, targetName, mode) =>
              socketRef.current?.emit('cast_skill', { charId, skill, targetName, mode })
            }
            onUpdateHp={(charId, delta) => socketRef.current?.emit('update_hp', { charId, delta })}
            onUpdateResource={(charId, delta) => socketRef.current?.emit('update_resource', { charId, delta })}
          />
        </div>

        <ChatAndDice
          logs={roomState.logs}
          act={roomState.act}
          isDM={isDM}
          playerName={session.playerName}
          onRollDice={(sides, mod, mode) =>
            socketRef.current?.emit('roll_dice', { sides, mod, mode, rollerName: session.playerName })
          }
          onSendChat={(text, isNarration) =>
            socketRef.current?.emit('chat_message', { sender: session.playerName, text, isNarration })
          }
          onSetAct={(act) => socketRef.current?.emit('set_act', act)}
          onSpawnEnemies={() => socketRef.current?.emit('spawn_enemies')}
          onResetRoom={() => socketRef.current?.emit('reset_room')}
        />
      </div>
    </div>
  );
}

export default App;
