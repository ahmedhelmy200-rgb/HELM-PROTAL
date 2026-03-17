let audioContext = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

function play(freq = 440, duration = 0.06, type = 'sine', volume = 0.02) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

export function playUiTone(name, enabled = true) {
  if (!enabled) return;
  switch (name) {
    case 'toggle':
      play(560, 0.05, 'triangle', 0.018);
      window.setTimeout(() => play(760, 0.04, 'sine', 0.014), 36);
      break;
    case 'nav':
      play(480, 0.045, 'sine', 0.013);
      break;
    case 'save':
      play(620, 0.04, 'triangle', 0.02);
      window.setTimeout(() => play(920, 0.08, 'triangle', 0.015), 50);
      break;
    default:
      play(440, 0.04, 'sine', 0.012);
  }
}
