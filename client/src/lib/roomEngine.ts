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
      const { tokenId, x, y } = payload;
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
      const { charId, skill, targetName, mode } = payload;
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

      pushLog(room, {
        type: 'skill',
        who: casterName,
        casterIcon: caster?.icon || '✨',
        casterColor: caster?.color || '#8b5cf6',
        skillName: `${skill.name} (Lv.${skillLv})`,
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

    case 'next_turn': {
      if (room.party.length > 0) {
        room.turnIndex = (room.turnIndex + 1) % room.party.length;
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
      const { name, kind, hp, ac, init, icon, avatarUrl } = payload;
      const isEnemy = kind !== 'npc';
      const id = (isEnemy ? 'en_' : 'npc_') + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
      const maxHp = Math.max(1, Number(hp) || 10);
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
        isEnemy
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
        type: isEnemy ? 'enemy' : 'npc'
      });
      pushLog(room, {
        type: 'system',
        who: 'DM',
        text: `${isEnemy ? '⚠️ เสกมอนสเตอร์:' : '🧑 เสก NPC:'} ${entity.name} (HP ${maxHp}, AC ${entity.ac})`
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
