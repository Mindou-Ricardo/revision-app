// Synthétiseur d'effets sonores utilisant l'API Web Audio native (0 fichier externe, 100% autonome)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.isMuted = localStorage.getItem('revision_sound_muted') === 'true';
      } catch {
        // localStorage indisponible
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('revision_sound_muted', String(this.isMuted));
    } catch {
      // localStorage indisponible
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Son court et satisfaisant à chaque répétition validée
  public playRepetitionTick(repNumber: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch monte subtilement au fur et à mesure qu'on approche de 21 (de 440Hz à 750Hz)
      const baseFreq = 480 + (repNumber * 12);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext bloqué ou indisponible
    }
  }

  // Fanfare / carillon de victoire lors de la 21e répétition
  public playVictoryChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Do, Mi, Sol, Do (octave sup)
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + index * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // AudioContext bloqué ou indisponible
    }
  }
}

export const sound = new SoundManager();
