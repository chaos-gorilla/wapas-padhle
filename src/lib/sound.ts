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
 * Subtle tactile switch click sound (18ms soft sine pop)
 */
export function playClickSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
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
