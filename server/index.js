const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve built React client in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

const rooms = new Map();

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function evalFormula(formula) {
  // Supports e.g. "2d6+3", "1d8+2", "1d4+1", "d20+5"
  const clean = String(formula || '1d6').replace(/\s+/g, '').toLowerCase();
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return { total: 0, rolls: [], mod: 0 };
  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const mod = parseInt(match[3] || '0', 10);
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { total, rolls, mod };
}

function createInitialRoomState(roomId) {
  return {
    roomId,
    act: 1, // 1, 2, 3, or 'world'
    turnIndex: 0,
    party: [
      {
        id: 'demo_kai',
        name: 'ไค (Kai)',
        player: 'Demo',
        raceId: 'human',
        raceName: 'มนุษย์ (Imperial)',
        classId: 'warrior',
        className: 'นักรบ (Swordmaster)',
        hp: 14,
        maxHp: 14,
        ac: 15,
        mp: 4,
        maxMp: 4,
        resName: 'Aura',
        init: 14,
        icon: '⚔️',
        color: '#10b981',
        isEnemy: false,
        stats: [16, 13, 14, 10, 11, 12]
      },
      {
        id: 'demo_luna',
        name: 'ลูนาเรีย (Lunaria)',
        player: 'Demo',
        raceId: 'elf',
        raceName: 'เอลฟ์ (High Elf)',
        classId: 'mage',
        className: 'นักเวท (Elementalist)',
        hp: 9,
        maxHp: 9,
        ac: 12,
        mp: 6,
        maxMp: 6,
        resName: 'Mana',
        init: 16,
        icon: '🔮',
        color: '#8b5cf6',
        isEnemy: false,
        stats: [8, 14, 12, 17, 13, 11]
      },
      {
        id: 'demo_sera',
        name: 'เซราฟิม (Seraphim)',
        player: 'Demo',
        raceId: 'dwarf',
        raceName: 'คนแคระ (Mountain)',
        classId: 'paladin',
        className: 'พาลาดิน (Protection)',
        hp: 15,
        maxHp: 15,
        ac: 17,
        mp: 4,
        maxMp: 4,
        resName: 'Faith',
        init: 11,
        icon: '🛡️',
        color: '#f59e0b',
        isEnemy: false,
        stats: [15, 10, 16, 9, 13, 14]
      }
    ],
    tokens: [
      { id: 'demo_kai', label: 'ไค', icon: '⚔️', color: '#10b981', x: 2, y: 3, type: 'party' },
      { id: 'demo_luna', label: 'ลูน่า', icon: '🔮', color: '#8b5cf6', x: 1, y: 4, type: 'party' },
      { id: 'demo_sera', label: 'เซรา', icon: '🛡️', color: '#f59e0b', x: 2, y: 5, type: 'party' },
      { id: 'npc_thomas', label: 'โทมัส', icon: '🌿', color: '#eab308', x: 13, y: 2, type: 'npc' }
    ],
    players: {}, // socketId -> { name, role, charId }
    logs: [
      {
        id: 'init_1',
        type: 'system',
        who: 'SYSTEM',
        text: `เปิดห้องผจญภัย "${roomId}" แล้ว! ส่งลิงก์ห้องนี้ให้เพื่อนเข้าร่วมได้เลย`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };
}

function getOrCreateRoom(roomId) {
  const cleanId = (roomId || 'AETHEL').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16) || 'AETHEL';
  if (!rooms.has(cleanId)) {
    rooms.set(cleanId, createInitialRoomState(cleanId));
  }
  return rooms.get(cleanId);
}

function pushLog(room, entry) {
  const fullEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    ...entry
  };
  room.logs.unshift(fullEntry);
  if (room.logs.length > 80) room.logs.pop();
  return fullEntry;
}

io.on('connection', (socket) => {
  let currentRoomId = null;

  socket.on('join_room', ({ roomId, playerName, role, character }) => {
    const room = getOrCreateRoom(roomId);
    currentRoomId = room.roomId;
    socket.join(currentRoomId);

    let charId = null;
    if (character && character.name) {
      const exists = room.party.find((c) => c.id === character.id);
      if (!exists) {
        room.party.push(character);
        room.tokens.push({
          id: character.id,
          label: character.name.slice(0, 6),
          icon: character.icon || '🌟',
          color: character.color || '#3b82f6',
          x: 3,
          y: 4,
          type: 'party'
        });
      }
      charId = character.id;
    }

    room.players[socket.id] = {
      socketId: socket.id,
      name: playerName || 'ผู้เล่น',
      role: role === 'dm' ? 'dm' : 'player',
      charId
    };

    pushLog(room, {
      type: 'system',
      who: 'ROOM',
      text: `${playerName || 'ผู้เล่น'} (${role === 'dm' ? 'DM' : 'Player'}) เข้าร่วมห้องแล้ว`
    });

    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('add_character', (character) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !character) return;

    const idx = room.party.findIndex((c) => c.id === character.id);
    if (idx >= 0) {
      room.party[idx] = character;
    } else {
      room.party.push(character);
      room.tokens.push({
        id: character.id,
        label: character.name.slice(0, 6),
        icon: character.icon || '🌟',
        color: character.color || '#3b82f6',
        x: 3,
        y: 4,
        type: 'party'
      });
    }
    if (room.players[socket.id]) {
      room.players[socket.id].charId = character.id;
    }
    pushLog(room, {
      type: 'system',
      who: 'PARTY',
      text: `✨ ${character.name} (${character.raceName} / ${character.className}) เข้าสู่ปาร์ตี้!`
    });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('move_token', ({ tokenId, x, y }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const tok = room.tokens.find((t) => t.id === tokenId);
    if (tok) {
      tok.x = Math.max(0, Math.min(15, x));
      tok.y = Math.max(0, Math.min(8, y));
      io.to(currentRoomId).emit('room_state', room);
    }
  });

  socket.on('ping_map', ({ x, y, senderName, color }) => {
    if (!currentRoomId) return;
    io.to(currentRoomId).emit('map_ping', {
      id: Date.now() + Math.random(),
      x,
      y,
      senderName: senderName || 'Player',
      color: color || '#f59e0b'
    });
  });

  socket.on('update_hp', ({ charId, delta }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const c = room.party.find((m) => m.id === charId);
    if (c) {
      c.hp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
      io.to(currentRoomId).emit('room_state', room);
    }
  });

  socket.on('update_resource', ({ charId, delta }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const c = room.party.find((m) => m.id === charId);
    if (c) {
      c.mp = Math.max(0, Math.min(c.maxMp, (c.mp || 0) + delta));
      io.to(currentRoomId).emit('room_state', room);
    }
  });

  socket.on('cast_skill', ({ charId, skill, targetName, mode }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !skill) return;

    const caster = room.party.find((m) => m.id === charId);
    const casterName = caster ? caster.name : 'นักผจญภัย';

    if (caster && skill.cost > 0) {
      if ((caster.mp || 0) < skill.cost) {
        socket.emit('toast_error', `${caster.resName || 'พลังงาน'} ไม่พอใช้สกิล ${skill.name}!`);
        return;
      }
      caster.mp -= skill.cost;
    }

    // Roll Hit / Check if applicable
    let hitResult = null;
    if (skill.hitBonus !== null && skill.hitBonus !== undefined) {
      const r1 = rollDie(20);
      const r2 = rollDie(20);
      const raw = mode === 'adv' ? Math.max(r1, r2) : mode === 'dis' ? Math.min(r1, r2) : r1;
      hitResult = {
        raw,
        total: raw + skill.hitBonus,
        bonus: skill.hitBonus,
        isCrit: raw === 20,
        isFumble: raw === 1,
        mode: mode || 'normal'
      };
    }

    // Roll Effect (Damage / Heal / Shield)
    let effectResult = null;
    if (skill.dice) {
      effectResult = evalFormula(skill.dice);
      if (hitResult && hitResult.isCrit) {
        const critExtra = evalFormula(skill.dice);
        effectResult.total += critExtra.total - critExtra.mod;
        effectResult.rolls.push(...critExtra.rolls);
      }
    }

    pushLog(room, {
      type: 'skill',
      who: casterName,
      casterIcon: caster?.icon || '✨',
      casterColor: caster?.color || '#8b5cf6',
      skillName: skill.name,
      skillIcon: skill.icon || '✨',
      skillType: skill.type || 'Attack',
      targetName: targetName || null,
      cost: skill.cost,
      resName: caster?.resName || 'Mana',
      hit: hitResult,
      effect: effectResult,
      effectLabel: skill.effectLabel || 'ดาเมจ',
      desc: skill.desc
    });

    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('roll_dice', ({ sides, mod, mode, label, rollerName }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const r1 = rollDie(sides);
    const r2 = rollDie(sides);
    let raw = r1;
    let detail = `${r1}`;
    if (sides === 20 && mode === 'adv') {
      raw = Math.max(r1, r2);
      detail = `Adv (${r1}, ${r2}) → ${raw}`;
    } else if (sides === 20 && mode === 'dis') {
      raw = Math.min(r1, r2);
      detail = `Dis (${r1}, ${r2}) → ${raw}`;
    }
    const m = parseInt(mod || 0, 10);
    const total = raw + m;

    pushLog(room, {
      type: 'dice',
      who: rollerName || 'Player',
      label: label || `d${sides}`,
      raw,
      mod: m,
      total,
      detail,
      isCrit: sides === 20 && raw === 20,
      isFumble: sides === 20 && raw === 1
    });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('roll_initiative', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    room.party.forEach((m) => {
      const dexMod = m.stats ? Math.floor((m.stats[1] - 10) / 2) : 1;
      m.init = rollDie(20) + dexMod;
    });
    room.turnIndex = 0;
    pushLog(room, { type: 'system', who: 'DM', text: '🎲 ทอย Initiative จัดลำดับเทิร์นใหม่ทั้งกระดาน!' });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('next_turn', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.party.length === 0) return;
    room.turnIndex = (room.turnIndex + 1) % room.party.length;
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('set_act', (act) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    room.act = act;
    pushLog(room, {
      type: 'system',
      who: 'SCENE',
      text: act === 'world' ? '🗺️ เปิดแผนที่โลก Aethelgard' : `🚩 เปลี่ยนฉากเป็น Act ${act}`
    });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('spawn_enemies', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    room.party = room.party.filter((m) => !m.id.startsWith('en_'));
    room.tokens = room.tokens.filter((t) => !t.id.startsWith('en_'));

    const enemies = [
      { id: 'en_gob1', name: 'ก็อบลินตัวเขียว #1', raceName: 'ก็อบลิน', className: 'Level 1', hp: 7, maxHp: 7, ac: 13, mp: 2, maxMp: 2, resName: 'Trap', init: 13, icon: '👺', color: '#e11d48', isEnemy: true },
      { id: 'en_gob2', name: 'ก็อบลินตัวเขียว #2', raceName: 'ก็อบลิน', className: 'Level 1', hp: 7, maxHp: 7, ac: 13, mp: 2, maxMp: 2, resName: 'Trap', init: 11, icon: '👺', color: '#e11d48', isEnemy: true },
      { id: 'en_wolf', name: 'หมาป่าติดเชื้อ Miasma', raceName: 'สัตว์กลายพันธุ์', className: 'Miasma (อ่อน)', hp: 11, maxHp: 11, ac: 13, mp: 2, maxMp: 2, resName: 'Miasma', init: 15, icon: '🐺', color: '#9f1239', isEnemy: true }
    ];
    room.party.push(...enemies);
    room.tokens.push(
      { id: 'en_gob1', label: 'กอบ1', icon: '👺', color: '#e11d48', x: 10, y: 3, type: 'enemy' },
      { id: 'en_gob2', label: 'กอบ2', icon: '👺', color: '#e11d48', x: 10, y: 5, type: 'enemy' },
      { id: 'en_wolf', label: 'หมาป่า', icon: '🐺', color: '#9f1239', x: 8, y: 4, type: 'enemy' }
    );
    pushLog(room, { type: 'system', who: 'DM', text: '⚠️ ศัตรูปรากฏตัว! ก็อบลินตัวเขียว 2 ตัว + หมาป่าติดเชื้อ Miasma 1 ตัว' });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('chat_message', ({ sender, text, isNarration }) => {
    if (!currentRoomId || !text) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    pushLog(room, {
      type: isNarration ? 'narration' : 'chat',
      who: sender || 'Player',
      text
    });
    io.to(currentRoomId).emit('room_state', room);
  });

  socket.on('reset_room', () => {
    if (!currentRoomId) return;
    const fresh = createInitialRoomState(currentRoomId);
    rooms.set(currentRoomId, fresh);
    io.to(currentRoomId).emit('room_state', fresh);
  });

  socket.on('disconnect', () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      delete room.players[socket.id];
      io.to(currentRoomId).emit('room_state', room);
    }
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Aethelgard Online VTT running on http://localhost:${PORT}`);
});
