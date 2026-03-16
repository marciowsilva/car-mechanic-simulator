// src/systems/SoundSystem.js — Sons sintéticos por ferramenta

export class SoundSystem {
  constructor() {
    this.enabled = true;
    this.sfxEnabled = true;
    this.volume = 0.5;
    this.sounds = {};
    this.audioContext = null;
    this._init();
  }

  _init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this._createSounds();
    } catch(e) {
      console.warn('Web Audio API não disponível:', e);
    }
  }

  _ctx() {
    // Retomar contexto se suspenso (política de autoplay)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  _createSounds() {
    this.sounds = {
      // UI
      click:   this._makeClick(),
      success: this._makeSuccess(),
      error:   this._makeError(),
      money:   this._makeMoney(),
      upgrade: this._makeUpgrade(),
      unlock:  this._makeUnlock(),

      // Ferramentas
      wrench:      this._makeWrench(),
      screwdriver: this._makeScrewdriver(),
      hammer:      this._makeHammer(),
      welder:      this._makeWelder(),
      diagnostic:  this._makeDiagnostic(),
    };
  }

  // ===== UI SOUNDS =====

  _makeClick() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(this.volume * 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    };
  }

  _makeSuccess() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this.volume * 0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.22 + i * 0.08);
      });
    };
  }

  _makeError() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    };
  }

  _makeMoney() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      [880, 1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this.volume * 0.1, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14 + i * 0.06);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.18 + i * 0.06);
      });
    };
  }

  _makeUpgrade() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      [400, 500, 600, 700, 900].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this.volume * 0.1, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.055);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + 0.16 + i * 0.055);
      });
    };
  }

  _makeUnlock() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      [523, 587, 659, 698, 784, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this.volume * 0.1, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.09);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + 0.22 + i * 0.09);
      });
    };
  }

  // ===== SONS DE FERRAMENTAS =====

  // Chave inglesa — clique metálico + torque
  _makeWrench() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;

      // Clique inicial metálico
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 3;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 1.2, now);
      src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
      src.start(now);

      // Torque — som de engrenagem
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
      oGain.gain.setValueAtTime(this.volume * 0.18, now + 0.02);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(oGain); oGain.connect(ctx.destination);
      osc.start(now + 0.02); osc.stop(now + 0.22);
    };
  }

  // Chave de fenda — raspagem fina + clique preciso
  _makeScrewdriver() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;

      // Raspagem
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = Math.sin(2 * Math.PI * 3200 * t) * 0.3 * Math.exp(-t / 0.04)
                + (Math.random() - 0.5) * 0.15 * Math.exp(-t / 0.08);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.7, now);
      src.connect(hpf); hpf.connect(gain); gain.connect(ctx.destination);
      src.start(now);

      // Clique final
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      og.gain.setValueAtTime(this.volume * 0.12, now + 0.1);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(og); og.connect(ctx.destination);
      osc.start(now + 0.1); osc.stop(now + 0.15);
    };
  }

  // Martelo — impacto pesado
  _makeHammer() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;

      // Impacto — ruído branco filtrado
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.06);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 400;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 2.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
      src.start(now);

      // Ressonância metálica
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
      og.gain.setValueAtTime(this.volume * 0.3, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(og); og.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.3);
    };
  }

  // Maçarico — chama + faísca
  _makeWelder() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;
      const duration = 0.5;

      // Chama contínua — ruído filtrado
      const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const env = t < 0.05 ? t / 0.05 : t > 0.4 ? (duration - t) / 0.1 : 1;
        data[i] = (Math.random() * 2 - 1) * env * 0.6;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 600;
      bpf.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.5, now);
      src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
      src.start(now);

      // Faísca — pops aleatórios
      for (let i = 0; i < 5; i++) {
        const t = now + Math.random() * 0.4;
        const popBuf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
        const pd = popBuf.getChannelData(0);
        for (let j = 0; j < pd.length; j++) {
          pd[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.004));
        }
        const popSrc = ctx.createBufferSource();
        popSrc.buffer = popBuf;
        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(this.volume * 0.8, t);
        popSrc.connect(popGain); popGain.connect(ctx.destination);
        popSrc.start(t);
      }
    };
  }

  // Diagnóstico — beep eletrônico de scanner
  _makeDiagnostic() {
    return () => {
      const ctx = this._ctx(); if (!ctx) return;
      const now = ctx.currentTime;

      // Beeps de scanner
      [0, 0.12, 0.24].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1200 + i * 200;
        gain.gain.setValueAtTime(this.volume * 0.06, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });

      // Tom final de confirmação
      const conf = ctx.createOscillator();
      const cg = ctx.createGain();
      conf.type = 'sine';
      conf.frequency.setValueAtTime(800, now + 0.38);
      conf.frequency.exponentialRampToValueAtTime(1200, now + 0.52);
      cg.gain.setValueAtTime(this.volume * 0.1, now + 0.38);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      conf.connect(cg); cg.connect(ctx.destination);
      conf.start(now + 0.38); conf.stop(now + 0.55);
    };
  }

  // ===== API PÚBLICA =====

  play(soundName) {
    if (!this.enabled) return;
    // Sons de ferramentas respeitam sfxEnabled separadamente
    const toolSounds = ['wrench','screwdriver','hammer','welder','diagnostic'];
    if (toolSounds.includes(soundName) && !this.sfxEnabled) return;

    const sound = this.sounds[soundName];
    if (sound) {
      try { sound(); }
      catch(e) { console.warn('Erro ao reproduzir som:', soundName, e); }
    }
  }

  // Tocar som da ferramenta selecionada
  playToolSound(toolId) {
    this.play(toolId);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
  }
}

if (typeof window !== 'undefined') window.SoundSystem = SoundSystem;
