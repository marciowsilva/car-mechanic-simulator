/**
 * RadioSynth.js
 * Motor de síntese procedural para o rádio da garagem.
 * 100% Web Audio API — zero arquivos de áudio externos.
 *
 * Cada gênero tem sua própria classe de sintetizador.
 * Todos herdam de BaseSynth e implementam _build() e _teardown().
 *
 * Uso:
 *   const synth = new RockSynth(audioCtx, masterGain);
 *   synth.start(volume);
 *   synth.stop();   // fade + cleanup
 */

// ─── Utilitários ──────────────────────────────────────────────────────────────

/** Cria buffer de ruído branco de `durationSec` segundos. */
export function createNoiseBuffer(ctx, durationSec = 1.0) {
  const len = Math.ceil(ctx.sampleRate * durationSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Curva de waveshaper para distorção suave (soft clip). */
export function makeDistortionCurve(amount = 200) {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/** Agenda nota com envelope ADSR simples em `gainNode`. */
export function scheduleNote(ctx, gainNode, startTime, attack, sustain, release, peakGain) {
  const g = gainNode.gain;
  g.cancelScheduledValues(startTime);
  g.setValueAtTime(0, startTime);
  g.linearRampToValueAtTime(peakGain, startTime + attack);
  g.setValueAtTime(peakGain, startTime + attack + sustain);
  g.linearRampToValueAtTime(0, startTime + attack + sustain + release);
}

// ─── BaseSynth ────────────────────────────────────────────────────────────────

class BaseSynth {
  constructor(ctx, outputGain) {
    this._ctx = ctx;
    this._out = outputGain;
    this._nodes = [];       // AudioNodes a destruir no stop()
    this._timers = [];      // setInterval IDs
    this._running = false;
  }

  start(volume = 0.5) {
    if (this._running) return;
    this._running = true;
    this._fadeGain = this._ctx.createGain();
    this._fadeGain.gain.value = 0;
    this._fadeGain.connect(this._out);
    this._build(this._fadeGain);
    // Fade in suave
    const now = this._ctx.currentTime;
    this._fadeGain.gain.setValueAtTime(0, now);
    this._fadeGain.gain.linearRampToValueAtTime(volume, now + 0.8);
  }

  /** Retorna Promise que resolve após o fade out. */
  stop(fadeDuration = 0.6) {
    return new Promise(resolve => {
      if (!this._running) { resolve(); return; }
      this._running = false;
      const now = this._ctx.currentTime;
      if (this._fadeGain) {
        this._fadeGain.gain.cancelScheduledValues(now);
        this._fadeGain.gain.setTargetAtTime(0, now, fadeDuration / 4);
      }
      setTimeout(() => {
        this._teardown();
        resolve();
      }, (fadeDuration + 0.1) * 1000);
    });
  }

  setVolume(vol, ramp = 0.2) {
    if (!this._fadeGain) return;
    const now = this._ctx.currentTime;
    this._fadeGain.gain.cancelScheduledValues(now);
    this._fadeGain.gain.setTargetAtTime(vol, now, ramp / 3);
  }

  _build(_outputGain) { /* override */ }

  _teardown() {
    this._timers.forEach(id => clearInterval(id));
    this._timers = [];
    this._nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
    this._nodes = [];
    try { this._fadeGain?.disconnect(); } catch (_) {}
  }

  /** Shorthand: cria OscillatorNode, conecta e registra. */
  _osc(type, freq, dest) {
    const o = this._ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    if (dest) o.connect(dest);
    o.start();
    this._nodes.push(o);
    return o;
  }

  /** Shorthand: cria GainNode e registra. */
  _gain(value, dest) {
    const g = this._ctx.createGain();
    g.gain.value = value;
    if (dest) g.connect(dest);
    this._nodes.push(g);
    return g;
  }

  /** Shorthand: cria BiquadFilterNode e registra. */
  _filter(type, freq, Q = 1, dest) {
    const f = this._ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = Q;
    if (dest) f.connect(dest);
    this._nodes.push(f);
    return f;
  }

  /** Shorthand: toca nota de percussão de ruído com envelope. */
  _noiseHit(dest, hipassFreq, bandFreq, attack, release, peakGain) {
    const t = this._ctx.currentTime;
    const nb = this._ctx.createBufferSource();
    nb.buffer = createNoiseBuffer(this._ctx, release + 0.05);
    const filt = this._ctx.createBiquadFilter();
    filt.type = bandFreq ? 'bandpass' : 'highpass';
    filt.frequency.value = bandFreq || hipassFreq;
    const env = this._ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peakGain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    nb.connect(filt); filt.connect(env); env.connect(dest);
    nb.start(t);
    this._nodes.push(nb, filt, env);
  }

  /** Kick drum: pitch-drop sine. */
  _kick(dest, startFreq = 160, endFreq = 38, peakGain = 0.9, duration = 0.25) {
    const t = this._ctx.currentTime;
    const o = this._ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(startFreq, t);
    o.frequency.exponentialRampToValueAtTime(endFreq, t + 0.07);
    const env = this._ctx.createGain();
    env.gain.setValueAtTime(peakGain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(env); env.connect(dest);
    o.start(t); o.stop(t + duration + 0.02);
    this._nodes.push(o, env);
  }
}

// ─── RockSynth ────────────────────────────────────────────────────────────────

export class RockSynth extends BaseSynth {
  _build(out) {
    const ctx = this._ctx;

    // ── Bass com distorção ──────────────────────────────────────────────
    const bassFilter = this._filter('lowpass', 520, 1.5, null);
    bassFilter.connect(out);
    const drive = ctx.createWaveShaper();
    drive.curve = makeDistortionCurve(280);
    drive.oversample = '4x';
    drive.connect(bassFilter);
    this._nodes.push(drive);

    const bassG = this._gain(0.32, drive);
    this._osc('sawtooth', 110, bassG);   // A2

    // ── Guitar chords: sawtooth + bandpass layers ───────────────────────
    const chordFreqs = [138.6, 164.8, 220, 277.2]; // A, E, A, C# voicing
    chordFreqs.forEach((f, i) => {
      const chFilt = this._filter('bandpass', 900 + i * 350, 2.5, out);
      const chG = this._gain(0.08, chFilt);

      // Square LFO for rhythmic chug (palm-mute feel)
      const lfo = this._osc('square', 4, null);
      const lfoG = this._gain(0.05, chG.gain);
      lfo.connect(lfoG);
      this._nodes.push(lfoG);

      this._osc('sawtooth', f, chG);
    });

    // ── Kick on every beat (120 BPM) ────────────────────────────────────
    const beatMs = (60 / 120) * 1000;
    const kickId = setInterval(() => { if (this._running) this._kick(out); }, beatMs);
    this._timers.push(kickId);

    // ── Snare on 2 & 4 ──────────────────────────────────────────────────
    let beat = 0;
    const snareId = setInterval(() => {
      beat++;
      if (beat % 2 === 0 && this._running)
        this._noiseHit(out, 0, 2200, 0.003, 0.14, 0.5);
    }, beatMs);
    this._timers.push(snareId);

    // ── 8th-note hi-hat ─────────────────────────────────────────────────
    const hatId = setInterval(() => {
      if (this._running) this._noiseHit(out, 9000, 0, 0.002, 0.05, 0.07);
    }, beatMs / 2);
    this._timers.push(hatId);
  }
}

// ─── JazzSynth ────────────────────────────────────────────────────────────────

export class JazzSynth extends BaseSynth {
  _build(out) {
    const ctx = this._ctx;
    // Cmaj7 voicing
    const chordFreqs = [261.6, 329.6, 392.0, 493.9];

    // ── Rhodes-like: sine + triangle blend, per note ────────────────────
    chordFreqs.forEach((f, i) => {
      const noteOut = this._gain(1.0, out);
      const noteEnv = this._gain(0, noteOut);

      const sine = ctx.createOscillator(); sine.type = 'sine';
      sine.frequency.value = f;
      const tri  = ctx.createOscillator(); tri.type = 'triangle';
      tri.frequency.value = f * 1.0015; // slight chorus detune

      const sG = this._gain(0.14, noteEnv);
      const tG = this._gain(0.05, noteEnv);
      sine.connect(sG); tri.connect(tG);

      // Vibrato LFO
      const vib  = this._osc('sine', 5.2, null);
      const vibG = this._gain(3.0, sine.frequency);
      vib.connect(vibG); this._nodes.push(vibG);

      // Attack envelope — stagger each chord tone
      const delay = i * 0.06;
      const t = ctx.currentTime + delay;
      const eg = noteEnv.gain;
      eg.setValueAtTime(0, t);
      eg.linearRampToValueAtTime(1.0, t + 0.08);
      eg.setTargetAtTime(0.65, t + 0.08, 0.5);

      sine.start(t); tri.start(t);
      this._nodes.push(sine, tri, sG, tG, noteEnv, noteOut);
    });

    // ── Upright bass: slow sine pulses ─────────────────────────────────
    const bassF = this._filter('lowpass', 230, 1, out);
    const bassG = this._gain(0.28, bassF);
    this._osc('sine', 130.8, bassG); // C2

    // ── Brush snare: soft bandpass noise every 2 beats ──────────────────
    const brushMs = (60 / 88) * 2 * 1000; // half-time at 88 BPM
    const brushId = setInterval(() => {
      if (this._running) this._noiseHit(out, 0, 1600, 0.006, 0.22, 0.08);
    }, brushMs);
    this._timers.push(brushId);

    // ── Ride cymbal: high-freq noise every beat ─────────────────────────
    const rideMs = (60 / 88) * 1000;
    const rideId = setInterval(() => {
      if (this._running) this._noiseHit(out, 7000, 0, 0.003, 0.18, 0.045);
    }, rideMs);
    this._timers.push(rideId);
  }
}

// ─── CountrySynth ─────────────────────────────────────────────────────────────

export class CountrySynth extends BaseSynth {
  _build(out) {
    const ctx = this._ctx;
    // G major: G3, B3, D4, G4
    const pickFreqs = [196.0, 246.9, 293.7, 392.0];
    const beatMs = (60 / 100) * 1000;

    // ── Banjo-like picking: triangle + fast decay ───────────────────────
    const strum = () => {
      if (!this._running) return;
      pickFreqs.forEach((f, i) => {
        const t = ctx.currentTime + i * 0.055;
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        // Slight pitch twang up then settle
        o.frequency.setValueAtTime(f * 1.04, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.06);

        const pk = ctx.createPeaking ? null : null; // not available in basic API
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.38, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);

        // Notch at 800 Hz for nasal banjo timbre
        const notch = ctx.createBiquadFilter();
        notch.type = 'peaking';
        notch.frequency.value = 2800;
        notch.gain.value = 5;
        notch.Q.value = 2;

        o.connect(notch); notch.connect(env); env.connect(out);
        o.start(t); o.stop(t + 1.0);
        this._nodes.push(o, notch, env);
      });
    };

    strum();
    const strumId = setInterval(strum, beatMs * 4); // every 4 beats
    this._timers.push(strumId);

    // ── Walking bass line: root + fifth alternating ─────────────────────
    const bassNotes = [98.0, 123.5, 98.0, 130.8]; // G2, B2, G2, C3
    let bassIdx = 0;
    const bassId = setInterval(() => {
      if (!this._running) return;
      const f = bassNotes[bassIdx % bassNotes.length];
      bassIdx++;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.3, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(env); env.connect(out);
      o.start(t); o.stop(t + 0.4);
      this._nodes.push(o, env);
    }, beatMs);
    this._timers.push(bassId);

    // ── Wood block / snare ──────────────────────────────────────────────
    let b = 0;
    const snapId = setInterval(() => {
      b++;
      if (b % 2 === 0 && this._running)
        this._noiseHit(out, 0, 1800, 0.003, 0.09, 0.3);
    }, beatMs);
    this._timers.push(snapId);
  }
}

// ─── ElectroSynth ─────────────────────────────────────────────────────────────

export class ElectroSynth extends BaseSynth {
  _build(out) {
    const ctx = this._ctx;
    const BPM = 138;
    const beat = 60 / BPM;

    // ── Sub-bass with sidechain pump ───────────────────────────────────
    const subG = this._gain(0.48, out);
    this._osc('sine', 55, subG); // A1

    // Sidechain LFO: sawtooth inverted, synced to kick
    const pump = this._osc('sawtooth', BPM / 60, null);
    const pumpG = this._gain(-0.22, subG.gain);
    pump.connect(pumpG); this._nodes.push(pumpG);

    // ── Resonant filter for lead arpeggio ───────────────────────────────
    const arpFilt = this._filter('lowpass', 600, 10, out);

    // Filter envelope LFO (slow sweep)
    const sweepLFO = this._osc('sine', 0.2, null);
    const sweepG = this._gain(1400, arpFilt.frequency);
    sweepLFO.connect(sweepG); this._nodes.push(sweepG);

    // Arpeggio sequence: A1–A2–E2–A2 in 16th notes
    const arpSeq = [110, 220, 165, 220, 110, 165, 220, 330];
    let arpIdx = 0;
    const arpMs = beat * 0.25 * 1000; // 16th note
    const arpId = setInterval(() => {
      if (!this._running) return;
      const t = ctx.currentTime;
      const f = arpSeq[arpIdx % arpSeq.length]; arpIdx++;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.14, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.22);
      o.connect(env); env.connect(arpFilt);
      o.start(t); o.stop(t + beat * 0.25);
      this._nodes.push(o, env);
    }, arpMs);
    this._timers.push(arpId);

    // ── Kick on every beat ──────────────────────────────────────────────
    const kickId = setInterval(() => {
      if (this._running) this._kick(out, 170, 35, 0.85, 0.22);
    }, beat * 1000);
    this._timers.push(kickId);

    // ── Clap/snare on 2 & 4 ─────────────────────────────────────────────
    let b = 0;
    const clapId = setInterval(() => {
      b++;
      if (b % 2 === 0 && this._running) {
        // Three-layer clap
        [0, 12, 24].forEach(offset => setTimeout(() => {
          if (this._running) this._noiseHit(out, 0, 1400 + offset * 20, 0.003, 0.11, 0.42);
        }, offset));
      }
    }, beat * 1000);
    this._timers.push(clapId);

    // ── Open hi-hat on 8ths ─────────────────────────────────────────────
    const hatId = setInterval(() => {
      if (this._running) this._noiseHit(out, 8500, 0, 0.002, 0.08, 0.06);
    }, beat * 500);
    this._timers.push(hatId);
  }
}

// ─── LatinSynth ───────────────────────────────────────────────────────────────

export class LatinSynth extends BaseSynth {
  _build(out) {
    const ctx = this._ctx;
    const BPM = 80;
    const beat = 60 / BPM;

    // ── Melodia: Dm7 dorian ascending ──────────────────────────────────
    // D4, E4, F4, A4, C5, A4, F4, E4
    const melSeq = [293.7, 329.6, 349.2, 440, 523.3, 440, 349.2, 329.6];
    let melIdx = 0;
    const melMs = beat * 0.5 * 1000;
    const melId = setInterval(() => {
      if (!this._running) return;
      const t = ctx.currentTime;
      const f = melSeq[melIdx % melSeq.length]; melIdx++;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * 2; // octave up
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.45);
      // Vibrato
      const vib = ctx.createOscillator(); vib.frequency.value = 6.5;
      const vG = ctx.createGain(); vG.gain.value = 5.5;
      vib.connect(vG); vG.connect(o.frequency);
      o.connect(env); env.connect(out);
      o.start(t); o.stop(t + beat * 0.5);
      vib.start(t); vib.stop(t + beat * 0.5);
      this._nodes.push(o, env, vib, vG);
    }, melMs);
    this._timers.push(melId);

    // ── Nylon guitar comp: Dm chord, syncopated ─────────────────────────
    const compFreqs = [146.8, 185.0, 220.0, 293.7]; // Dm
    const compPattern = [1, 0, 1, 1, 0, 1, 0, 1]; // eight-note syncopation
    let compIdx = 0;
    const compMs = beat * 0.5 * 1000;
    const compId = setInterval(() => {
      const hit = compPattern[compIdx % compPattern.length]; compIdx++;
      if (!hit || !this._running) return;
      compFreqs.forEach((f, i) => {
        const t = ctx.currentTime + i * 0.018;
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.13, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(env); env.connect(out);
        o.start(t); o.stop(t + 0.55);
        this._nodes.push(o, env);
      });
    }, compMs);
    this._timers.push(compId);

    // ── Bajo sincopado ──────────────────────────────────────────────────
    const bassPattern = [146.8, 0, 110, 146.8, 0, 130.8, 0, 146.8];
    let bassIdx = 0;
    const bassId = setInterval(() => {
      const f = bassPattern[bassIdx % bassPattern.length]; bassIdx++;
      if (!f || !this._running) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.3, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.42);
      o.connect(env); env.connect(out);
      o.start(t); o.stop(t + beat * 0.45);
      this._nodes.push(o, env);
    }, compMs);
    this._timers.push(bassId);

    // ── Clave: 3-2 son clave ─────────────────────────────────────────────
    // Durations in 16th notes: [3,3,4, 2,4] = clave clásica
    const clavePattern = [1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0];
    let claveIdx = 0;
    const claveMs = (beat * 0.25) * 1000;
    const claveId = setInterval(() => {
      const hit = clavePattern[claveIdx % clavePattern.length]; claveIdx++;
      if (!hit || !this._running) return;
      // Clave: high woodblock — short mid-freq noise burst
      this._noiseHit(out, 0, 2600, 0.002, 0.04, 0.55);
    }, claveMs);
    this._timers.push(claveId);

    // ── Congas: tumbao pattern ──────────────────────────────────────────
    const congaPattern = [1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,0];
    let congaIdx = 0;
    const congaId = setInterval(() => {
      const hit = congaPattern[congaIdx % congaPattern.length]; congaIdx++;
      if (!hit || !this._running) return;
      this._noiseHit(out, 0, 300, 0.004, 0.09, 0.35);
    }, claveMs);
    this._timers.push(congaId);
  }
}

// ─── TuningNoiseSynth — efeito de sintonia analógica ─────────────────────────

export class TuningNoiseSynth {
  constructor(ctx, outputGain) {
    this._ctx = ctx;
    this._out = outputGain;
  }

  /** Reproduz varredura de sintonia. Retorna Promise que resolve ao terminar. */
  play(durationMs = 950) {
    return new Promise(resolve => {
      const ctx = this._ctx;
      const dur = durationMs / 1000;
      const t = ctx.currentTime;

      // Ruído branco como base do chiado
      const bufLen = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      // Filtro bandpass que varre freq: 200 → 5000 → 1000 Hz
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 10;
      bp.frequency.setValueAtTime(200, t);
      bp.frequency.linearRampToValueAtTime(5000, t + dur * 0.55);
      bp.frequency.linearRampToValueAtTime(1000, t + dur);

      // Oscilador "fantasma" — imita estação captada ao fundo
      const ghost = ctx.createOscillator();
      ghost.type = 'sine';
      ghost.frequency.setValueAtTime(280, t);
      ghost.frequency.linearRampToValueAtTime(1400, t + dur * 0.6);
      ghost.frequency.linearRampToValueAtTime(220, t + dur);

      const ghostG = ctx.createGain();
      ghostG.gain.setValueAtTime(0, t);
      ghostG.gain.linearRampToValueAtTime(0.07, t + dur * 0.25);
      ghostG.gain.linearRampToValueAtTime(0, t + dur);

      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0.22, t);
      noiseG.gain.linearRampToValueAtTime(0, t + dur);

      noise.connect(bp); bp.connect(noiseG); noiseG.connect(this._out);
      ghost.connect(ghostG); ghostG.connect(this._out);

      noise.start(t);
      ghost.start(t);
      noise.stop(t + dur);
      ghost.stop(t + dur);

      setTimeout(resolve, durationMs + 50);
    });
  }
}

// ─── Mapa: station id → classe de sintetizador ───────────────────────────────

export const SYNTH_MAP = {
  rock:       RockSynth,
  jazz:       JazzSynth,
  country:    CountrySynth,
  electronic: ElectroSynth,
  latin:      LatinSynth,
};
