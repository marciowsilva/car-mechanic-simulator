/**
 * GarageRadio.js
 * Rádio da garagem — implementação definitiva
 *
 * Stack: ES Modules, Web Audio API (procedural), vanilla CSS/DOM
 *
 * Dependências internas:
 *   ./RadioSynth.js  — motores de síntese por gênero
 *
 * Integração mínima em Game.js:
 * ─────────────────────────────────────────────────────────────────────────
 *   import { GarageRadio } from '../systems/GarageRadio.js';
 *
 *   // Na inicialização (depois que o usuário já interagiu com a página):
 *   this.radio = new GarageRadio({
 *     database:    this.database,          // db.get / db.set
 *     soundSystem: this.soundSystem,       // expõe .audioContext
 *   });
 *   this.radio.init();
 *
 *   // Opcionalmente, escuta eventos:
 *   this.radio.on('stationChange', ({ station }) => { ... });
 *   this.radio.on('toggle',        ({ isOn })    => { ... });
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Persistência: salva/carrega { stationId, volume, isOn } via
 *   database.set('garageRadio', state) / database.get('garageRadio')
 *
 * Compatibilidade de AudioContext: se soundSystem.audioContext existir,
 *   reutiliza. Caso contrário cria o próprio. Nunca cria dois contextos.
 */

import {
  SYNTH_MAP,
  TuningNoiseSynth,
  createNoiseBuffer,
} from './RadioSynth.js';

// ─── Definição das Estações ───────────────────────────────────────────────────

export const STATIONS = [
  {
    id:       'rock',
    synthKey: 'rock',
    name:     'Garage Rock FM',
    freq:     '98.7',
    genre:    'Rock',
    emoji:    '🎸',
    color:    '#e8453c',
    glow:     'rgba(232,69,60,0.35)',
    taglines: [
      'Riff após riff, peça após peça',
      'Rock que faz o motor rugir',
      'Clássicos que movem pistões',
    ],
  },
  {
    id:       'jazz',
    synthKey: 'jazz',
    name:     'Jazz Suave 101',
    freq:     '101.3',
    genre:    'Jazz',
    emoji:    '🎷',
    color:    '#f4a034',
    glow:     'rgba(244,160,52,0.35)',
    taglines: [
      'Suave como óleo sintético grau 5W-40',
      'A alma da mecânica tem ritmo',
      'Jazz para os dedos e a chave inglesa',
    ],
  },
  {
    id:       'country',
    synthKey: 'country',
    name:     'Country Roads',
    freq:     '104.5',
    genre:    'Country',
    emoji:    '🤠',
    color:    '#29a876',
    glow:     'rgba(41,168,118,0.35)',
    taglines: [
      'Estradas longas, motores fortes',
      'Da fazenda à oficina — direto',
      'Pick-up truck e chave de roda',
    ],
  },
  {
    id:       'electronic',
    synthKey: 'electronic',
    name:     'Eletro Turbo',
    freq:     '107.1',
    genre:    'Electronic',
    emoji:    '⚡',
    color:    '#7c3aed',
    glow:     'rgba(124,58,237,0.35)',
    taglines: [
      'BPM = rotação do seu motor',
      'Turbo no beat, turbo no carro',
      '138 BPM — velocidade de trabalho',
    ],
  },
  {
    id:       'latin',
    synthKey: 'latin',
    name:     'Bolero Mecânico',
    freq:     '88.9',
    genre:    'Latino',
    emoji:    '🌶️',
    color:    '#e8612e',
    glow:     'rgba(232,97,46,0.35)',
    taglines: [
      'Calor latino na garagem',
      'Ritmo que aquece o bloco do motor',
      'Son clave e chave de torque',
    ],
  },
];

// ─── VUMeter ──────────────────────────────────────────────────────────────────

class VUMeter {
  constructor(canvas) {
    this._canvas = canvas;
    this._c      = canvas.getContext('2d');
    this._raf    = null;
    this._peakL  = 0;
    this._peakR  = 0;
    this._analyser = null;
    this._data     = null;
  }

  attach(analyser) {
    this._analyser = analyser;
    this._data     = new Uint8Array(analyser.frequencyBinCount);
    this._draw();
  }

  detach() {
    cancelAnimationFrame(this._raf);
    this._raf = null;
    this._analyser = null;
    const { width: W, height: H } = this._canvas;
    this._c.clearRect(0, 0, W, H);
  }

  _draw() {
    this._raf = requestAnimationFrame(() => this._draw());
    if (!this._analyser) return;

    this._analyser.getByteFrequencyData(this._data);
    const half = this._data.length >> 1;

    let lSum = 0, rSum = 0;
    for (let i = 0; i < half; i++)       lSum += this._data[i];
    for (let i = half; i < half * 2; i++) rSum += this._data[i];

    const lv = lSum / (half * 255);
    const rv = rSum / (half * 255);

    this._peakL = Math.max(this._peakL * 0.965, lv);
    this._peakR = Math.max(this._peakR * 0.965, rv);

    const { width: W, height: H } = this._canvas;
    const c = this._c;
    c.clearRect(0, 0, W, H);

    const SEGS  = 18;
    const barW  = Math.floor((W - 6) / 2);
    const segH  = H / SEGS;

    const drawBar = (x, level, peak) => {
      for (let i = 0; i < SEGS; i++) {
        const threshold = (i + 1) / SEGS;
        const lit = level >= threshold;
        let color;
        if (threshold > 0.88)      color = lit ? '#ff2a2a' : '#1f0404';
        else if (threshold > 0.72) color = lit ? '#ffb300' : '#1f1004';
        else                       color = lit ? '#00e676' : '#031a09';
        c.fillStyle = color;
        c.fillRect(x + 1, H - (i + 1) * segH + 1, barW - 2, segH - 2);
      }
      // Peak hold line
      const py = H - Math.floor(peak * H) - 2;
      c.fillStyle = '#ffffff44';
      c.fillRect(x, py, barW, 2);
    };

    drawBar(0,          lv, this._peakL);
    drawBar(barW + 6,   rv, this._peakR);
  }
}

// ─── GarageRadio ──────────────────────────────────────────────────────────────

export class GarageRadio {
  /**
   * @param {object} options
   * @param {object} options.database    - instância com .get(key) e .set(key, val)
   * @param {object} [options.soundSystem] - instância com .audioContext (AudioContext)
   */
  constructor({ database, soundSystem = null } = {}) {
    this._db          = database    ?? null;
    this._soundSystem = soundSystem ?? null;

    this._ctx         = null;   // AudioContext
    this._masterGain  = null;   // GainNode → output
    this._analyser    = null;   // AnalyserNode → VU meter
    this._synth       = null;   // instância de BaseSynth atual
    this._tuner       = null;   // TuningNoiseSynth

    this._isOn        = false;
    this._isTuning    = false;
    this._currentIdx  = -1;     // índice em STATIONS
    this._volume      = 0.55;
    this._taglineIdx  = 0;
    this._taglineTimer = null;

    this._listeners   = new Map();  // Map<event, Set<callback>>
    this._vu          = null;       // VUMeter
    this._ui          = {};         // refs DOM cacheadas
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init() {
    this._injectStyles();
    this._buildDOM();
    this._loadState();
    console.log('[GarageRadio] Inicializado.');
  }

  dispose() {
    this.turnOff();
    document.getElementById('gr-root')?.remove();
    document.getElementById('gr-style')?.remove();
  }

  // ── API Pública ───────────────────────────────────────────────────────────

  turnOn(stationId) {
    this._ensureAudioCtx();
    this._isOn = true;

    const idx = stationId
      ? STATIONS.findIndex(s => s.id === stationId)
      : Math.max(0, this._currentIdx);

    this._tuneToIndex(idx < 0 ? 0 : idx);
    this._emit('toggle', { isOn: true, station: STATIONS[this._currentIdx] });
  }

  turnOff() {
    if (!this._isOn) return;
    this._isOn = false;
    clearInterval(this._taglineTimer);
    this._synth?.stop(0.5);
    this._synth = null;
    this._vu?.detach();
    this._emit('toggle', { isOn: false });
    this._refreshDOM();
    this._saveState();
  }

  toggle() {
    this._isOn ? this.turnOff() : this.turnOn();
  }

  nextStation() {
    if (!this._isOn) return;
    this._tuneToIndex((this._currentIdx + 1) % STATIONS.length);
  }

  prevStation() {
    if (!this._isOn) return;
    this._tuneToIndex((this._currentIdx - 1 + STATIONS.length) % STATIONS.length);
  }

  selectStation(id) {
    const idx = STATIONS.findIndex(s => s.id === id);
    if (idx < 0) return;
    if (!this._isOn) {
      this._ensureAudioCtx();
      this._isOn = true;
    }
    this._tuneToIndex(idx);
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    this._synth?.setVolume(this._volume);
    this._syncVolumeUI();
    this._emit('volumeChange', { volume: this._volume });
    this._saveState();
  }

  /** Registra listener. Retorna função de cleanup. */
  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this._listeners.get(event)?.delete(cb);
  }

  get isOn()           { return this._isOn; }
  get currentStation() { return this._currentIdx >= 0 ? STATIONS[this._currentIdx] : null; }
  get volume()         { return this._volume; }

  // ── Audio Context ─────────────────────────────────────────────────────────

  _ensureAudioCtx() {
    // Reutiliza AudioContext do SoundSystem se disponível
    if (!this._ctx) {
      const external = this._soundSystem?.audioContext;
      if (external && external.state !== 'closed') {
        this._ctx = external;
      } else {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();

    if (!this._masterGain) {
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 1.0;

      this._analyser = this._ctx.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.82;

      this._masterGain.connect(this._analyser);
      this._analyser.connect(this._ctx.destination);

      this._tuner = new TuningNoiseSynth(this._ctx, this._masterGain);
    }
  }

  // ── Sintonia ──────────────────────────────────────────────────────────────

  async _tuneToIndex(idx) {
    if (this._isTuning) return;
    this._isTuning = true;

    // Para sintetizador anterior
    if (this._synth) {
      await this._synth.stop(0.35);
      this._synth = null;
    }
    this._vu?.detach();

    this._refreshDOM();  // mostra estado "SINTONIZANDO"

    // Ruído de sintonia analógica
    await this._tuner?.play(920);

    // Liga nova estação
    this._currentIdx = idx;
    const station = STATIONS[idx];
    const SynthClass = SYNTH_MAP[station.synthKey];

    if (SynthClass) {
      this._synth = new SynthClass(this._ctx, this._masterGain);
      this._synth.start(this._volume);
    }

    // VU meter
    if (this._vu && this._analyser) {
      this._vu.attach(this._analyser);
    }

    this._isTuning = false;

    // Rotação de taglines
    clearInterval(this._taglineTimer);
    this._taglineIdx = 0;
    this._taglineTimer = setInterval(() => {
      if (!this._isOn || this._isTuning) return;
      this._taglineIdx = (this._taglineIdx + 1) % station.taglines.length;
      this._fadeTagline(station.taglines[this._taglineIdx]);
    }, 9000);

    this._emit('stationChange', { station });
    this._refreshDOM();
    this._saveState();
  }

  // ── Persistência ──────────────────────────────────────────────────────────

  _saveState() {
    if (!this._db) return;
    try {
      this._db.set('garageRadio', {
        stationId: this.currentStation?.id ?? null,
        volume:    this._volume,
        isOn:      this._isOn,
      });
    } catch (e) {
      console.warn('[GarageRadio] Erro ao salvar estado:', e);
    }
  }

  _loadState() {
    if (!this._db) return;
    try {
      const state = this._db.get('garageRadio');
      if (!state) return;
      this._volume = state.volume ?? 0.55;
      this._syncVolumeUI();

      // Restaura estação/estado ligado com delay
      // (garante que usuário interagiu com a página antes de criar AudioContext)
      if (state.isOn && state.stationId) {
        const resume = () => {
          this.turnOn(state.stationId);
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
        };
        document.addEventListener('click',   resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      }
    } catch (e) {
      console.warn('[GarageRadio] Erro ao carregar estado:', e);
    }
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  _emit(event, data) {
    this._listeners.get(event)?.forEach(cb => { try { cb(data); } catch (e) {} });
  }

  // ── DOM — Build ───────────────────────────────────────────────────────────

  _buildDOM() {
    document.getElementById('gr-root')?.remove();

    const root = document.createElement('div');
    root.id = 'gr-root';
    root.innerHTML = this._getHTML();
    document.body.appendChild(root);

    // Cache de referências
    const $ = id => document.getElementById(id);
    this._ui = {
      root,
      widget:   root.querySelector('.gr-widget'),
      powerBtn: $('gr-power'),
      freq:     $('gr-freq'),
      sname:    $('gr-sname'),
      genre:    $('gr-genre'),
      tagline:  $('gr-tagline'),
      tuneBar:  $('gr-tunebar'),
      presets:  root.querySelectorAll('.gr-preset'),
      prevBtn:  $('gr-prev'),
      nextBtn:  $('gr-next'),
      volTrack: $('gr-voltrack'),
      volFill:  $('gr-volfill'),
      volInput: $('gr-vol'),
      vuCanvas: $('gr-vu'),
    };

    // VU Meter
    const cv = this._ui.vuCanvas;
    if (cv) {
      cv.width  = cv.parentElement?.clientWidth - 24 || 236;
      cv.height = 40;
      this._vu = new VUMeter(cv);
    }

    this._bindEvents();
    this._syncVolumeUI();
    this._refreshDOM();
  }

  _getHTML() {
    const presetBtns = STATIONS.map(s => `
      <button class="gr-preset" data-id="${s.id}"
              style="--pc:${s.color}" title="${s.name} — ${s.freq} FM">
        <span class="gr-preset-icon">${s.emoji}</span>
        <span class="gr-preset-freq">${s.freq}</span>
      </button>`).join('');

    return `
<div class="gr-widget" data-state="off">

  <!-- Header / drag handle -->
  <div class="gr-header" id="gr-header">
    <span class="gr-header-label">📻 RÁDIO DA GARAGEM</span>
    <button class="gr-power" id="gr-power" aria-label="Ligar/Desligar">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
           stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M7 1v5.5M4.2 3.4a5 5 0 1 0 5.6 0"/>
      </svg>
    </button>
  </div>

  <!-- LCD Display -->
  <div class="gr-lcd">
    <div class="gr-lcd-inner">
      <div class="gr-freq-row">
        <span class="gr-fm-badge">FM</span>
        <span class="gr-freq" id="gr-freq">·· · ··</span>
      </div>
      <div class="gr-sname" id="gr-sname">DESLIGADO</div>
      <div class="gr-meta">
        <span class="gr-genre" id="gr-genre"></span>
        <span class="gr-tagline" id="gr-tagline"></span>
      </div>
    </div>
    <!-- Barra de progresso de sintonia -->
    <div class="gr-tunebar" id="gr-tunebar">
      <div class="gr-tunebar-fill"></div>
    </div>
  </div>

  <!-- VU meter -->
  <div class="gr-vu-wrap">
    <canvas class="gr-vu" id="gr-vu"></canvas>
  </div>

  <!-- Presets (1 por estação) -->
  <div class="gr-presets">${presetBtns}</div>

  <!-- Controles inferiores -->
  <div class="gr-controls">
    <button class="gr-nav" id="gr-prev" aria-label="Estação anterior">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M8 1L3 5l5 4V1zM1 1h1.5v8H1z"/>
      </svg>
    </button>

    <div class="gr-vol">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" style="opacity:.45">
        <path d="M1 4h2l3-3v9L3 7H1V4z"/>
      </svg>
      <div class="gr-voltrack" id="gr-voltrack">
        <div class="gr-volfill" id="gr-volfill"></div>
        <input type="range" id="gr-vol" min="0" max="100" value="55"
               aria-label="Volume" autocomplete="off">
      </div>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" style="opacity:.45">
        <path d="M1 4h2l3-3v9L3 7H1V4zM7.5 2.5a4 4 0 0 1 0 6M9 1a6.5 6.5 0 0 1 0 9"/>
      </svg>
    </div>

    <button class="gr-nav" id="gr-next" aria-label="Próxima estação">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M2 1l5 4-5 4V1zM7.5 1H9v8H7.5z"/>
      </svg>
    </button>
  </div>

</div>`;
  }

  // ── DOM — Eventos ─────────────────────────────────────────────────────────

  _bindEvents() {
    const { powerBtn, prevBtn, nextBtn, volInput, presets } = this._ui;

    powerBtn?.addEventListener('click', () => this.toggle());
    prevBtn?.addEventListener('click',  () => this.prevStation());
    nextBtn?.addEventListener('click',  () => this.nextStation());

    volInput?.addEventListener('input', e => {
      this.setVolume(parseInt(e.target.value, 10) / 100);
    });

    presets?.forEach(btn => {
      btn.addEventListener('click', () => this.selectStation(btn.dataset.id));
    });

    // Drag
    this._makeDraggable(this._ui.widget, this._ui.root.querySelector('.gr-header'));
  }

  _makeDraggable(el, handle) {
    if (!handle || !el) return;
    let ox = 0, oy = 0, sx = 0, sy = 0;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      handle.style.cursor = 'grabbing';
      const onMove = e => {
        el.style.left   = `${ox + e.clientX - sx}px`;
        el.style.top    = `${oy + e.clientY - sy}px`;
        el.style.right  = 'auto';
        el.style.bottom = 'auto';
      };
      const onUp = () => {
        handle.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  // ── DOM — Refresh ─────────────────────────────────────────────────────────

  _refreshDOM() {
    const { widget, powerBtn, freq, sname, genre, tagline, tuneBar, presets } = this._ui;
    if (!widget) return;

    const s     = this._currentIdx >= 0 ? STATIONS[this._currentIdx] : null;
    const color = s?.color  ?? '#5a5a6a';
    const glow  = s?.glow   ?? 'rgba(90,90,106,0.2)';

    // Estado do widget
    const state = !this._isOn ? 'off' : this._isTuning ? 'tuning' : 'on';
    widget.dataset.state = state;
    widget.style.setProperty('--sc', color);
    widget.style.setProperty('--sg', glow);

    powerBtn?.classList.toggle('active', this._isOn);

    // Display
    if (state === 'off') {
      if (freq)    freq.textContent    = '·· · ··';
      if (sname)   sname.textContent   = 'DESLIGADO';
      if (genre)   genre.textContent   = '';
      if (tagline) tagline.textContent = '';
    } else if (state === 'tuning') {
      if (freq)    freq.textContent    = '- - - - -';
      if (sname)   sname.textContent   = 'SINTONIZANDO…';
      if (genre)   genre.textContent   = '';
      if (tagline) tagline.textContent = '';
    } else if (s) {
      if (freq)    freq.textContent    = `${s.freq} FM`;
      if (sname)   sname.textContent   = `${s.emoji}  ${s.name.toUpperCase()}`;
      if (genre)   genre.textContent   = s.genre.toUpperCase();
      if (tagline) tagline.textContent = s.taglines[this._taglineIdx] ?? '';
    }

    // Tunebar
    tuneBar?.classList.toggle('active', this._isTuning);

    // Presets
    presets?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === s?.id && this._isOn);
    });
  }

  _fadeTagline(text) {
    const el = this._ui.tagline;
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = text; el.style.opacity = '1'; }, 350);
  }

  _syncVolumeUI() {
    const { volInput, volFill } = this._ui;
    const pct = Math.round(this._volume * 100);
    if (volInput) volInput.value    = pct;
    if (volFill)  volFill.style.width = `${pct}%`;
  }

  // ── Estilos ───────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('gr-style')) return;
    const style = document.createElement('style');
    style.id = 'gr-style';
    style.textContent = GR_CSS;
    document.head.appendChild(style);
  }
}

// ─── CSS — retrô-industrial, tipo rádio de bancada dos anos 80 ───────────────
// Fonte: Share Tech Mono (display LCD) + Rajdhani (UI labels)

const GR_CSS = /* css */`
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;700&display=swap');

/* ── Container ── */
#gr-root {
  position: fixed;
  bottom: 22px;
  right: 22px;
  z-index: 9400;
  user-select: none;
  font-family: 'Rajdhani', sans-serif;
}

/* ── Widget principal ── */
.gr-widget {
  width: 258px;
  background: #0d0d11;
  border: 1px solid #252530;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow .55s ease;

  /* Parafuso decorativo via outline */
  outline: 3px solid #0a0a0d;
  outline-offset: -3px;
}
.gr-widget[data-state="on"] {
  box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset,
              0 6px 28px rgba(0,0,0,.55),
              0 0 32px var(--sg, rgba(100,100,200,.2));
}
.gr-widget[data-state="off"] {
  box-shadow: 0 4px 20px rgba(0,0,0,.5);
}

/* ── Header / drag ── */
.gr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 11px 6px;
  background: #141418;
  border-bottom: 1px solid #1e1e28;
}
.gr-header-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: #3a3a50;
  text-transform: uppercase;
}

/* ── Power button ── */
.gr-power {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: #0d0d11;
  border: 1px solid #2e2e3e;
  color: #3a3a5a;
  cursor: pointer;
  transition: color .2s, border-color .2s, box-shadow .2s;
  flex-shrink: 0;
}
.gr-power.active {
  color: var(--sc, #5af);
  border-color: var(--sc, #5af);
  box-shadow: 0 0 8px var(--sg, rgba(80,170,255,.3));
}
.gr-power:not(.active):hover { color: #666; border-color: #444; }

/* ── LCD ── */
.gr-lcd {
  margin: 9px 11px 5px;
  background: #05090a;
  border: 1px solid #0e1e18;
  border-radius: 4px;
  box-shadow: inset 0 2px 10px rgba(0,0,0,.8);
  overflow: hidden;
}
.gr-lcd-inner {
  padding: 8px 10px 7px;
  min-height: 66px;
}
.gr-freq-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 2px;
}
.gr-fm-badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 1px;
  color: #0a2a1a;
  background: #05120d;
  padding: 1px 4px;
  border-radius: 2px;
}
.gr-freq {
  font-family: 'Share Tech Mono', monospace;
  font-size: 21px;
  letter-spacing: 2.5px;
  color: #0c2a18;
  transition: color .45s, text-shadow .45s;
  line-height: 1;
}
.gr-widget[data-state="on"] .gr-freq {
  color: var(--sc, #00e676);
  text-shadow: 0 0 12px var(--sg, rgba(0,230,118,.35));
}
.gr-widget[data-state="tuning"] .gr-freq {
  animation: gr-blink .22s step-end infinite alternate;
}
@keyframes gr-blink { from { opacity: .2; } to { opacity: 1; } }

.gr-sname {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #0c2a18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
  transition: color .45s;
}
.gr-widget[data-state="on"] .gr-sname { color: var(--sc, #00e676); }

.gr-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
}
.gr-genre {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #0c2a18;
  background: rgba(255,255,255,.03);
  padding: 1px 5px;
  border-radius: 2px;
  flex-shrink: 0;
}
.gr-tagline {
  font-size: 9px;
  color: #0a1e12;
  font-style: italic;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity .35s, color .45s;
}
.gr-widget[data-state="on"] .gr-genre   { color: var(--sc, #00e676); }
.gr-widget[data-state="on"] .gr-tagline { color: #2a4a32; }

/* ── Tunebar ── */
.gr-tunebar {
  height: 2px;
  background: #030a05;
}
.gr-tunebar.active .gr-tunebar-fill {
  animation: gr-scan .92s cubic-bezier(.4,0,.6,1) forwards;
}
.gr-tunebar-fill {
  height: 100%;
  width: 50px;
  background: var(--sc, #00e676);
  transform: translateX(-50px);
  opacity: .9;
  filter: blur(1px);
}
@keyframes gr-scan {
  from { transform: translateX(-50px); opacity: .6; }
  60%  { opacity: 1; }
  to   { transform: translateX(258px); opacity: .4; }
}

/* ── VU Meter ── */
.gr-vu-wrap {
  padding: 5px 11px;
}
.gr-vu {
  display: block;
  width: 100%;
  height: 40px;
  border-radius: 3px;
  background: #040806;
  border: 1px solid #0e1e14;
}

/* ── Presets ── */
.gr-presets {
  display: flex;
  margin: 0 11px 8px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #1e1e28;
}
.gr-preset {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 2px;
  background: #111116;
  border: none;
  border-right: 1px solid #1e1e28;
  color: #3a3a54;
  cursor: pointer;
  transition: background .15s, color .15s;
  gap: 2px;
}
.gr-preset:last-child { border-right: none; }
.gr-preset:hover      { background: #18181f; color: var(--pc); }
.gr-preset.active {
  background: color-mix(in srgb, var(--pc) 12%, #111116);
  color: var(--pc);
  box-shadow: inset 0 0 10px color-mix(in srgb, var(--pc) 20%, transparent);
}
.gr-preset-icon { font-size: 14px; line-height: 1; }
.gr-preset-freq {
  font-family: 'Share Tech Mono', monospace;
  font-size: 6.5px;
  letter-spacing: .4px;
  opacity: .7;
}

/* ── Controles inferiores ── */
.gr-controls {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 11px 11px;
}
.gr-nav {
  flex-shrink: 0;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: #111116;
  border: 1px solid #1e1e28;
  border-radius: 4px;
  color: #3a3a54;
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.gr-nav:hover {
  color: var(--sc, #5af);
  border-color: var(--sc, #5af);
}

/* ── Volume ── */
.gr-vol {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
}
.gr-voltrack {
  flex: 1;
  position: relative;
  height: 3px;
  background: #1a1a24;
  border-radius: 2px;
}
.gr-volfill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 2px;
  background: var(--sc, #5af);
  transition: width .08s, background .45s;
  pointer-events: none;
}
#gr-vol {
  position: absolute;
  inset: -10px 0;
  height: 22px;
  width: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

/* ── Desligado: tudo menos power fica opaco ── */
.gr-widget[data-state="off"] .gr-presets,
.gr-widget[data-state="off"] .gr-vu-wrap,
.gr-widget[data-state="off"] .gr-nav,
.gr-widget[data-state="off"] .gr-vol { opacity: .28; pointer-events: none; }
.gr-widget[data-state="off"] .gr-power { pointer-events: auto !important; opacity: 1 !important; }

/* ── Sintonizando: presets bloqueados ── */
.gr-widget[data-state="tuning"] .gr-presets { pointer-events: none; opacity: .5; }
`;
