// src/systems/MinigameSystem.js — Minigame de timing para reparo de peças

export class MinigameSystem {
  constructor() {
    this.active = false;
    this.onComplete = null;
    this.animFrame = null;
    this.keyHeld = false;
    this.overlay = null;

    // Config por ferramenta
    this.toolConfig = {
      wrench:      { key: 'F', label: 'F', speed: 1.2, zones: 1, color: '#3b82f6', name: 'Chave Inglesa' },
      screwdriver: { key: 'F', label: 'F', speed: 0.9, zones: 2, color: '#22c55e', name: 'Chave de Fenda' },
      hammer:      { key: 'F', label: 'F', speed: 1.8, zones: 1, color: '#f59e0b', name: 'Martelo' },
      welder:      { key: 'F', label: 'F', speed: 1.4, zones: 3, color: '#ef4444', name: 'Maçarico' },
      diagnostic:  { key: 'F', label: 'F', speed: 0.6, zones: 1, color: '#a855f7', name: 'Diagnóstico' },
    };

    // Config por peça
    this.partConfig = {
      motor:       { difficulty: 1.3, rounds: 3, icon: '⚙️' },
      transmissao: { difficulty: 1.2, rounds: 2, icon: '🔩' },
      freios:      { difficulty: 1.0, rounds: 2, icon: '🛑' },
      suspensao:   { difficulty: 1.1, rounds: 2, icon: '🔧' },
      bateria:     { difficulty: 0.8, rounds: 1, icon: '🔋' },
      alternador:  { difficulty: 1.0, rounds: 2, icon: '⚡' },
      radiador:    { difficulty: 0.9, rounds: 2, icon: '💧' },
      escapamento: { difficulty: 0.8, rounds: 1, icon: '💨' },
      turbo:       { difficulty: 1.5, rounds: 3, icon: '🌪️' },
      embreagem:   { difficulty: 1.2, rounds: 2, icon: '🔄' },
    };

    this._buildUI();
    this._bindKeys();
  }

  _buildUI() {
    // Container overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'minigame-overlay';
    this.overlay.style.cssText = `
      position:fixed; inset:0; z-index:5000;
      display:none; align-items:center; justify-content:center;
      background:rgba(10,12,20,0.85); backdrop-filter:blur(6px);
    `;

    this.overlay.innerHTML = `
      <div id="mg-panel" style="
        background:#181c27; border:1px solid #2a3047; border-radius:20px;
        padding:36px 48px; min-width:480px; text-align:center;
        box-shadow:0 24px 80px rgba(0,0,0,0.6); font-family:'DM Sans',sans-serif;
      ">
        <!-- Cabeçalho -->
        <div id="mg-icon" style="font-size:48px; margin-bottom:8px">⚙️</div>
        <div id="mg-part-name" style="font-size:22px; font-weight:700; color:#e2e8f0; margin-bottom:4px">Motor</div>
        <div id="mg-tool-name" style="font-size:13px; color:#64748b; margin-bottom:28px">Chave Inglesa</div>

        <!-- Rounds -->
        <div id="mg-rounds" style="display:flex; gap:8px; justify-content:center; margin-bottom:24px"></div>

        <!-- Instrução -->
        <div style="font-size:13px; color:#94a3b8; margin-bottom:20px">
          Pressione e segure <kbd id="mg-key" style="
            background:#252b3b; border:1px solid #363d55; border-radius:6px;
            padding:3px 10px; font-family:'DM Mono',monospace; color:#e2e8f0; font-size:14px;
          ">F</kbd> enquanto o indicador estiver na zona verde
        </div>

        <!-- Barra de timing -->
        <div id="mg-bar-wrap" style="
          position:relative; height:52px; background:#0f1117;
          border-radius:12px; overflow:hidden; border:1px solid #2a3047; margin-bottom:24px;
        ">
          <!-- Zona alvo (verde) -->
          <div id="mg-zone" style="
            position:absolute; top:0; height:100%; background:rgba(34,197,94,0.25);
            border-left:2px solid #22c55e; border-right:2px solid #22c55e;
            transition:left 0.1s;
          "></div>
          <!-- Indicador (cursor) -->
          <div id="mg-cursor" style="
            position:absolute; top:4px; bottom:4px; width:6px;
            background:#e2e8f0; border-radius:3px; transform:translateX(-50%);
            box-shadow:0 0 12px rgba(255,255,255,0.4);
            transition:background 0.1s;
          "></div>
          <!-- Fill ao segurar -->
          <div id="mg-fill" style="
            position:absolute; top:0; left:0; height:100%;
            background:rgba(59,130,246,0.15); width:0%; transition:width 0.05s;
          "></div>
        </div>

        <!-- Score parcial -->
        <div id="mg-feedback" style="font-size:14px; color:#64748b; min-height:22px; margin-bottom:8px"></div>

        <!-- Barra de qualidade acumulada -->
        <div style="background:#0f1117; border-radius:8px; overflow:hidden; height:8px; border:1px solid #2a3047;">
          <div id="mg-quality-bar" style="height:100%; background:#22c55e; width:0%; transition:width 0.3s ease; border-radius:8px;"></div>
        </div>
        <div id="mg-quality-text" style="font-size:11px; color:#64748b; margin-top:6px">Qualidade: 0%</div>

        <!-- ESC para pular -->
        <div style="margin-top:20px; font-size:11px; color:#3d4a5c">
          ESC para pular (sem bônus)
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  _bindKeys() {
    this._onKeyDown = (e) => {
      if (!this.active) return;
      if (e.code === 'Escape') { this._skip(); return; }
      if (e.code === 'KeyF' && !this.keyHeld) {
        this.keyHeld = true;
        this._onHoldStart();
      }
    };
    this._onKeyUp = (e) => {
      if (!this.active) return;
      if (e.code === 'KeyF' && this.keyHeld) {
        this.keyHeld = false;
        this._onHoldEnd();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // ===== API PÚBLICA =====
  start(partName, toolId, onComplete) {
    if (this.active) return;

    const partCfg  = this.partConfig[partName]  || { difficulty: 1.0, rounds: 2, icon: '🔧' };
    const toolCfg  = this.toolConfig[toolId]    || this.toolConfig.wrench;

    this.active     = true;
    this.onComplete = onComplete;
    this.partName   = partName;
    this.toolId     = toolId;
    this.partCfg    = partCfg;
    this.toolCfg    = toolCfg;

    this.totalRounds    = partCfg.rounds;
    this.currentRound   = 0;
    this.totalScore     = 0;
    this.roundScores    = [];

    // Estado da barra
    this.barPos      = 0;       // 0–100 posição do cursor
    this.barDir      = 1;       // direção
    this.barSpeed    = toolCfg.speed * partCfg.difficulty * 55; // px/s em %
    this.holdTime    = 0;       // tempo segurando na zona
    this.requiredHold = 0.6;   // segundos necessários na zona
    this.lastTime    = null;
    this.roundDone   = false;

    // Zona alvo: posição e largura aleatórias
    this._randomizeZone();

    // Atualizar UI
    document.getElementById('mg-icon').textContent      = partCfg.icon;
    document.getElementById('mg-part-name').textContent = this._partLabel(partName);
    document.getElementById('mg-tool-name').textContent = toolCfg.name;
    document.getElementById('mg-key').textContent       = toolCfg.label;
    document.getElementById('mg-feedback').textContent  = '';
    document.getElementById('mg-quality-bar').style.width = '0%';
    document.getElementById('mg-quality-text').textContent = 'Qualidade: 0%';

    this._buildRoundDots();
    this._updateZoneUI();

    this.overlay.style.display = 'flex';
    this._tick();
  }

  // ===== INTERNOS =====
  _randomizeZone() {
    // Zona verde: 15–30% de largura, posição aleatória
    this.zoneWidth = 18 + Math.random() * 14;
    this.zoneLeft  = 10 + Math.random() * (80 - this.zoneWidth);
  }

  _updateZoneUI() {
    const zone = document.getElementById('mg-zone');
    zone.style.left  = this.zoneLeft + '%';
    zone.style.width = this.zoneWidth + '%';
    zone.style.background = `rgba(34,197,94,0.2)`;
  }

  _buildRoundDots() {
    const wrap = document.getElementById('mg-rounds');
    wrap.innerHTML = '';
    for (let i = 0; i < this.totalRounds; i++) {
      const dot = document.createElement('div');
      dot.id = `mg-dot-${i}`;
      dot.style.cssText = `
        width:10px; height:10px; border-radius:50%;
        background:${i === 0 ? '#3b82f6' : '#2a3047'};
        border:1px solid ${i === 0 ? '#60a5fa' : '#363d55'};
        transition:all 0.3s;
      `;
      wrap.appendChild(dot);
    }
  }

  _updateDot(idx, score) {
    const dot = document.getElementById(`mg-dot-${idx}`);
    if (!dot) return;
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    dot.style.background = color;
    dot.style.border = `1px solid ${color}`;
    dot.style.transform = 'scale(1.3)';
    setTimeout(() => dot.style.transform = 'scale(1)', 300);

    // Próximo dot ativo
    const next = document.getElementById(`mg-dot-${idx+1}`);
    if (next) {
      next.style.background = '#3b82f6';
      next.style.border = '1px solid #60a5fa';
    }
  }

  _isInZone() {
    return this.barPos >= this.zoneLeft && this.barPos <= (this.zoneLeft + this.zoneWidth);
  }

  _onHoldStart() {
    // Mudar cursor para azul ao pressionar
    document.getElementById('mg-cursor').style.background = '#3b82f6';
    document.getElementById('mg-cursor').style.boxShadow  = '0 0 16px rgba(59,130,246,0.6)';
  }

  _onHoldEnd() {
    document.getElementById('mg-cursor').style.background = '#e2e8f0';
    document.getElementById('mg-cursor').style.boxShadow  = '0 0 12px rgba(255,255,255,0.4)';
    document.getElementById('mg-fill').style.width = '0%';
    // Se não completou o round, penalidade leve
    if (!this.roundDone) {
      this._showFeedback('Solte na hora certa! ⚠️', '#f59e0b');
      this.holdTime = 0;
    }
  }

  _tick(timestamp) {
    if (!this.active) return;
    this.animFrame = requestAnimationFrame((t) => this._tick(t));

    if (!this.lastTime) { this.lastTime = timestamp; return; }
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (this.roundDone) return;

    // Mover cursor
    this.barPos += this.barDir * this.barSpeed * delta;
    if (this.barPos >= 100) { this.barPos = 100; this.barDir = -1; }
    if (this.barPos <= 0)   { this.barPos = 0;   this.barDir =  1; }

    // Se segurado
    if (this.keyHeld) {
      const inZone = this._isInZone();
      if (inZone) {
        this.holdTime += delta;
        const fillPct = Math.min(this.holdTime / this.requiredHold * 100, 100);
        document.getElementById('mg-fill').style.width = this.barPos + '%';
        document.getElementById('mg-fill').style.background = `rgba(34,197,94,${0.1 + fillPct/200})`;
        document.getElementById('mg-cursor').style.background = '#22c55e';
        document.getElementById('mg-cursor').style.boxShadow  = '0 0 16px rgba(34,197,94,0.8)';

        if (this.holdTime >= this.requiredHold) {
          this._completeRound(true);
          return;
        }
      } else {
        // Fora da zona mas segurando — penalidade
        this.holdTime = Math.max(0, this.holdTime - delta * 1.5);
        document.getElementById('mg-cursor').style.background = '#ef4444';
        document.getElementById('mg-cursor').style.boxShadow  = '0 0 16px rgba(239,68,68,0.6)';
      }
    }

    // Atualizar posição do cursor
    const cursor = document.getElementById('mg-cursor');
    cursor.style.left = this.barPos + '%';

    // Colorir zona quando cursor está nela
    const zone = document.getElementById('mg-zone');
    if (this._isInZone()) {
      zone.style.background = this.keyHeld
        ? 'rgba(34,197,94,0.4)'
        : 'rgba(34,197,94,0.3)';
    } else {
      zone.style.background = 'rgba(34,197,94,0.15)';
    }
  }

  _completeRound(success) {
    this.roundDone = true;
    cancelAnimationFrame(this.animFrame);

    // Calcular score do round baseado na posição central da zona
    const zoneCenterDist = Math.abs(this.barPos - (this.zoneLeft + this.zoneWidth/2));
    const maxDist = this.zoneWidth / 2;
    const precision = Math.max(0, 1 - zoneCenterDist / maxDist);
    const roundScore = Math.round(60 + precision * 40); // 60–100

    this.roundScores.push(roundScore);
    this.totalScore = Math.round(this.roundScores.reduce((a,b) => a+b, 0) / this.roundScores.length);

    this._updateDot(this.currentRound, roundScore);

    const emoji = roundScore >= 90 ? '🎯 Perfeito!' : roundScore >= 75 ? '✅ Bom!' : '⚠️ Regular';
    this._showFeedback(`${emoji} +${roundScore}pts`, roundScore >= 75 ? '#22c55e' : '#f59e0b');

    // Atualizar barra de qualidade
    document.getElementById('mg-quality-bar').style.width = this.totalScore + '%';
    document.getElementById('mg-quality-text').textContent = `Qualidade: ${this.totalScore}%`;

    const barEl = document.getElementById('mg-quality-bar');
    barEl.style.background = this.totalScore >= 80 ? '#22c55e' : this.totalScore >= 50 ? '#f59e0b' : '#ef4444';

    this.currentRound++;

    if (this.currentRound < this.totalRounds) {
      // Próximo round
      setTimeout(() => {
        this.holdTime  = 0;
        this.roundDone = false;
        this.lastTime  = null;
        this._randomizeZone();
        this._updateZoneUI();
        document.getElementById('mg-fill').style.width = '0%';
        this._showFeedback('Próxima peça...', '#64748b');
        setTimeout(() => {
          document.getElementById('mg-feedback').textContent = '';
          this._tick();
        }, 600);
      }, 800);
    } else {
      // Finalizado
      setTimeout(() => this._finish(), 900);
    }
  }

  _finish() {
    this._close();
    const quality = this.totalScore; // 0–100
    if (this.onComplete) this.onComplete(quality);
  }

  _skip() {
    this._close();
    if (this.onComplete) this.onComplete(50); // qualidade mínima ao pular
  }

  _close() {
    this.active   = false;
    this.keyHeld  = false;
    cancelAnimationFrame(this.animFrame);
    this.overlay.style.display = 'none';
    document.getElementById('mg-fill').style.width = '0%';
  }

  _showFeedback(msg, color = '#94a3b8') {
    const el = document.getElementById('mg-feedback');
    el.textContent = msg;
    el.style.color = color;
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

// Expor globalmente
if (typeof window !== 'undefined') window.MinigameSystem = MinigameSystem;
