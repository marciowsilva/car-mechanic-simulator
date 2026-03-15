// src/systems/MinigameSystem.js — Minigame de sequência de teclas

export class MinigameSystem {
  constructor() {
    this.active = false;
    this.onComplete = null;
    this.overlay = null;
    this.sequence = [];
    this.currentIndex = 0;
    this.scores = [];
    this.currentRound = 0;
    this.totalRounds = 1;
    this.startTime = 0;
    this.timeLimit = 0;
    this.timerInterval = null;

    this.KEYS = ['W', 'A', 'S', 'D'];
    this.KEY_CODES = { 'W': 'KeyW', 'A': 'KeyA', 'S': 'KeyS', 'D': 'KeyD' };
    this.KEY_LABELS = { 'W': '↑', 'A': '←', 'S': '↓', 'D': '→' };

    // Config por peça
    this.partConfig = {
      motor:       { seqLen: 6, rounds: 3, timeLimit: 5, icon: '⚙️' },
      transmissao: { seqLen: 5, rounds: 2, timeLimit: 5, icon: '🔩' },
      freios:      { seqLen: 4, rounds: 2, timeLimit: 4, icon: '🛑' },
      suspensao:   { seqLen: 5, rounds: 2, timeLimit: 5, icon: '🔧' },
      bateria:     { seqLen: 3, rounds: 1, timeLimit: 4, icon: '🔋' },
      alternador:  { seqLen: 4, rounds: 2, timeLimit: 4, icon: '⚡' },
      radiador:    { seqLen: 4, rounds: 2, timeLimit: 4, icon: '💧' },
      escapamento: { seqLen: 3, rounds: 1, timeLimit: 4, icon: '💨' },
      turbo:       { seqLen: 7, rounds: 3, timeLimit: 5, icon: '🌪️' },
      embreagem:   { seqLen: 5, rounds: 2, timeLimit: 5, icon: '🔄' },
    };

    this._buildUI();
    this._bindKeys();
  }

  _buildUI() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'minigame-overlay';
    this.overlay.style.cssText = `
      position:fixed; inset:0; z-index:5000;
      display:none; align-items:center; justify-content:center;
      background:rgba(10,12,20,0.88); backdrop-filter:blur(8px);
      font-family:'DM Sans',sans-serif;
    `;

    this.overlay.innerHTML = `
      <div style="
        background:#181c27; border:1px solid #2a3047; border-radius:20px;
        padding:36px 48px; min-width:500px; text-align:center;
        box-shadow:0 24px 80px rgba(0,0,0,0.6);
      ">
        <div id="mg-icon" style="font-size:44px; margin-bottom:8px">⚙️</div>
        <div id="mg-part-name" style="font-size:20px; font-weight:700; color:#e2e8f0; margin-bottom:4px">Motor</div>
        <div style="font-size:12px; color:#64748b; margin-bottom:24px">Pressione as teclas na ordem correta</div>

        <!-- Rounds -->
        <div id="mg-rounds" style="display:flex; gap:8px; justify-content:center; margin-bottom:24px"></div>

        <!-- Timer -->
        <div style="margin-bottom:16px">
          <div style="height:6px; background:#0f1117; border-radius:100px; overflow:hidden; border:1px solid #2a3047">
            <div id="mg-timer-bar" style="height:100%; width:100%; background:#3b82f6; border-radius:100px; transition:width 0.1s linear"></div>
          </div>
        </div>

        <!-- Sequência de teclas -->
        <div id="mg-sequence" style="
          display:flex; gap:12px; justify-content:center;
          margin-bottom:28px; flex-wrap:wrap; min-height:72px; align-items:center;
        "></div>

        <!-- Feedback -->
        <div id="mg-feedback" style="font-size:15px; font-weight:600; min-height:24px; color:#64748b; margin-bottom:16px"></div>

        <!-- Qualidade acumulada -->
        <div style="background:#0f1117; border-radius:8px; overflow:hidden; height:6px; border:1px solid #2a3047">
          <div id="mg-quality-bar" style="height:100%; background:#22c55e; width:0%; transition:width 0.3s; border-radius:8px"></div>
        </div>
        <div id="mg-quality-text" style="font-size:11px; color:#64748b; margin-top:6px">Qualidade: 0%</div>

        <div style="margin-top:20px; font-size:11px; color:#3d4a5c">ESC para pular</div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  _bindKeys() {
    this._onKeyDown = (e) => {
      if (!this.active) return;
      if (e.code === 'Escape') { this._skip(); return; }

      const key = Object.keys(this.KEY_CODES).find(k => this.KEY_CODES[k] === e.code);
      if (key) {
        e.preventDefault();
        this._handleKeyPress(key);
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  // ===== API PÚBLICA =====
  start(partName, toolId, onComplete) {
    if (this.active) return;

    const cfg = this.partConfig[partName] || { seqLen: 4, rounds: 2, timeLimit: 5, icon: '🔧' };

    this.active       = true;
    this.onComplete   = onComplete;
    this.partName     = partName;
    this.cfg          = cfg;
    this.totalRounds  = cfg.rounds;
    this.currentRound = 0;
    this.scores       = [];

    document.getElementById('mg-icon').textContent      = cfg.icon;
    document.getElementById('mg-part-name').textContent = this._partLabel(partName);
    document.getElementById('mg-quality-bar').style.width = '0%';
    document.getElementById('mg-quality-text').textContent = 'Qualidade: 0%';

    this._buildRoundDots();
    this.overlay.style.display = 'flex';

    this._startRound();
  }

  _startRound() {
    this.sequence     = this._generateSequence(this.cfg.seqLen);
    this.currentIndex = 0;
    this.startTime    = Date.now();
    this.timeLimit    = this.cfg.timeLimit * 1000;
    this.roundFailed  = false;

    this._renderSequence();
    this._setFeedback('');
    this._startTimer();
  }

  _generateSequence(len) {
    const seq = [];
    for (let i = 0; i < len; i++) {
      let key;
      // Evitar repetir a mesma tecla
      do { key = this.KEYS[Math.floor(Math.random() * this.KEYS.length)]; }
      while (seq.length > 0 && key === seq[seq.length - 1]);
      seq.push(key);
    }
    return seq;
  }

  _renderSequence() {
    const el = document.getElementById('mg-sequence');
    el.innerHTML = '';
    this.sequence.forEach((key, i) => {
      const btn = document.createElement('div');
      btn.id = `mg-key-${i}`;
      btn.style.cssText = `
        width:56px; height:56px; border-radius:10px; display:flex;
        align-items:center; justify-content:center;
        font-size:22px; font-weight:700; transition:all 0.15s;
        border:2px solid;
        ${i === this.currentIndex
          ? 'background:#1e3a5f; border-color:#3b82f6; color:#60a5fa; transform:scale(1.1);'
          : 'background:#1a1f2e; border-color:#2a3047; color:#64748b;'
        }
      `;
      btn.textContent = this.KEY_LABELS[key];
      el.appendChild(btn);
    });
  }

  _handleKeyPress(key) {
    if (this.roundFailed) return;

    const expected = this.sequence[this.currentIndex];

    if (key === expected) {
      // Acerto
      this._markKey(this.currentIndex, 'correct');
      this.currentIndex++;

      if (this.currentIndex >= this.sequence.length) {
        // Sequência completa!
        this._completeRound(true);
      } else {
        // Destacar próxima tecla
        this._highlightKey(this.currentIndex);
        this._setFeedback('');
      }
    } else {
      // Erro
      this._markKey(this.currentIndex, 'wrong');
      this.roundFailed = true;
      clearInterval(this.timerInterval);
      this._setFeedback('Sequência errada!', '#ef4444');

      // Flash de erro e reiniciar round após delay
      setTimeout(() => {
        if (!this.active) return;
        this._setFeedback('Tente novamente...', '#64748b');
        setTimeout(() => {
          if (!this.active) return;
          this._completeRound(false);
        }, 600);
      }, 500);
    }
  }

  _startTimer() {
    clearInterval(this.timerInterval);
    const bar = document.getElementById('mg-timer-bar');
    if (bar) bar.style.width = '100%';

    this.timerInterval = setInterval(() => {
      if (!this.active || this.roundFailed) return;
      const elapsed = Date.now() - this.startTime;
      const pct = Math.max(0, 100 - (elapsed / this.timeLimit * 100));

      if (bar) {
        bar.style.width = pct + '%';
        bar.style.background = pct > 50 ? '#3b82f6' : pct > 25 ? '#f59e0b' : '#ef4444';
      }

      if (elapsed >= this.timeLimit) {
        clearInterval(this.timerInterval);
        this.roundFailed = true;
        this._setFeedback('Tempo esgotado!', '#ef4444');
        setTimeout(() => { if (this.active) this._completeRound(false); }, 700);
      }
    }, 50);
  }

  _completeRound(success) {
    clearInterval(this.timerInterval);

    const elapsed = Date.now() - this.startTime;
    let score;

    if (success) {
      // Score baseado na velocidade: mais rápido = mais pontos
      const timeRatio = Math.max(0, 1 - elapsed / this.timeLimit);
      score = Math.round(70 + timeRatio * 30); // 70–100
    } else if (this.currentIndex > 0) {
      // Acertou algumas — score parcial
      score = Math.round((this.currentIndex / this.sequence.length) * 60);
    } else {
      score = 20;
    }

    this.scores.push(score);
    const avgScore = Math.round(this.scores.reduce((a,b) => a+b, 0) / this.scores.length);

    this._updateDot(this.currentRound, score);

    const label = score >= 90 ? '🎯 Perfeito!' : score >= 70 ? '✅ Bom!' : score >= 40 ? '⚠️ Regular' : '❌ Falhou';
    this._setFeedback(`${label} ${score}pts`, score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444');

    document.getElementById('mg-quality-bar').style.width = avgScore + '%';
    document.getElementById('mg-quality-bar').style.background = avgScore >= 70 ? '#22c55e' : avgScore >= 40 ? '#f59e0b' : '#ef4444';
    document.getElementById('mg-quality-text').textContent = `Qualidade: ${avgScore}%`;

    this.currentRound++;

    if (this.currentRound < this.totalRounds) {
      const nextDot = document.getElementById(`mg-dot-${this.currentRound}`);
      if (nextDot) { nextDot.style.background = '#3b82f6'; nextDot.style.border = '1px solid #60a5fa'; }

      setTimeout(() => {
        if (!this.active) return;
        this._setFeedback('Próxima etapa...', '#64748b');
        setTimeout(() => {
          if (!this.active) return;
          this._startRound();
        }, 500);
      }, 700);
    } else {
      setTimeout(() => this._finish(avgScore), 900);
    }
  }

  _finish(quality) {
    this._close();
    if (this.onComplete) this.onComplete(quality);
  }

  _skip() {
    this._close();
    if (this.onComplete) this.onComplete(30);
  }

  _close() {
    this.active = false;
    clearInterval(this.timerInterval);
    this.overlay.style.display = 'none';
  }

  // ===== HELPERS DE UI =====
  _markKey(idx, state) {
    const el = document.getElementById(`mg-key-${idx}`);
    if (!el) return;
    if (state === 'correct') {
      el.style.background    = '#0f3d20';
      el.style.borderColor   = '#22c55e';
      el.style.color         = '#22c55e';
      el.style.transform     = 'scale(1.15)';
    } else {
      el.style.background    = '#3d0f0f';
      el.style.borderColor   = '#ef4444';
      el.style.color         = '#ef4444';
      el.style.transform     = 'scale(0.95)';
    }
  }

  _highlightKey(idx) {
    const el = document.getElementById(`mg-key-${idx}`);
    if (!el) return;
    el.style.background  = '#1e3a5f';
    el.style.borderColor = '#3b82f6';
    el.style.color       = '#60a5fa';
    el.style.transform   = 'scale(1.1)';
  }

  _buildRoundDots() {
    const wrap = document.getElementById('mg-rounds');
    wrap.innerHTML = '';
    for (let i = 0; i < this.totalRounds; i++) {
      const dot = document.createElement('div');
      dot.id = `mg-dot-${i}`;
      dot.style.cssText = `
        width:10px; height:10px; border-radius:50%; transition:all 0.3s;
        background:${i === 0 ? '#3b82f6' : '#1a1f2e'};
        border:1px solid ${i === 0 ? '#60a5fa' : '#2a3047'};
      `;
      wrap.appendChild(dot);
    }
  }

  _updateDot(idx, score) {
    const dot = document.getElementById(`mg-dot-${idx}`);
    if (!dot) return;
    const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    dot.style.background = color;
    dot.style.border = `1px solid ${color}`;
    dot.style.transform = 'scale(1.4)';
    setTimeout(() => { if (dot) dot.style.transform = 'scale(1)'; }, 300);
  }

  _setFeedback(msg, color) {
    const el = document.getElementById('mg-feedback');
    if (el) { el.textContent = msg; el.style.color = color || '#64748b'; }
  }

  _partLabel(name) {
    const labels = {
      motor:'Motor', transmissao:'Transmissão', freios:'Freios',
      suspensao:'Suspensão', bateria:'Bateria', alternador:'Alternador',
      radiador:'Radiador', escapamento:'Escapamento', turbo:'Turbo', embreagem:'Embreagem',
    };
    return labels[name] || name;
  }
}

if (typeof window !== 'undefined') window.MinigameSystem = MinigameSystem;
