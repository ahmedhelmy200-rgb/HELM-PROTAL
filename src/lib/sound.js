let audioContext = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function arcSpark({ start = 1180, end = 360, duration = 0.075, volume = 0.018, type = 'sawtooth', q = 6 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(start * 0.9, now);
  filter.Q.value = q;
  osc.type = type;
  osc.frequency.setValueAtTime(start, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, end), now + duration);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function noiseBurst({ duration = 0.03, volume = 0.012, band = 2200 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'highpass';
  filter.frequency.value = band;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

function electricTick({ start, end, duration, volume, delay = 0, noise = true }) {
  window.setTimeout(() => {
    arcSpark({ start, end, duration, volume, type: 'sawtooth' });
    if (noise) noiseBurst({ duration: Math.max(0.018, duration * 0.58), volume: volume * 0.52, band: Math.max(1400, start * 1.1) });
  }, delay);
}

export function playUiTone(name, enabled = true) {
  if (!enabled) return;
  switch (name) {
    case 'toggle':
      electricTick({ start: 1450, end: 540, duration: 0.05, volume: 0.016 });
      electricTick({ start: 980, end: 420, duration: 0.06, volume: 0.011, delay: 24 });
      break;
    case 'nav':
      electricTick({ start: 1280, end: 480, duration: 0.042, volume: 0.012 });
      electricTick({ start: 760, end: 300, duration: 0.038, volume: 0.0085, delay: 14, noise: false });
      break;
    case 'save':
      electricTick({ start: 1520, end: 620, duration: 0.052, volume: 0.018 });
      electricTick({ start: 1120, end: 420, duration: 0.068, volume: 0.013, delay: 26 });
      electricTick({ start: 720, end: 260, duration: 0.085, volume: 0.009, delay: 52, noise: false });
      break;
    default:
      electricTick({ start: 1180, end: 420, duration: 0.04, volume: 0.011 });
  }
}
