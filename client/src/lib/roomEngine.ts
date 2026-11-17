export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function evalFormula(formula: string) {
  const clean = String(formula || '1d6').replace(/\s+/g, '').toLowerCase();
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return { total: 0, rolls: [] as number[], mod: 0 };
  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const mod = parseInt(match[3] || '0', 10);
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { total, rolls, mod };
}

export function createInitialRoomState(roomId: string) {
  return {
    roomId,
    act: 1 as string | number,
    customMapUrl: null as string | null,
    customMapName: null as string | null,
    fog: [] as string[],
    inCombat: false,
    round: 1,
    turnIndex: 0,
    party: [] as any[],
    tokens: [] as any[],
    players: {} as Record<string, any>,
    logs: [
      {
        id: 'init_1',
        type: 'system',
        who: 'SYSTEM',
        text: `เปิดห้องผจญภัย "${roomId}" แล้ว! กดปุ่ม "ชวนเพื่อน" เพื่อส่งลิงก์ให้เพื่อนเข้ามาสร้างตัวละครได้เลย`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };
}

function pushLog(room: any, entry: any) {
  const fullEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    ...entry
  };
  room.logs = [fullEntry, ...room.logs].slice(0, 80);
}

export function applyRoomAction(prevRoom: any, action: { type: string; payload?: any }): { room: any; error?: string } {
  const room = JSON.parse(JSON.stringify(prevRoom));
  const { type, payload } = action;

  switch (type) {
    case 'player_join': {
      const { peerId, playerName, role, character } = payload;
      if (character && character.name) {
        const exists = room.party.find((c: any) => c.id === character.id);
        if (!exists) {
          room.party.push(character);
          room.tokens.push({
            id: character.id,
            label: character.name.slice(0, 6),
            icon: character.icon || '🌟',
            avatarUrl: character.avatarUrl || null,
            color: character.color || '#3b82f6',
            x: 2 + (room.tokens.length % 4),
            y: 3 + Math.floor(room.tokens.length / 4),
            type: 'party'
          });
        }
      }
      room.players[peerId] = {
        socketId: peerId,
        name: playerName || 'ผู้เล่น',
        role: role === 'dm' ? 'dm' : 'player'
      };
      pushLog(room, {
        type: 'system',
        who: 'ROOM',
        text: `${playerName || 'ผู้เล่น'} (${role === 'dm' ? 'DM' : 'Player'}) เข้าร่วมห้องแล้ว`
      });
      return { room };
    }

    case 'player_leave': {
      const { peerId } = payload;
      delete room.players[peerId];
      return { room };
    }

    case 'move_token': {
      const { tokenId, x, y, actorRole, actorCharId } = payload;
      if (actorRole && actorRole !== 'dm' && actorCharId !== tokenId) {
        return { room: prevRoom, error: 'คุณสามารถขยับได้เฉพาะตัวละครของตัวเองเท่านั้น!' };
      }
      const tok = room.tokens.find((t: any) => t.id === tokenId);
      if (tok) {
        tok.x = Math.max(0, Math.min(15, x));
        tok.y = Math.max(0, Math.min(8, y));
      }
      return { room };
    }

    case 'update_hp': {
      const { charId, delta } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      if (c) c.hp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
      return { room };
    }

    case 'update_resource': {
      const { charId, delta } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      if (c) c.mp = Math.max(0, Math.min(c.maxMp, (c.mp || 0) + delta));
      return { room };
    }

    case 'upgrade_skill': {
      const { charId, skillId } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      if (!c) return { room: prevRoom };
      if ((c.skillPoints || 0) <= 0) {
        return { room: prevRoom, error: 'Skill Point (SP) ไม่พอ!' };
      }
      c.skillLevels = c.skillLevels || {};
      const curLv = c.skillLevels[skillId] || 1;
      if (curLv >= 3) {
        return { room: prevRoom, error: 'สกิลนี้อัปเต็ม Lv.3 แล้ว!' };
      }
      c.skillLevels[skillId] = curLv + 1;
      c.skillPoints -= 1;
      pushLog(room, {
        type: 'system',
        who: 'UPGRADE',
        text: `⬆️ ${c.name} อัปเกรดสกิลเป็น Lv.${curLv + 1} (เหลือ ${c.skillPoints} SP)`
      });
      return { room };
    }

    case 'cast_skill': {
      const { charId, skill, targetName, targetId, mode } = payload;
      const caster = room.party.find((m: any) => m.id === charId);
      const casterName = caster ? caster.name : 'นักผจญภัย';
      const skillLv = caster?.skillLevels?.[skill.id] || 1;
      const lvBonus = skillLv - 1; // +0 at Lv1, +1 at Lv2, +2 at Lv3

      if (caster && skill.cost > 0) {
        if ((caster.mp || 0) < skill.cost) {
          return { room: prevRoom, error: `${caster.resName || 'พลังงาน'} ไม่พอใช้สกิล ${skill.name}!` };
        }
        caster.mp -= skill.cost;
      }

      let hitResult = null;
      if (skill.hitBonus !== null && skill.hitBonus !== undefined) {
        const r1 = rollDie(20);
        const r2 = rollDie(20);
        const raw = mode === 'adv' ? Math.max(r1, r2) : mode === 'dis' ? Math.min(r1, r2) : r1;
        const totalBonus = skill.hitBonus + lvBonus;
        hitResult = {
          raw,
          total: raw + totalBonus,
          bonus: totalBonus,
          isCrit: raw === 20,
          isFumble: raw === 1,
          mode: mode || 'normal'
        };
      }

      let effectResult = null;
      if (skill.dice) {
        effectResult = evalFormula(skill.dice);
        effectResult.total += lvBonus;
        if (hitResult && hitResult.isCrit) {
          const critExtra = evalFormula(skill.dice);
          effectResult.total += critExtra.total - critExtra.mod;
          effectResult.rolls.push(...critExtra.rolls);
        }
      }

      // Target resolution & auto HP calculation
      const target = targetId
        ? room.party.find((m: any) => m.id === targetId)
        : targetName
        ? room.party.find((m: any) => m.name === targetName)
        : null;

      let hitOutcome: 'hit' | 'miss' | null = null;
      let hpDelta = 0;

      if (target) {
        if (skill.type === 'Heal' && effectResult) {
          const healAmt = Math.max(0, effectResult.total);
          target.hp = Math.min(target.maxHp, target.hp + healAmt);
          hpDelta = healAmt;
        } else if (skill.type === 'Attack' || hitResult) {
          const targetAc = target.ac || 10;
          if (hitResult) {
            const isHit = hitResult.isCrit || (!hitResult.isFumble && hitResult.total >= targetAc);
            hitOutcome = isHit ? 'hit' : 'miss';
            if (isHit && effectResult) {
              const dmg = Math.max(0, effectResult.total);
              target.hp = Math.max(0, target.hp - dmg);
              hpDelta = -dmg;
            }
          } else if (effectResult) {
            hitOutcome = 'hit';
            const dmg = Math.max(0, effectResult.total);
            target.hp = Math.max(0, target.hp - dmg);
            hpDelta = -dmg;
          }
        }
      }

      pushLog(room, {
        type: 'skill',
        who: casterName,
        casterIcon: caster?.icon || '✨',
        casterColor: caster?.color || '#8b5cf6',
        skillName: `${skill.name} (Lv.${skillLv})`,
        skillIcon: skill.icon || '✨',
        skillType: skill.type || 'Attack',
        targetName: target?.name || targetName || null,
        targetAc: target?.ac || null,
        hitOutcome,
        hpDelta,
        cost: skill.cost,
        resName: caster?.resName || 'Mana',
        hit: hitResult,
        effect: effectResult,
        effectLabel: skill.effectLabel || 'ดาเมจ',
        desc: skill.desc
      });
      return { room };
    }

    case 'roll_dice': {
      const { sides, mod, mode, label, rollerName } = payload;
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
      pushLog(room, {
        type: 'dice',
        who: rollerName || 'Player',
        label: label || `d${sides}`,
        raw,
        mod: m,
        total: raw + m,
        detail,
        isCrit: sides === 20 && raw === 20,
        isFumble: sides === 20 && raw === 1
      });
      return { room };
    }

    case 'roll_initiative': {
      room.party.forEach((m: any) => {
        const dexMod = m.stats ? Math.floor((m.stats[1] - 10) / 2) : 1;
        m.init = rollDie(20) + dexMod;
      });
      room.turnIndex = 0;
      pushLog(room, { type: 'system', who: 'DM', text: '🎲 ทอย Initiative จัดลำดับเทิร์นใหม่ทั้งกระดาน!' });
      return { room };
    }

    case 'start_combat': {
      room.inCombat = true;
      room.round = 1;
      room.turnIndex = 0;
      const sorted = [...room.party].sort((a: any, b: any) => (b.init || 0) - (a.init || 0));
      const first = sorted[0];
      pushLog(room, {
        type: 'system',
        who: 'COMBAT',
        text: `⚔️ เข้าสู่ Phase ต่อสู้! Round 1${first ? ` — เทิร์นของ ${first.name}` : ''}`
      });
      return { room };
    }

    case 'end_combat': {
      room.inCombat = false;
      room.round = 1;
      room.turnIndex = 0;
      pushLog(room, {
        type: 'system',
        who: 'COMBAT',
        text: '🕊️ จบการต่อสู้ (Exploration Phase)'
      });
      return { room };
    }

    case 'next_turn': {
      if (!room.inCombat || room.party.length === 0) return { room };
      const sorted = [...room.party].sort((a: any, b: any) => (b.init || 0) - (a.init || 0));
      const nextIdx = room.turnIndex + 1;
      if (nextIdx >= sorted.length) {
        room.turnIndex = 0;
        room.round = (room.round || 1) + 1;
      } else {
        room.turnIndex = nextIdx;
      }
      const current = sorted[room.turnIndex];
      if (current) {
        pushLog(room, {
          type: 'system',
          who: 'TURN',
          text: `⏳ Round ${room.round} — เทิร์นของ ${current.name}`
        });
      }
      return { room };
    }

    case 'set_act': {
      const act = payload;
      room.act = act;
      pushLog(room, {
        type: 'system',
        who: 'SCENE',
        text: act === 'world' ? '🗺️ เปิดแผนที่โลก Aethelgard' : `🚩 เปลี่ยนฉากเป็น Act ${act}`
      });
      return { room };
    }

    case 'spawn_enemies': {
      room.party = room.party.filter((m: any) => !m.id.startsWith('en_'));
      room.tokens = room.tokens.filter((t: any) => !t.id.startsWith('en_'));
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
      return { room };
    }

    case 'spawn_custom_entity': {
      const { name, kind, hp, ac, init, icon, avatarUrl, size, hidden } = payload;
      const isEnemy = kind !== 'npc';
      const id = (isEnemy ? 'en_' : 'npc_') + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
      const maxHp = Math.max(1, Number(hp) || 10);
      const tokenSize = size === 2 || size === 3 ? size : 1;
      const entity = {
        id,
        name: name || (isEnemy ? 'มอนสเตอร์' : 'NPC'),
        raceName: isEnemy ? 'Monster' : 'NPC',
        className: isEnemy ? 'Enemy' : 'Friendly',
        hp: maxHp,
        maxHp,
        ac: Number(ac) || 12,
        mp: 2,
        maxMp: 2,
        resName: isEnemy ? 'Skill' : 'Role',
        init: Number(init) || rollDie(20),
        icon: icon || (isEnemy ? '👺' : '🧑'),
        avatarUrl: avatarUrl || null,
        color: isEnemy ? '#e11d48' : '#eab308',
        isEnemy,
        hidden: Boolean(hidden),
        size: tokenSize,
        conditions: [] as string[]
      };
      room.party.push(entity);
      room.tokens.push({
        id,
        label: entity.name.slice(0, 6),
        icon: entity.icon,
        avatarUrl: entity.avatarUrl,
        color: entity.color,
        x: isEnemy ? 10 : 7,
        y: 4,
        type: isEnemy ? 'enemy' : 'npc',
        size: tokenSize,
        hidden: Boolean(hidden),
        conditions: []
      });
      pushLog(room, {
        type: 'system',
        who: 'DM',
        text: `${isEnemy ? '⚠️ เสกมอนสเตอร์:' : '🧑 เสก NPC:'} ${entity.name} (HP ${maxHp}, AC ${entity.ac}${hidden ? ', ซ่อนตัว' : ''})`
      });
      return { room };
    }

    case 'remove_entity': {
      const { charId } = payload;
      room.party = room.party.filter((m: any) => m.id !== charId);
      room.tokens = room.tokens.filter((t: any) => t.id !== charId);
      return { room };
    }

    case 'update_equipment': {
      const { charId, equipment } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      if (c) {
        c.equipment = equipment;
      }
      return { room };
    }

    case 'toggle_fog': {
      const { cells, mode } = payload as { cells: string[]; mode: 'add' | 'remove' | 'toggle' };
      const fogSet = new Set<string>(room.fog || []);
      for (const cell of cells || []) {
        if (mode === 'add') fogSet.add(cell);
        else if (mode === 'remove') fogSet.delete(cell);
        else {
          if (fogSet.has(cell)) fogSet.delete(cell);
          else fogSet.add(cell);
        }
      }
      room.fog = Array.from(fogSet);
      return { room };
    }

    case 'set_all_fog': {
      const { enabled } = payload;
      if (!enabled) {
        room.fog = [];
      } else {
        const all: string[] = [];
        for (let y = 0; y < 9; y++) {
          for (let x = 0; x < 16; x++) {
            all.push(`${x}-${y}`);
          }
        }
        room.fog = all;
      }
      return { room };
    }

    case 'set_custom_map': {
      const { mapUrl, mapName } = payload;
      room.customMapUrl = mapUrl;
      room.customMapName = mapName || 'Custom Map';
      room.act = 'custom';
      pushLog(room, {
        type: 'system',
        who: 'SCENE',
        text: `🗺️ DM เปลี่ยนแผนที่เป็น: ${room.customMapName}`
      });
      return { room };
    }

    case 'toggle_token_hidden': {
      const { charId } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      const t = room.tokens.find((tok: any) => tok.id === charId);
      const nextHidden = !(c?.hidden || t?.hidden);
      if (c) c.hidden = nextHidden;
      if (t) t.hidden = nextHidden;
      return { room };
    }

    case 'set_token_size': {
      const { charId, size } = payload;
      const s = size === 2 || size === 3 ? size : 1;
      const c = room.party.find((m: any) => m.id === charId);
      const t = room.tokens.find((tok: any) => tok.id === charId);
      if (c) c.size = s;
      if (t) t.size = s;
      return { room };
    }

    case 'toggle_condition': {
      const { charId, condition } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      const t = room.tokens.find((tok: any) => tok.id === charId);
      const cur: string[] = c?.conditions || t?.conditions || [];
      const exists = cur.includes(condition);
      const next = exists ? cur.filter((x) => x !== condition) : [...cur, condition];
      if (c) c.conditions = next;
      if (t) t.conditions = next;
      return { room };
    }

    case 'edit_character_stats': {
      const { charId, name, ac, maxHp, hp, stats } = payload;
      const c = room.party.find((m: any) => m.id === charId);
      const t = room.tokens.find((tok: any) => tok.id === charId);
      if (c) {
        if (typeof name === 'string' && name.trim()) {
          c.name = name.trim();
          if (t) t.label = c.name.slice(0, 6);
        }
        if (typeof ac === 'number' && !Number.isNaN(ac)) c.ac = Math.max(1, ac);
        if (typeof maxHp === 'number' && !Number.isNaN(maxHp)) {
          c.maxHp = Math.max(1, maxHp);
          c.hp = Math.min(c.hp, c.maxHp);
        }
        if (typeof hp === 'number' && !Number.isNaN(hp)) {
          c.hp = Math.max(0, Math.min(c.maxHp, hp));
        }
        if (Array.isArray(stats) && stats.length === 6) {
          c.stats = stats.map((v) => Math.max(1, Math.min(30, Number(v) || 10)));
        }
      }
      return { room };
    }

    case 'grant_sp': {
      const { charId, amount } = payload;
      const amt = Number(amount) || 1;
      if (charId === 'ALL') {
        room.party.forEach((m: any) => {
          if (!m.isEnemy) m.skillPoints = Math.max(0, (m.skillPoints || 0) + amt);
        });
        pushLog(room, { type: 'system', who: 'DM', text: `⬆️ DM แจก +${amt} Skill Point ให้ผู้เล่นทุกคน!` });
      } else {
        const c = room.party.find((m: any) => m.id === charId);
        if (c) {
          c.skillPoints = Math.max(0, (c.skillPoints || 0) + amt);
          pushLog(room, { type: 'system', who: 'DM', text: `⬆️ ${c.name} ได้รับ +${amt} Skill Point` });
        }
      }
      return { room };
    }

    case 'import_room': {
      const { state } = payload;
      if (state && Array.isArray(state.party) && Array.isArray(state.tokens)) {
        return { room: { ...createInitialRoomState(room.roomId), ...state, roomId: room.roomId } };
      }
      return { room: prevRoom, error: 'ไฟล์ห้องไม่ถูกต้อง' };
    }

    case 'chat_message': {
      const { sender, text, isNarration } = payload;
      pushLog(room, {
        type: isNarration ? 'narration' : 'chat',
        who: sender || 'Player',
        text
      });
      return { room };
    }

    case 'reset_room': {
      return { room: createInitialRoomState(room.roomId) };
    }

    default:
      return { room };
  }
}
