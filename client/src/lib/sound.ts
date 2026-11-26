/**
 * Project Eclipse – AFX (Audio Effects & Quiet Ambient Loop)
 * Short, restrained Web Audio synthesis with mute & volume control.
 * Fails gracefully if audio playback is blocked or unsupported.
 */

class EclipseAudioEngine {
  private readonly volume = 1; // locked at full output; no mute or volume UI
  private ctx: AudioContext | null = null;
  private failAudio: HTMLAudioElement | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const shutdown = () => this.shutdown();
      window.addEventListener('pagehide', shutdown);
      window.addEventListener('beforeunload', shutdown);
    }
  }

  public isMuted(): boolean {
    return false;
  }

  public isEnabled(): boolean {
    return true;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(_v: number): void {
    // Volume/mute controls removed; audio stays enabled until website closes.
  }

  public toggleMute(): boolean {
    this.unlockOnInteraction();
    return true;
  }

  public toggle(): boolean {
    return this.toggleMute();
  }

  private getFailAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.failAudio) {
      this.failAudio = new Audio('/audio/fail-song.mp3');
      this.failAudio.preload = 'auto';
    }
    this.failAudio.volume = this.volume;
    return this.failAudio;
  }

  public playFailSong(): void {
    const audio = this.getFailAudio();
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.volume;
      void audio.play().catch(() => {});
    } catch {
      // ignore playback errors
    }
  }

  public shutdown(): void {
    try {
      if (this.failAudio) {
        this.failAudio.pause();
        this.failAudio.currentTime = 0;
      }
      this.stopAmbient();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close().catch(() => {});
      }
      this.ctx = null;
    } catch {
      // ignore cleanup errors
    }
  }

  /** Enable audio after explicit user interaction (e.g. clicking Join / Start) */
  public unlockOnInteraction(): void {
    this.ensureCtx();
    this.getFailAudio();
    this.startAmbient();
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    peak = 0.08,
    delay = 0,
    freqEnd?: number
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx || this.volume <= 0) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
      }
      const vol = peak * this.volume;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch {
      // continue silently if playback is blocked
    }
  }

  /** Quiet ambient loop (called after player interaction, stopped at match end) */
  public startAmbient(): void {
    if (this.ambientOsc1) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    try {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 210;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.025 * this.volume), ctx.currentTime + 1.2);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 65.41; // C2 warm sub drone

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = 98.0; // G2 subtle fifth

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      this.ambientOsc1 = osc1;
      this.ambientOsc2 = osc2;
      this.ambientGain = gain;
    } catch {
      // ignore
    }
  }

  public stopAmbient(): void {
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
      }
      const o1 = this.ambientOsc1;
      const o2 = this.ambientOsc2;
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientGain = null;
      setTimeout(() => {
        try {
          o1?.stop();
          o2?.stop();
        } catch {
          // ignore
        }
      }, 450);
    } catch {
      // ignore
    }
  }

  // ── AFX Table Events ──────────────────────────────────────────────────────

  /** Button press: Soft stone click */
  public playButtonClick(): void {
    this.tone(240, 0.045, 'triangle', 0.06, 0, 120);
  }

  /** Match joined: Low rising chime */
  public playMatchJoined(): void {
    this.tone(196, 0.18, 'sine', 0.07, 0);
    this.tone(293.66, 0.25, 'triangle', 0.07, 0.09);
  }

  /** Countdown begins: Single muted bell */
  public playCountdownBegin(): void {
    this.tone(330, 0.35, 'sine', 0.06, 0, 326);
  }

  /** Timer warning: Quiet tick once per second under 10s */
  public playTick(): void {
    this.tone(680, 0.035, 'sine', 0.035, 0, 520);
  }

  /** Correct answer: Warm two-note chime */
  public playCorrect(): void {
    this.tone(440, 0.14, 'sine', 0.09, 0);
    this.tone(587.33, 0.26, 'triangle', 0.09, 0.08);
  }

  /** Incorrect answer / failure: Low impact + custom failure track */
  public playIncorrect(): void {
    this.tone(150, 0.18, 'triangle', 0.09, 0, 85);
    this.playFailSong();
  }

  /** Enter recovery room: Brief airy stone-door transition */
  public playEnterRecovery(room = 1): void {
    const base = Math.max(95, 190 - room * 20);
    this.tone(base, 0.28, 'sine', 0.08, 0, base * 0.65);
    this.tone(base * 1.25, 0.22, 'triangle', 0.04, 0.05, base * 0.8);
  }

  /** Return to main progression: Upward resolving chime */
  public playReturn(): void {
    this.tone(349.23, 0.14, 'sine', 0.08, 0);
    this.tone(440, 0.16, 'sine', 0.08, 0.08);
    this.tone(523.25, 0.26, 'triangle', 0.09, 0.16);
  }

  /** Level cleared: Short bright orchestral flourish */
  public playLevelCleared(): void {
    this.tone(440, 0.12, 'triangle', 0.08, 0);
    this.tone(554.37, 0.12, 'triangle', 0.08, 0.07);
    this.tone(659.25, 0.24, 'sine', 0.1, 0.14);
  }

  /** Reset to Level 0: Low, soft descending tone */
  public playReset(): void {
    this.tone(190, 0.26, 'sine', 0.09, 0, 140);
    this.tone(140, 0.34, 'sine', 0.09, 0.18, 92);
    this.tone(92, 0.45, 'triangle', 0.08, 0.36, 65);
  }

  /** Level 60 Victory */
  public playVictory(): void {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      this.tone(f, 0.3, 'triangle', 0.09, i * 0.1);
    });
  }
}

export const soundFX = new EclipseAudioEngine();
