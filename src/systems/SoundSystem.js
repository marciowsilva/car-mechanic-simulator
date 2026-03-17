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


  // ===== SONS DE AMBIENTE =====

  startAmbience() {
    if (this._ambienceRunning) return;

    // Garantir que o AudioContext está ativo após gesto do usuário
    const ctx = this._ctx();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this._startAmbienceInternal());
    } else {
      this._startAmbienceInternal();
    }
  }

  _startAmbienceInternal() {
    this._ambienceRunning = true;
    this._ambienceNodes = [];
    this._startFan();
    this._startHum();
    this._startRadio();
    this._scheduleRattle();
    this._scheduleClank();
  }

  stopAmbience() {
    this._ambienceRunning = false;
    this._ambienceNodes?.forEach(n => {
      try { n.stop?.(); n.disconnect?.(); } catch(e) {}
    });
    this._ambienceNodes = [];
    if (this._rattleTimer) clearTimeout(this._rattleTimer);
    if (this._clankTimer)  clearTimeout(this._clankTimer);
  }

  setAmbienceVolume(vol) {
    this._ambienceVol = Math.max(0, Math.min(1, vol));
    if (this._fanGain)   this._fanGain.gain.value   = this._ambienceVol * 0.06;
    if (this._humGain)   this._humGain.gain.value   = this._ambienceVol * 0.04;
    if (this._radioGain) this._radioGain.gain.value = this._ambienceVol * 0.05;
  }

  // Ventilador — ruído branco filtrado em loop
  _startFan() {
    const ctx = this._ctx(); if (!ctx) return;
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 320;
    bpf.Q.value = 0.8;

    const bpf2 = ctx.createBiquadFilter();
    bpf2.type = 'bandpass';
    bpf2.frequency.value = 180;
    bpf2.Q.value = 1.2;

    this._fanGain = ctx.createGain();
    this._fanGain.gain.value = (this._ambienceVol || 0.5) * 0.06;

    src.connect(bpf); bpf.connect(bpf2); bpf2.connect(this._fanGain);
    this._fanGain.connect(ctx.destination);
    src.start();
    this._ambienceNodes.push(src, bpf, bpf2, this._fanGain);
  }

  // Hum elétrico — frequência de 60Hz (transformadores/lâmpadas)
  _startHum() {
    const ctx = this._ctx(); if (!ctx) return;
    const now = ctx.currentTime;

    [60, 120, 180].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = (this._ambienceVol || 0.5) * [0.04, 0.02, 0.01][i];

      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      this._ambienceNodes.push(osc, gain);
      if (i === 0) this._humGain = gain;
    });
  }

  // Rádio AM distante — voz + música simulada
  _startRadio() {
    const ctx = this._ctx(); if (!ctx) return;
    const bufSize = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Simular "música" com harmônicos variando
    const baseFreqs = [220, 330, 440, 550, 660];
    for (let i = 0; i < bufSize; i++) {
      const t = i / ctx.sampleRate;
      let v = 0;
      baseFreqs.forEach(f => {
        v += Math.sin(2 * Math.PI * f * t) * 0.15;
        v += Math.sin(2 * Math.PI * f * 1.5 * t) * 0.05;
      });
      // Modulação AM (simula sinal de rádio)
      const carrier = Math.sin(2 * Math.PI * 0.3 * t);
      v *= (0.6 + carrier * 0.4);
      // Ruído de fundo do rádio
      v += (Math.random() - 0.5) * 0.08;
      data[i] = v * 0.3;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Filtro para soar como rádio AM (faixa estreita)
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1200;
    bpf.Q.value = 0.5;

    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    dist.curve = curve;

    this._radioGain = ctx.createGain();
    this._radioGain.gain.value = (this._ambienceVol || 0.5) * 0.05;

    src.connect(bpf); bpf.connect(dist); dist.connect(this._radioGain);
    this._radioGain.connect(ctx.destination);
    src.start();
    this._ambienceNodes.push(src, bpf, dist, this._radioGain);
  }

  // Chocalho metálico esporádico (ferramenta caindo)
  _scheduleRattle() {
    if (!this._ambienceRunning) return;
    const delay = 8000 + Math.random() * 20000; // 8-28 segundos
    this._rattleTimer = setTimeout(() => {
      this._playRattle();
      this._scheduleRattle();
    }, delay);
  }

  _playRattle() {
    const ctx = this._ctx(); if (!ctx) return;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      // Série de pequenos impactos decaindo
      const impacts = [0, 0.05, 0.09, 0.12, 0.14, 0.155];
      let v = 0;
      impacts.forEach(imp => {
        if (t >= imp) v += (Math.random() - 0.5) * Math.exp(-(t - imp) / 0.02);
      });
      data[i] = v;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 1000;
    const gain = ctx.createGain();
    gain.gain.value = (this._ambienceVol || 0.5) * 0.4;
    src.connect(hpf); hpf.connect(gain); gain.connect(ctx.destination);
    src.start(now);
  }

  // Baque metálico esporádico (pancada de martelo ao longe)
  _scheduleClank() {
    if (!this._ambienceRunning) return;
    const delay = 12000 + Math.random() * 25000; // 12-37 segundos
    this._clankTimer = setTimeout(() => {
      this._playClank();
      this._scheduleClank();
    }, delay);
  }

  _playClank() {
    const ctx = this._ctx(); if (!ctx) return;
    const now = ctx.currentTime;
    // Tom metálico grave
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime((this._ambienceVol || 0.5) * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 600;
    osc.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.5);
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
