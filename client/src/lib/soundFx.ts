// Lightweight Web Audio API sound synthesizer (no external audio files required)

let audioCtx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('aethelgard_muted') === '1';
} catch {
  muted = false;
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem('aethelgard_muted', next ? '1' : '0');
  } catch {
    // ignore
  }
}

function getCtx(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(gainVal, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export function playDiceRoll() {
  // Rapid percussive clicks simulating dice rattle
  [0, 0.06, 0.13, 0.21, 0.3].forEach((d, i) => {
    tone(320 + i * 70, 0.045, 'triangle', 0.07, d);
  });
}

export function playCrit() {
  // Triumphant major arpeggio fanfare
  tone(523.25, 0.14, 'triangle', 0.1, 0);
  tone(659.25, 0.14, 'triangle', 0.1, 0.09);
  tone(783.99, 0.16, 'triangle', 0.11, 0.18);
  tone(1046.5, 0.35, 'triangle', 0.12, 0.27);
}

export function playFumble() {
  // Descending comedic wah-wah
  tone(311.13, 0.16, 'sawtooth', 0.05, 0);
  tone(277.18, 0.16, 'sawtooth', 0.05, 0.14);
  tone(233.08, 0.32, 'sawtooth', 0.06, 0.28);
}

export function playHit() {
  tone(160, 0.1, 'square', 0.07, 0);
  tone(95, 0.14, 'sawtooth', 0.07, 0.04);
}

export function playHeal() {
  tone(587.33, 0.14, 'sine', 0.07, 0);
  tone(880, 0.25, 'sine', 0.08, 0.1);
}

export function playNotice() {
  tone(440, 0.15, 'triangle', 0.08, 0);
  tone(659.25, 0.3, 'triangle', 0.09, 0.12);
}
