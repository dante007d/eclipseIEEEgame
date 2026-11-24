/**
 * Lightweight Web Audio synthesizer for Project Eclipse.
 * Off by default per specification; toggled by the user.
 */

class EclipseAudio {
  private enabled = false;
  private ctx: AudioContext | null = null;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureCtx();
      this.playTone(520, 0.08, 'sine', 0.08);
    }
    return this.enabled;
  }

  private ensureCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'triangle', gainPeak = 0.12, delay = 0) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playAdvance(): void {
    this.playTone(440, 0.14, 'triangle', 0.1, 0);
    this.playTone(554.37, 0.14, 'triangle', 0.1, 0.07);
    this.playTone(659.25, 0.25, 'sine', 0.12, 0.14);
  }

  public playReturn(): void {
    this.playTone(392, 0.12, 'triangle', 0.1, 0);
    this.playTone(523.25, 0.22, 'sine', 0.12, 0.09);
  }

  public playFall(room = 1): void {
    const base = Math.max(120, 260 - room * 35);
    this.playTone(base, 0.2, 'sawtooth', 0.09, 0);
    this.playTone(base * 0.72, 0.28, 'sawtooth', 0.09, 0.12);
  }

  public playReset(): void {
    this.playTone(180, 0.28, 'sawtooth', 0.14, 0);
    this.playTone(130, 0.35, 'sawtooth', 0.14, 0.18);
    this.playTone(85, 0.55, 'sawtooth', 0.16, 0.36);
  }

  public playVictory(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, 0.32, 'triangle', 0.12, i * 0.11);
    });
  }

  public playTick(): void {
    this.playTone(880, 0.05, 'sine', 0.04, 0);
  }
}

export const soundFX = new EclipseAudio();
