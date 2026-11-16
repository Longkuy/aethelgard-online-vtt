export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  type: 'Attack' | 'Heal' | 'Buff' | 'Utility';
  cost: number;
  range: string;
  hitBonus: number | null; // null = auto-hit / utility / save
  dice: string | null;     // e.g. "1d8+3" or "2d6"
  effectLabel: string;
  desc: string;
}

export interface RaceDef {
  id: string;
  icon: string;
  name: string;
  home: string;
  power: string;
  baseStats: [number, number, number, number, number, number]; // STR, DEX, CON, INT, WIS, CHA
  pros: string;
  cons: string;
  racialSkill: SkillDef;
  subraces: { name: string; perk: string; flaw: string }[];
}

export interface ClassDef {
  id: string;
  icon: string;
  group: 'Magic' | 'Aura' | 'Divine' | 'Hybrid' | 'Lifestyle';
  name: string;
  cat: string;
  role: string;
  hp: number;
  maxMp: number;
  resName: string;
  mainStat: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  pros: string;
  cons: string;
  subclasses: string[];
  skills: SkillDef[];
}

export const RACES: RaceDef[] = [
  {
    id: 'elf', icon: '🧝', name: 'เอลฟ์ (Elves)', home: 'ป่าศักดิ์สิทธิ์', power: 'Magic',
    baseStats: [8, 13, 9, 14, 12, 11],
    pros: 'ดึงมานาธรรมชาติโดยตรงไม่ต้องใช้ Mana Core, เชี่ยวชาญเวทภูติ',
    cons: 'ไม่เก่งระยะประชิด, พึ่งพามานาธรรมชาติสูง',
    racialSkill: {
      id: 'race_elf_mana', name: 'ซึมซับมานาธรรมชาติ', icon: '🌿', type: 'Utility',
      cost: 0, range: 'ตัวเอง', hitBonus: null, dice: '1d4', effectLabel: 'ฟื้นฟู Mana/HP',
      desc: 'ดึงมานาบริสุทธิ์รอบตัวมาฟื้นฟูพลัง (ใช้ได้ 1 ครั้ง/ฉาก)'
    },
    subraces: [
      { name: 'High Elf', perk: 'ใช้เวทราชาภูติได้โดยไม่ต้องทำสัญญา', flaw: 'หยิ่งทระนง, แพ้ Miasma รุนแรงกว่าเผ่าอื่น' },
      { name: 'Forest Elf', perk: 'เคลื่อนไหวในป่าไร้เสียง ยิงธนูแม่นยำ', flaw: 'อยู่ห่างป่าศักดิ์สิทธิ์นาน ๆ ฟื้นฟูช้าลง' },
      { name: 'Dark Elf', perk: 'มองเห็นในความมืดสนิท ถนัดเวทเงา', flaw: 'แพ้แสงแดดจ้าและถูกเอลฟ์สายอื่นระแวง' }
    ]
  },
  {
    id: 'human', icon: '🧑', name: 'มนุษย์ (Humans)', home: 'จักรวรรดิมนุษย์', power: 'ทุกสาย',
    baseStats: [10, 10, 10, 10, 10, 10],
    pros: 'ปรับตัวเก่งที่สุด ไปได้ทุกสายอาชีพ เรียนรู้ทักษะไว',
    cons: 'อายุขัยสั้นที่สุด ไม่มีพรสวรรค์ทางกายภาพติดตัว',
    racialSkill: {
      id: 'race_human_adapt', name: 'ความมุ่งมั่นมนุษย์', icon: '🔥', type: 'Buff',
      cost: 0, range: 'ตัวเอง', hitBonus: 2, dice: null, effectLabel: 'เช็กทักษะ',
      desc: 'ทอย d20+2 เพื่อแก้สถานการณ์หรือช่วยเพื่อน (+2 โบนัสอเนกประสงค์)'
    },
    subraces: [
      { name: 'Imperial / Free City', perk: 'ได้โบนัสทักษะอเนกประสงค์และการเจรจา', flaw: 'ไม่มีความต้านทานเฉพาะทาง' }
    ]
  },
  {
    id: 'dwarf', icon: '🧔', name: 'คนแคระ (Dwarves)', home: 'Khazâd-Dûm', power: 'Aura',
    baseStats: [13, 8, 14, 9, 11, 8],
    pros: 'อึดถึกที่สุด ต้านทานพิษ หลอมผลึก Miasma และซ่อม Artifact ได้',
    cons: 'Mana Core พัฒนาช้า เคลื่อนที่ช้า ไม่ถูกโฉลกกับน้ำหรืออากาศ',
    racialSkill: {
      id: 'race_dwarf_stone', name: 'กายาหินผา', icon: '🪨', type: 'Buff',
      cost: 0, range: 'ตัวเอง', hitBonus: null, dice: '1d6+2', effectLabel: 'เกราะชั่วคราว',
      desc: 'เกร็งกล้ามเนื้อต้านพิษและแรงกระแทก ลดดาเมจที่ได้รับ'
    },
    subraces: [
      { name: 'Mountain Dwarf', perk: 'พละกำลังมหาศาล ใช้อาวุธหนักและโล่ยอดเยี่ยม', flaw: 'หัวรั้น ยึดติดธรรมเนียม' },
      { name: 'Deep Dwarf', perk: 'มองเห็นในที่มืด ตรวจจับแร่และผลึกมานาแม่นยำ', flaw: 'ตาสู้แสงแดดจ้าบนพื้นดินไม่ไหว' }
    ]
  },
  {
    id: 'beastfolk', icon: '🐺', name: 'เผ่าสรรพสัตว์', home: 'Wyldlands', power: 'Aura',
    baseStats: [13, 13, 12, 8, 11, 8],
    pros: 'พละกำลังและความคล่องตัวสูง ตรวจจับมอนสเตอร์ Miasma ได้ก่อนใคร',
    cons: 'ควบคุมอารมณ์ยาก หากโกรธจัดอาจเสียสติตามสัญชาตญาณสัตว์',
    racialSkill: {
      id: 'race_beast_sense', name: 'สัญชาตญาณล่า Miasma', icon: '🐾', type: 'Utility',
      cost: 0, range: '60 ft', hitBonus: 4, dice: null, effectLabel: 'ตรวจจับ/แกะรอย',
      desc: 'ดมกลิ่นตรวจจับศัตรูที่ซ่อนอยู่หรือมอนสเตอร์ติดเชื้อ Miasma'
    },
    subraces: [
      { name: 'เผ่าหมาป่า (Werewolf)', perk: 'ดมกลิ่นแกะรอยยอดเยี่ยม พลังพุ่งในร่างครึ่งหมาป่า', flaw: 'แพ้แร่เงิน (Silver) และคลั่งคืนจันทร์เต็มดวง' },
      { name: 'เผ่าเสือ / แมว', perk: 'ความเร็วสูง มองเห็นในที่มืด ปีนป่ายเก่ง', flaw: 'ตัวบางกว่าสายอื่น โดนเวทหนักร่วงง่าย' },
      { name: 'เผ่าหมี / กระทิง', perk: 'พลังโจมตีและป้องกันกายภาพสูงสุดในเผ่าสัตว์', flaw: 'ตัวใหญ่ อุ้ยอ้าย หลบหลีกช้า' }
    ]
  },
  {
    id: 'avian', icon: '🦅', name: 'เผ่าวิหก (Avians)', home: "Aethel's Kingdom", power: 'Aura / ลม',
    baseStats: [9, 14, 8, 11, 12, 10],
    pros: 'บินได้ คล่องตัวสูง ได้เปรียบด้านภูมิประเทศและการสอดแนม',
    cons: 'กระดูกกลวง รับแรงกระแทกหนักไม่ไหว ใส่เกราะหนักไม่ได้',
    racialSkill: {
      id: 'race_avian_gust', name: 'โผบินเวหา', icon: '🪽', type: 'Utility',
      cost: 0, range: '30 ft', hitBonus: 3, dice: null, effectLabel: 'หลบหลีก/บิน',
      desc: 'กางปีกบินข้ามสิ่งกีดขวางหรือขึ้นที่สูงเพื่อได้เปรียบในการโจมตี'
    },
    subraces: [
      { name: 'อินทรี / เหยี่ยว', perk: 'สายตาคมกริบมองไกลเป็นกิโลเมตร', flaw: 'สู้ในที่แคบหรือดันเจี้ยนใต้ดินลำบาก' },
      { name: 'นกฮูก / อีกา', perk: 'บินเงียบสนิท มองเห็นในความมืด ถนัดเวทลวงตา', flaw: 'พละกำลังกายน้อยที่สุดในเผ่าวิหก' },
      { name: 'ครุฑ (Garuda)', perk: 'ร่างกายคงทน แข็งแกร่ง ใส่เกราะได้', flaw: 'ตัวใหญ่ กินมานาเยอะเวลาบิน' }
    ]
  },
  {
    id: 'merfolk', icon: '🧜', name: 'เผ่าบาดาล', home: 'Tethys Depths', power: 'Magic (น้ำ)',
    baseStats: [10, 12, 10, 12, 11, 13],
    pros: 'หายใจใต้น้ำได้ แข็งแกร่งมหาศาลเมื่อสู้ในน้ำหรือใกล้แหล่งน้ำ',
    cons: 'แพ้อากาศแห้งและความร้อนจัด ต้องเติมความชุ่มชื้นเวลาขึ้นบก',
    racialSkill: {
      id: 'race_merfolk_tide', name: 'คลื่นมนตราบาดาล', icon: '🌊', type: 'Attack',
      cost: 0, range: '30 ft', hitBonus: 4, dice: '1d6+2', effectLabel: 'ดาเมจน้ำ',
      desc: 'ซัดคลื่นน้ำกระแทกศัตรูให้เสียหลัก (แรงขึ้น 2 เท่าเมื่ออยู่ใกล้น้ำ)'
    },
    subraces: [
      { name: 'เงือก (Merfolk)', perk: 'คล่องตัวใต้น้ำสูง เชี่ยวชาญตรีศูลผสานออร่าน้ำ', flaw: 'เดินบนบกช้า' },
      { name: 'ไซเรน (Siren)', perk: 'เสียงเพลงสะกดจิต ปั่นป่วนและล่อลวงศัตรู', flaw: 'บอบบาง โดนใบ้เวทแล้วไร้พลัง' },
      { name: 'นาก (Otterfolk)', perk: 'ขึ้นบกคล่องตัว แปลงร่างเป็นพญานากได้', flaw: 'แปลงร่างใช้มานามหาศาล' }
    ]
  },
  {
    id: 'vampire', icon: '🦇', name: 'แวมไพร์ & กูล', home: 'Realm of Night', power: 'โลหิต / Aura',
    baseStats: [12, 13, 11, 12, 9, 13],
    pros: 'ฟื้นฟูบาดแผลไว พละกำลังเหนือมนุษย์ มองเห็นในความมืดสนิท',
    cons: 'แพ้แสงแดดและพลังศักดิ์สิทธิ์ (Divine) 2 เท่า ต้องดื่มเลือดคงสติ',
    racialSkill: {
      id: 'race_vamp_bite', name: 'คมเขี้ยวดูดโลหิต', icon: '🩸', type: 'Attack',
      cost: 0, range: 'ประชิด', hitBonus: 4, dice: '1d6+2', effectLabel: 'ดาเมจ+ดูดเลือด',
      desc: 'กัดศัตรูเพื่อทำดาเมจและฟื้นฟู HP ตัวเองครึ่งหนึ่งของดาเมจ'
    },
    subraces: [
      { name: 'Ventrue (ขุนนาง)', perk: 'สะกดจิตสั่งการ (Dominate) & ทนทาน', flaw: 'ดื่มได้เฉพาะเลือดชนชั้นสูงหรือนักเวท' },
      { name: 'Toreador (ศิลปะ)', perk: 'เสน่ห์ลุ่มหลง (Presence) & ความเร็วสูง', flaw: 'หลงความงามจนอาจเหม่อกลางวงต่อสู้' },
      { name: 'Nosferatu (เงามืด)', perk: 'ล่องหนหายตัว (Obfuscate) & เครือข่ายข่าว', flaw: 'หน้าตาอุบาทว์และเป็นโรคซึมเศร้า' },
      { name: 'Tremere (เวทโลหิต)', perk: 'Blood Sorcery ระเบิดเลือดศัตรู', flaw: 'ร่างกายอ่อนแอ เสพติดเลือดนักเวท' },
      { name: 'กูล (Ghoul)', perk: 'หัวขาดก็ไม่ตาย แข็งแกร่งกว่ามนุษย์', flaw: 'แพ้พลังศักดิ์สิทธิ์ ไฟ และแสงแดด' }
    ]
  },
  {
    id: 'dragonoid', icon: '🐉', name: 'ดราโกนอยด์', home: 'Dragonoid Peaks', power: 'Aura / ธาตุ',
    baseStats: [14, 9, 13, 10, 10, 11],
    pros: 'เกล็ดธรรมชาติต้านทานเวทมนตร์ พละกำลังสูง มีลมหายใจธาตุ',
    cons: 'ประชากรน้อย หยิ่งทระนง ใกล้ Miasma เข้มข้นจะคลั่งคล้าย Hydra',
    racialSkill: {
      id: 'race_dragon_breath', name: 'ลมหายใจมังกร', icon: '🔥', type: 'Attack',
      cost: 0, range: '15 ft กรวย', hitBonus: 4, dice: '2d6', effectLabel: 'ดาเมจธาตุ',
      desc: 'พ่นเปลวไฟหรือไอเย็นใส่ศัตรูเป็นวงกว้าง (1 ครั้ง/ฉาก)'
    },
    subraces: [
      { name: 'สายเลือดเพลิง (Fire)', perk: 'พ่นไฟ ทนความร้อนสูง โจมตีรุนแรงสุด', flaw: 'ใจร้อน วู่วาม แพ้เวทน้ำแข็งรุนแรง' },
      { name: 'สายเลือดน้ำแข็ง (Frost)', perk: 'พ่นน้ำแข็ง สมาธิสูง ป้องกันกายภาพดี', flaw: 'แพ้ธาตุไฟ เคลื่อนไหวช้ากว่าสายเพลิง' }
    ]
  },
  {
    id: 'goblin', icon: '👺', name: 'ก็อบลิน (Goblins)', home: 'Mirewood Jungle', power: 'กับดัก / เวท',
    baseStats: [7, 13, 8, 14, 10, 9],
    pros: 'ฉลาดมาก เอาตัวรอดเก่ง เจ้าเล่ห์',
    cons: 'อายุขัยน้อย ร่างกายอ่อนแอกว่าเผ่าพันธุ์ใหญ่',
    racialSkill: {
      id: 'race_goblin_trick', name: 'ลูกไม้เจ้าเล่ห์', icon: '💣', type: 'Utility',
      cost: 0, range: '20 ft', hitBonus: 4, dice: '1d4+2', effectLabel: 'ป่วน/กับดัก',
      desc: 'ปาควันหรือวางกับดักจิ๋วใส่ศัตรูแล้วถอยฉากทันที'
    },
    subraces: [
      { name: 'เผ่าตัวเขียว (Green)', perk: 'ฉลาดวางกับดัก เล่ห์เหลี่ยมเยอะ', flaw: 'โรคจิต ไม่มีสติสัมปชัญญะ' },
      { name: 'เผ่าตัวฟ้า (Blue)', perk: 'เก่งเวทมนตร์ เรียนรู้วงเวทซับซ้อนไว', flaw: 'หมกมุ่นกับเวทจนเกือบสูญพันธุ์' },
      { name: 'เผ่าตัวเหลือง (Yellow)', perk: 'เก่งค้าขาย คุยกับออร์ครู้เรื่อง', flaw: 'ไม่เก่งเรื่องต่อสู้ด้วยตัวเอง' }
    ]
  }
];

export const CLASSES: ClassDef[] = [
  {
    id: 'mage', icon: '🔮', group: 'Magic', name: 'นักเวท (Mage)', cat: 'Magic (1-9 วงแหวน)',
    role: 'DPS เวทระยะไกล / ควบคุมพื้นที่', hp: 6, maxMp: 6, resName: 'Mana', mainStat: 'INT',
    pros: 'AoE สูงมาก พลิกแพลงคาถาได้หลากหลาย', cons: 'ตัวบาง ใช้เวลาร่าย หมด Mana Core แล้วไร้ทางสู้',
    subclasses: ['จอมเวทธาตุ (Elementalist)', 'นักเวทภูติ (Spirit Mage)', 'นักเวทโลหิต / เงา (Blood / Shadow)'],
    skills: [
      { id: 'mg_bolt', name: 'ศรเวทธาตุ (Arcane Bolt)', icon: '✨', type: 'Attack', cost: 0, range: '60 ft', hitBonus: 5, dice: '1d10', effectLabel: 'ดาเมจเวท', desc: 'ยิงกระสุนมานาพื้นฐาน ไม่เสีย Mana' },
      { id: 'mg_fire', name: 'ลูกไฟระเบิด (Fireball)', icon: '🔥', type: 'Attack', cost: 2, range: '60 ft (AoE)', hitBonus: 5, dice: '2d8+3', effectLabel: 'ดาเมจไฟ', desc: 'วงเวท 2: ระเบิดเปลวไฟใส่ศัตรูเป็นกลุ่ม' },
      { id: 'mg_shield', name: 'บาเรียมานา (Mana Shield)', icon: '💠', type: 'Buff', cost: 1, range: 'ตัวเอง', hitBonus: null, dice: '1d6+3', effectLabel: 'เกราะเวท', desc: 'กางโล่มานาลดดาเมจที่กำลังจะโดน' }
    ]
  },
  {
    id: 'warrior', icon: '⚔️', group: 'Aura', name: 'นักรบ (Warrior)', cat: 'Aura',
    role: 'แนวหน้า / รับแรงปะทะ / Aura Blade', hp: 10, maxMp: 4, resName: 'Aura', mainStat: 'STR',
    pros: 'HP สูง ใช้อาวุธ-เกราะได้ทุกชนิด ฟันตัดเวทได้', cons: 'แพ้เวทคุมจิตใจ ไม่มีสกิลฮีล',
    subclasses: ['จอมดาบ (Swordmaster)', 'นักรบเกราะหนัก (Vanguard)', 'นักรบคลั่ง (Berserker)'],
    skills: [
      { id: 'wr_slash', name: 'ฟันดาบหนัก (Heavy Slash)', icon: '⚔️', type: 'Attack', cost: 0, range: 'ประชิด', hitBonus: 5, dice: '1d8+3', effectLabel: 'ดาเมจกายภาพ', desc: 'โจมตีระยะประชิดมาตรฐาน ไม่ใช้ออร่า' },
      { id: 'wr_aura', name: 'Aura Blade (ดาบออร่า)', icon: '⚡', type: 'Attack', cost: 1, range: '15 ft', hitBonus: 6, dice: '2d6+3', effectLabel: 'ดาเมจออร่า', desc: 'เคลือบออร่าลงคมดาบ ฟันตัดเวทมนตร์และเกราะได้' },
      { id: 'wr_guard', name: 'ยืนหยัดแนวหน้า (Vanguard)', icon: '🛡️', type: 'Buff', cost: 1, range: 'ตัวเอง', hitBonus: null, dice: '1d8+2', effectLabel: 'บัฟป้องกัน', desc: 'แผ่ออร่าเคลือบเกราะ เพิ่มความอึดในเทิร์นนี้' }
    ]
  },
  {
    id: 'paladin', icon: '🛡️', group: 'Divine', name: 'พาลาดิน (Paladin)', cat: 'Divine (Faith Fall)',
    role: 'อัศวินแนวหน้า / เพลิงศักดิ์สิทธิ์', hp: 10, maxMp: 4, resName: 'Faith', mainStat: 'STR',
    pros: 'อึด ถึก โจมตีความมืด/Miasma แรงสุด (ต้าน Hydra)', cons: 'กฎศีลธรรมเข้มงวด ละเมิดคำสาบานเกิด Faith Fall',
    subclasses: ['Oath of Mercy (ความเมตตา)', 'Oath of Vengeance (ล้างแค้น)', 'Oath of Protection (ปกป้อง)', 'Oath of Retribution (ลงทัณฑ์)'],
    skills: [
      { id: 'pl_strike', name: 'ฟาดค้อน/ดาบ (Righteous Strike)', icon: '🔨', type: 'Attack', cost: 0, range: 'ประชิด', hitBonus: 5, dice: '1d8+3', effectLabel: 'ดาเมจกายภาพ', desc: 'โจมตีประชิดมาตรฐาน' },
      { id: 'pl_smite', name: 'เพลิงศักดิ์สิทธิ์ (Holy Smite)', icon: '☀️', type: 'Attack', cost: 1, range: 'ประชิด', hitBonus: 5, dice: '2d8+3', effectLabel: 'ดาเมจศักดิ์สิทธิ์', desc: 'เคลือบอาวุธด้วยแสงศักดิ์สิทธิ์ แรง 2 เท่าต่อ Miasma/Undead' },
      { id: 'pl_heal', name: 'ฝ่ามือรักษา (Lay on Hands)', icon: '💛', type: 'Heal', cost: 1, range: 'สัมผัส', hitBonus: null, dice: '1d8+3', effectLabel: 'ฟื้นฟู HP', desc: 'ถ่ายทอดพลังศรัทธารักษาบาดแผลให้เพื่อน' }
    ]
  },
  {
    id: 'priest', icon: '🕊️', group: 'Divine', name: 'พรีสต์ (Priest)', cat: 'Divine (Faith Fall)',
    role: 'รักษา / บาเรีย / ชำระล้าง Miasma', hp: 8, maxMp: 6, resName: 'Faith', mainStat: 'WIS',
    pros: 'ขาดไม่ได้ในดันเจี้ยน Miasma ชนะทาง Undead', cons: 'กายภาพต่ำ เสี่ยง Faith Fall หากศรัทธาสั่นคลอน',
    subclasses: ['สายรักษา / บาเรีย (Healer)', 'สายชำระล้าง (Purifier)', 'นักบวชเทพปัจเจก (Domain)'],
    skills: [
      { id: 'pr_heal', name: 'แสงแห่งการเยียวยา (Heal)', icon: '💚', type: 'Heal', cost: 1, range: '30 ft', hitBonus: null, dice: '1d8+4', effectLabel: 'ฟื้นฟู HP', desc: 'รักษาบาดแผลให้เพื่อนร่วมปาร์ตี้ 1 คน' },
      { id: 'pr_purify', name: 'ชำระล้าง Miasma (Purify)', icon: '✨', type: 'Attack', cost: 1, range: '30 ft', hitBonus: 5, dice: '2d6+3', effectLabel: 'ดาเมจแสง/ล้างพิษ', desc: 'เผาผลาญมอนสเตอร์ Miasma/Undead และถอนคำสาป' },
      { id: 'pr_ward', name: 'โดมแสงศักดิ์สิทธิ์ (Ward)', icon: '🕊️', type: 'Buff', cost: 2, range: '20 ft (AoE)', hitBonus: null, dice: '1d6+2', effectLabel: 'บาเรียกลุ่ม', desc: 'กางบาเรียแสงป้องกันการโจมตีให้ทั้งทีม' }
    ]
  },
  {
    id: 'rogue', icon: '🗡️', group: 'Aura', name: 'มือสังหาร / โจร (Rogue)', cat: 'Aura',
    role: 'ลอบเร้น / ปลดกับดัก / Burst ดาเมจ', hp: 8, maxMp: 4, resName: 'Aura', mainStat: 'DEX',
    pros: 'Burst จุดตายแรงสุด หลบหลีกเก่ง', cons: 'ตัวบาง ไม่เหมาะปะทะตรง ๆ ยืดเยื้อ',
    subclasses: ['นักฆ่าเงา (Shadow Assassin)', 'นักล่าสมบัติ / ปลดกับดัก (Dungeon Delver)'],
    skills: [
      { id: 'rg_stab', name: 'มีดสั้นลอบสังหาร (Sneak Attack)', icon: '🗡️', type: 'Attack', cost: 0, range: 'ประชิด', hitBonus: 6, dice: '2d6+3', effectLabel: 'ดาเมจจุดตาย', desc: 'โจมตีจุดตายจากมุมอับ (แรงมากเมื่อเพื่อนดึงความสนใจ)' },
      { id: 'rg_shadow', name: 'ก้าวเงาลบตัวตน (Shadow Step)', icon: '🌑', type: 'Utility', cost: 1, range: '30 ft', hitBonus: 6, dice: null, effectLabel: 'ลอบเร้น', desc: 'ใช้ออร่าลบตัวตน หลบการตรวจจับและย้ายตำแหน่ง' },
      { id: 'rg_trap', name: 'ปลดกลไก & กับดัก (Disarm)', icon: '🔓', type: 'Utility', cost: 0, range: 'สัมผัส', hitBonus: 6, dice: null, effectLabel: 'เช็กปลดกับดัก', desc: 'ตรวจสอบและปลดกับดักโบราณหรือไอหมอก Miasma' }
    ]
  },
  {
    id: 'ranger', icon: '🏹', group: 'Aura', name: 'นักล่า / พลธนู (Ranger)', cat: 'Aura',
    role: 'ดาเมจระยะไกล / แกะรอย / นำทาง', hp: 10, maxMp: 4, resName: 'Aura', mainStat: 'DEX',
    pros: 'ลูกธนูเคลือบออร่าทะลุเกราะ เอาตัวรอดในป่าเก่ง', cons: 'เสียเปรียบเมื่อโดนประชิด ต้องบริหารลูกธนู',
    subclasses: ['นักล่า Miasma (Blight Hunter)', 'พลซุ่มยิงเวหา (Marksman)'],
    skills: [
      { id: 'rn_shot', name: 'ศรออร่าทะลุเกราะ (Aura Arrow)', icon: '🏹', type: 'Attack', cost: 0, range: '80 ft', hitBonus: 6, dice: '1d8+3', effectLabel: 'ดาเมจระยะไกล', desc: 'ยิงธนูเคลือบออร่าแม่นยำสูง' },
      { id: 'rn_blight', name: 'ศรเงินต้าน Miasma (Blight Shot)', icon: '🥈', type: 'Attack', cost: 1, range: '80 ft', hitBonus: 6, dice: '2d8+3', effectLabel: 'ดาเมจต้านMiasma', desc: 'ลูกธนูเคลือบแร่เงิน เจาะจุดอ่อนสัตว์กลายพันธุ์' },
      { id: 'rn_track', name: 'แกะรอย & นำทาง (Survival)', icon: '🧭', type: 'Utility', cost: 0, range: 'พื้นที่', hitBonus: 5, dice: null, effectLabel: 'เช็กแกะรอย', desc: 'อ่านรอยเท้าและหาเส้นทางปลอดภัยในป่า' }
    ]
  },
  {
    id: 'summoner', icon: '🌀', group: 'Magic', name: 'นักอัญเชิญ (Summoner)', cat: 'Magic (1-9 วงแหวน)',
    role: 'คุมกองทัพย่อม / แทงค์แทนเพื่อน', hp: 6, maxMp: 6, resName: 'Mana', mainStat: 'INT',
    pros: 'ได้เปรียบด้านจำนวน ส่งอัญเชิญไปเช็กกับดักได้', cons: 'ตัวผู้ร่ายอ่อนแอ โดนตีตรง ๆ สัตว์อัญเชิญสลาย',
    subclasses: ['ผู้อัญเชิญวิญญาณธาตุ', 'เนโครแมนเซอร์ (Necromancer)'],
    skills: [
      { id: 'sm_call', name: 'อัญเชิญโกเลม/ลูกสมุน', icon: '🗿', type: 'Buff', cost: 2, range: '30 ft', hitBonus: null, dice: '2d6+4', effectLabel: 'HP สัตว์อัญเชิญ', desc: 'เรียกโกเลมธาตุหรือซากศพมาช่วยแทงค์และสำรวจกับดัก' },
      { id: 'sm_command', name: 'สั่งโจมตีประสาน', icon: '🌀', type: 'Attack', cost: 0, range: '30 ft', hitBonus: 5, dice: '1d8+3', effectLabel: 'ดาเมจลูกสมุน', desc: 'สั่งสัตว์อัญเชิญเข้าโจมตีเป้าหมาย' }
    ]
  },
  {
    id: 'warlock', icon: '👁️', group: 'Magic', name: 'ผู้ทำพันธสัญญา (Warlock)', cat: 'Magic (ทางลัด)',
    role: 'เวทคำสาป / ลอบเร้น', hp: 8, maxMp: 3, resName: 'Pact', mainStat: 'CHA',
    pros: 'ได้พลังรุนแรงไว ฟื้นพลังจากการพักสั้น ๆ', cons: 'ช่องเวทน้อย ต้องทำตามเงื่อนไขเจ้าของสัญญา',
    subclasses: ['พันธสัญญาเทพแห่งความลึกลับ', 'พันธสัญญาความมืด / สัตว์เทวะ'],
    skills: [
      { id: 'wl_blast', name: 'ลำแสงต้องสาป (Eldritch)', icon: '👁️', type: 'Attack', cost: 0, range: '60 ft', hitBonus: 5, dice: '1d10+3', effectLabel: 'ดาเมจคำสาป', desc: 'ยิงคลื่นพลังจากพันธสัญญา ไม่เสียช่องเวท' },
      { id: 'wl_hex', name: 'คำสาปบิดเบือน (Hex)', icon: '🟣', type: 'Attack', cost: 1, range: '40 ft', hitBonus: 5, dice: '2d6+3', effectLabel: 'ดาเมจ+ดีบัฟ', desc: 'สาปศัตรูให้อ่อนแอลงและรับดาเมจต่อเนื่อง' }
    ]
  },
  {
    id: 'spellsword', icon: '⚡', group: 'Hybrid', name: 'นักรบเวท (Spellsword)', cat: 'Hybrid (Magic+Aura)',
    role: 'แนวหน้า-กลาง สลับฟันออร่าและร่ายเวท', hp: 9, maxMp: 5, resName: 'Flux', mainStat: 'INT',
    pros: 'ยืดหยุ่นสูง รับมือได้ทั้งเกราะหนาและต้านเวท', cons: 'เก่งไม่สุดสักทาง หมดแรงไว',
    subclasses: ['อัศวินอาคม (Runeblade)'],
    skills: [
      { id: 'ss_rune', name: 'ดาบรูนระเบิดธาตุ (Runeblade)', icon: '⚡', type: 'Attack', cost: 1, range: 'ประชิด', hitBonus: 5, dice: '2d6+3', effectLabel: 'ดาเมจผสมธาตุ', desc: 'สลักวงเวทลงดาบ ฟันพร้อมระเบิดธาตุใส่อาวุธ' },
      { id: 'ss_slash', name: 'ฟันออร่าประชิด', icon: '⚔️', type: 'Attack', cost: 0, range: 'ประชิด', hitBonus: 4, dice: '1d8+2', effectLabel: 'ดาเมจกายภาพ', desc: 'โจมตีพื้นฐานด้วยดาบ' }
    ]
  },
  {
    id: 'artificer', icon: '⚗️', group: 'Hybrid', name: 'ช่างประดิษฐ์ / แปรธาตุ', cat: 'Hybrid / Craft',
    role: 'สร้างอุปกรณ์เวท / ยา / อาวุธต้องสาป', hp: 8, maxMp: 5, resName: 'Reagent', mainStat: 'INT',
    pros: 'เปลี่ยนชิ้นส่วนมอนและผลึก Miasma เป็นของเทพ', cons: 'ต้องใช้เวลา เงิน และวัตถุดิบ',
    subclasses: ['ช่างตีอาวุธต้องสาป (Runesmith)', 'นักปรุงยา / ระเบิดมานา (Alchemist)'],
    skills: [
      { id: 'af_bomb', name: 'ระเบิดขวดมานา (Mana Bomb)', icon: '💣', type: 'Attack', cost: 1, range: '30 ft', hitBonus: 5, dice: '2d6+2', effectLabel: 'ดาเมจระเบิด', desc: 'ขว้างขวดแปรธาตุระเบิดใส่ศัตรู' },
      { id: 'af_elixir', name: 'ยาต้าน Miasma ฉุกเฉิน', icon: '🧪', type: 'Heal', cost: 1, range: 'สัมผัส', hitBonus: null, dice: '1d6+3', effectLabel: 'ฟื้นฟู+ต้านพิษ', desc: 'ให้เพื่อนดื่มยาฟื้นพลังและกันพิษ' }
    ]
  },
  {
    id: 'bard', icon: '🎵', group: 'Hybrid', name: 'กวี / นักขับขาน (Bard)', cat: 'Hybrid / Support',
    role: 'บัฟทีม / ดีบัฟ / เจรจา', hp: 8, maxMp: 5, resName: 'Inspire', mainStat: 'CHA',
    pros: 'เสริมพลังได้ทุกสาย เก่งข่าวลือและโน้มน้าวใจ', cons: 'ดาเมจเดี่ยวต่ำ พึ่งพาเสียง',
    subclasses: ['นักขับขานแห่งตำนาน (Lore Bard)', 'นักร้องสะกดจิต (Siren Bard)'],
    skills: [
      { id: 'bd_song', name: 'บทเพลงปลุกขวัญ (Inspire)', icon: '🎵', type: 'Buff', cost: 1, range: '30 ft', hitBonus: null, dice: '1d6', effectLabel: 'โบนัสลูกเต๋า', desc: 'มอบลูกเต๋า +1d6 ให้เพื่อนใช้บวกการทอยครั้งต่อไป' },
      { id: 'bd_charm', name: 'คลื่นเสียงสะกดจิต', icon: '💫', type: 'Utility', cost: 1, range: '30 ft', hitBonus: 5, dice: null, effectLabel: 'เช็กสะกดจิต', desc: 'ทำให้ศัตรูสับสนหรือโน้มน้าวใจ NPC (ไม่ได้ผลกับกูล)' }
    ]
  },
  {
    id: 'merchant', icon: '💰', group: 'Lifestyle', name: 'พ่อค้า (Merchant)', cat: 'อาชีพรอง',
    role: 'ค้าขาย / ต่อรอง / เสบียง', hp: 6, maxMp: 3, resName: 'Credit', mainStat: 'CHA',
    pros: 'หาเงินเก่ง ซื้อของถูก มีเส้นสายคาราวาน', cons: 'ไร้ทักษะต่อสู้ ต้องจ้างบอดี้การ์ด',
    subclasses: ['พ่อค้าคาราวาน', 'พ่อค้าตลาดมืด', 'พ่อค้าพันธสัญญา'],
    skills: [
      { id: 'mc_deal', name: 'เจรจาต่อรอง (Bargain)', icon: '🤝', type: 'Utility', cost: 0, range: 'สนทนา', hitBonus: 6, dice: null, effectLabel: 'เช็กเจรจา', desc: 'ต่อรองราคาซื้อขายหรือติดสินบนเพื่อผ่านทาง' }
    ]
  },
  {
    id: 'blacksmith', icon: '🔨', group: 'Lifestyle', name: 'ช่างตีเหล็ก (Blacksmith)', cat: 'อาชีพรอง',
    role: 'ซ่อมเกราะ / ตีอาวุธ', hp: 8, maxMp: 3, resName: 'Forge', mainStat: 'STR',
    pros: 'ซ่อมของกลางทาง ตีอาวุธมานาหรือต้องสาป', cons: 'เคลื่อนที่ช้า แบกเครื่องมือหนัก',
    subclasses: ['ช่างตีอาวุธมานา / รูน', 'ช่างตีอาวุธต้องสาป'],
    skills: [
      { id: 'bs_repair', name: 'ลับคม & ซ่อมเกราะ', icon: '🔨', type: 'Buff', cost: 1, range: 'สัมผัส', hitBonus: null, dice: '1d4+1', effectLabel: 'บัฟอาวุธ/เกราะ', desc: 'ซ่อมอุปกรณ์และเพิ่มความคมให้เพื่อนกลางทาง' }
    ]
  },
  {
    id: 'scholar', icon: '📜', group: 'Lifestyle', name: 'นักประเมิน & โบราณคดี', cat: 'อาชีพรอง',
    role: 'ตรวจ Ancient Artifact / อ่านจารึก', hp: 6, maxMp: 3, resName: 'Lore', mainStat: 'INT',
    pros: 'ปลดล็อกพลัง Artifact และเลี่ยงคำสาป', cons: 'ร่างกายอ่อนแอ ไม่ถนัดสู้',
    subclasses: ['นักโบราณคดีดันเจี้ยน'],
    skills: [
      { id: 'sc_eval', name: 'ประเมิน Artifact & อ่านจารึก', icon: '🔍', type: 'Utility', cost: 0, range: 'สัมผัส', hitBonus: 6, dice: null, effectLabel: 'เช็กความรู้', desc: 'ตรวจสอบไอเทมโบราณและหาทางลับในดันเจี้ยน' }
    ]
  },
  {
    id: 'herbalist', icon: '🌿', group: 'Lifestyle', name: 'นักสมุนไพร & พ่อครัว', cat: 'อาชีพรอง',
    role: 'เก็บสมุนไพรกลายพันธุ์ / ทำอาหารบัฟ', hp: 7, maxMp: 3, resName: 'Herb', mainStat: 'WIS',
    pros: 'ประหยัดค่ายา ทำอาหารต้าน Miasma', cons: 'ปรุงพลาดอาจทำปาร์ตี้ติดพิษ',
    subclasses: ['เชฟวัตถุดิบมอนสเตอร์'],
    skills: [
      { id: 'hb_cook', name: 'ปรุงอาหารต้าน Miasma', icon: '🍲', type: 'Heal', cost: 1, range: 'ปาร์ตี้', hitBonus: null, dice: '1d6+2', effectLabel: 'ฟื้นฟูกลุ่ม', desc: 'ปรุงวัตถุดิบสมุนไพรฟื้นฟู HP และกันพิษ' }
    ]
  },
  {
    id: 'broker', icon: '🕵️', group: 'Lifestyle', name: 'สายข่าว / นายหน้ากิลด์', cat: 'อาชีพรอง',
    role: 'หาข่าวลับ / ดันเจี้ยนลับ', hp: 7, maxMp: 3, resName: 'Intel', mainStat: 'CHA',
    pros: 'รู้ความเคลื่อนไหว 8 อาณาจักร หาพิกัด Artifact', cons: 'ศัตรูเยอะเพราะรู้ความลับคนอื่น',
    subclasses: ['นายหน้าข่าวสาร Crosshaven'],
    skills: [
      { id: 'bk_intel', name: 'สืบข่าวลับ (Gather Info)', icon: '🕵️', type: 'Utility', cost: 0, range: 'เมือง', hitBonus: 6, dice: null, effectLabel: 'เช็กข่าวสาร', desc: 'ล้วงข้อมูลเควสต์ลับและจุดอ่อนเป้าหมาย' }
    ]
  }
];

export const ACTS: Record<string | number, { title: string; badge: string; mapImg: string; narration: string }> = {
  1: {
    title: 'Act 1: เมืองท่าเสรี Crosshaven',
    badge: 'Roleplay & สืบข่าว',
    mapImg: '/maps/act1.jpg',
    narration: 'แสงแดดยามเช้าส่องลงบนท่าเรือเสรีครอสเฮเวน เมืองการค้าที่คลาคล่ำไปด้วยผู้คนหลากเผ่าพันธุ์... ป้ายประกาศหน้ากิลด์มีใบปลิวแปะไว้ว่า "ตามหานักปรุงยาฝึกหัดหายตัวไป — ค่าตอบแทน 25 Gold/คน"'
  },
  2: {
    title: 'Act 2: ชายป่าศักดิ์สิทธิ์เอลฟ์',
    badge: 'Exploration & แกะรอย',
    mapImg: '/maps/act2.jpg',
    narration: 'ปาร์ตี้เดินเท้าออกจาก Crosshaven ไปยังทุ่งหญ้าริมชายป่าศักดิ์สิทธิ์ พบตะกร้าสมุนไพรของโทมัสตกอยู่ข้างทาง พร้อมรอยเท้าที่หนีเข้าไปในถ้ำหินเก่าที่มีไอหมอกสีม่วงจาง ๆ ลอยออกมา...'
  },
  3: {
    title: 'Act 3: ถ้ำหิน & ผลึก Miasma',
    badge: 'Combat (Level 1)',
    mapImg: '/maps/act3.jpg',
    narration: 'ภายในถ้ำหิน พบโทมัสขาแพลงปีนหลบอยู่บนโขดหินใหญ่ ด้านล่างมีก็อบลินตัวเขียวคลั่ง 2 ตัว และหมาป่าติดเชื้อ Miasma ตาสีม่วงดำ 1 ตัวกำลังคำราม!'
  },
  world: {
    title: 'แผนที่โลก Aethelgard (8 อาณาจักร)',
    badge: 'World Map',
    mapImg: '/maps/world.jpg',
    narration: 'ทวีป Aethelgard ในภาวะสงบศึกเย็นระหว่าง 8 ขั้วอำนาจ โดยมีหลุมอุกกาบาตลูกที่ 2 (Poison Lake) เป็นแหล่งกำเนิด Miasma'
  }
};
