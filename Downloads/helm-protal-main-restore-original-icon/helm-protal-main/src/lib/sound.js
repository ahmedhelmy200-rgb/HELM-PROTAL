let audioContext = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function spark(freq = 440, duration = 0.07, type = 'sawtooth', volume = 0.018, endFreq = null) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 380;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playUiTone(name, enabled = true) {
  if (!enabled) return;
  switch (name) {
    case 'toggle':
      spark(720, 0.045, 'sawtooth', 0.02, 1180);
      window.setTimeout(() => spark(520, 0.055, 'triangle', 0.012, 880), 30);
      break;
    case 'nav':
      spark(410, 0.04, 'triangle', 0.012, 620);
      break;
    case 'save':
      spark(540, 0.05, 'sawtooth', 0.02, 780);
      window.setTimeout(() => spark(980, 0.08, 'triangle', 0.015, 1320), 52);
      break;
    default:
      spark(480, 0.035, 'triangle', 0.012, 640);
  }
}
