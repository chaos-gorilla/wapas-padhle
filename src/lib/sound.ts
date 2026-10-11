/**
 * Tactile audio feedback utility using Web Audio API.
 * Provides micro-haptic sound feedback for card selection and reviews.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('wapas_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wapas_sound_enabled', enabled ? 'true' : 'false');
}

/**
 * Crisp 1980s mechanical switch click sound (tactile pop with secondary dampening snap)
 */
export function playClickSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Primary mechanical contact click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(420, now + 0.018);
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.018);

    // Secondary body resonance snap
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(320, now + 0.005);
    osc2.frequency.exponentialRampToValueAtTime(140, now + 0.035);
    gain2.gain.setValueAtTime(0.05, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.005);
    osc2.stop(now + 0.035);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Calm, uplifting chime for mastering or completing a review
 */
export function playMasteredChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 triad

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const noteTime = now + idx * 0.055;

      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.035, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  } catch {
    // Ignore
  }
}
