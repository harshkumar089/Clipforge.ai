import { SfxType } from '../types/index.js';

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play a sound effect with customizable volume (0 - 1.5)
   */
  public play(type: SfxType, volume = 1.0): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1.5, volume));
      gain.connect(ctx.destination);

      switch (type) {
        case 'whoosh':
          this.synthesizeWhoosh(ctx, gain, now);
          break;
        case 'ding':
          this.synthesizeDing(ctx, gain, now);
          break;
        case 'pop':
          this.synthesizePop(ctx, gain, now);
          break;
        case 'shutter':
          this.synthesizeShutter(ctx, gain, now);
          break;
        case 'thud':
          this.synthesizeVineThud(ctx, gain, now);
          break;
        case 'glitch':
          this.synthesizeGlitch(ctx, gain, now);
          break;
        case 'airhorn':
          this.synthesizeAirhorn(ctx, gain, now);
          break;
        case 'cheer':
          this.synthesizeCheer(ctx, gain, now);
          break;
        default:
          this.synthesizePop(ctx, gain, now);
      }
    } catch (e) {
      console.warn('Could not synthesize SFX:', e);
    }
  }

  // Whoosh: Sweeping bandpass filtered noise
  private synthesizeWhoosh(ctx: AudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(3200, time + 0.2);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.45);
    filter.Q.value = 3.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.01, time);
    env.gain.linearRampToValueAtTime(0.9, time + 0.18);
    env.gain.exponentialRampToValueAtTime(0.01, time + 0.45);

    noise.connect(filter);
    filter.connect(env);
    env.connect(dest);

    noise.start(time);
    noise.stop(time + 0.45);
  }

  // Ding: Crystal chime harmonics
  private synthesizeDing(ctx: AudioContext, dest: AudioNode, time: number) {
    [1200, 2400, 3600].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const amp = idx === 0 ? 0.6 : idx === 1 ? 0.3 : 0.15;
      env.gain.setValueAtTime(amp, time);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.8 + idx * 0.2);

      osc.connect(env);
      env.connect(dest);

      osc.start(time);
      osc.stop(time + 1.2);
    });
  }

  // Pop: Bubble snap
  private synthesizePop(ctx: AudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    env.gain.setValueAtTime(0.9, time);
    env.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

    osc.connect(env);
    env.connect(dest);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Camera Shutter: Two fast clicks
  private synthesizeShutter(ctx: AudioContext, dest: AudioNode, time: number) {
    [0, 0.07].forEach((delay) => {
      const t = time + delay;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.035);

      env.gain.setValueAtTime(0.8, t);
      env.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

      osc.connect(env);
      env.connect(dest);

      osc.start(t);
      osc.stop(t + 0.05);
    });
  }

  // Vine Thud: Viral dramatic sub-bass 808 drop
  private synthesizeVineThud(ctx: AudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.45);

    env.gain.setValueAtTime(1.0, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.65);

    // Subtle distortion punch
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 4) * x) / (Math.PI + 4 * Math.abs(x));
    }
    shaper.curve = curve;

    osc.connect(shaper);
    shaper.connect(env);
    env.connect(dest);

    osc.start(time);
    osc.stop(time + 0.65);
  }

  // Glitch: Digital static stutter
  private synthesizeGlitch(ctx: AudioContext, dest: AudioNode, time: number) {
    for (let i = 0; i < 4; i++) {
      const t = time + i * 0.05;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(400 + Math.random() * 1200, t);

      env.gain.setValueAtTime(0.5, t);
      env.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

      osc.connect(env);
      env.connect(dest);

      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  // Airhorn: Viral brass triplet blast
  private synthesizeAirhorn(ctx: AudioContext, dest: AudioNode, time: number) {
    const freqs = [466.16, 587.33, 698.46]; // Bb chord
    [0, 0.12, 0.26].forEach((offset) => {
      const blastTime = time + offset;
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, blastTime);

        env.gain.setValueAtTime(0.25, blastTime);
        env.gain.exponentialRampToValueAtTime(0.01, blastTime + 0.1);

        osc.connect(env);
        env.connect(dest);

        osc.start(blastTime);
        osc.stop(blastTime + 0.1);
      });
    });
  }

  // Cheer: Crowd celebration pink noise
  private synthesizeCheer(ctx: AudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.01, time);
    env.gain.linearRampToValueAtTime(0.6, time + 0.15);
    env.gain.exponentialRampToValueAtTime(0.01, time + 0.8);

    noise.connect(env);
    env.connect(dest);

    noise.start(time);
    noise.stop(time + 0.8);
  }
}

export const soundEffects = new SoundEffectsEngine();
