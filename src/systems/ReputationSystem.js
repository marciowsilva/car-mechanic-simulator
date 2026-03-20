/**
 * ReputationSystem.js
 * Sistema de reputação visual com indicador na UI, histórico de avaliações,
 * perks desbloqueáveis e efeitos visuais na garagem (placas, decorações).
 *
 * Integração: importar em Game.js e UIManager.js
 */

// ─── Configuração de Níveis ───────────────────────────────────────────────────

export const REPUTATION_LEVELS = [
  {
    id: 'unknown',
    label: 'Desconhecido',
    minPoints: 0,
    maxPoints: 99,
    stars: 1,
    emoji: '🔧',
    color: '#888888',
    garageDecor: 'bare',
    description: 'Oficina nova, sem reputação ainda.',
    perks: [],
  },
  {
    id: 'apprentice',
    label: 'Aprendiz',
    minPoints: 100,
    maxPoints: 299,
    stars: 1.5,
    emoji: '🪛',
    color: '#cd853f',
    garageDecor: 'basic',
    description: 'Primeiros clientes satisfeitos.',
    perks: ['Descontos de 5% em peças'],
  },
  {
    id: 'mechanic',
    label: 'Mecânico',
    minPoints: 300,
    maxPoints: 699,
    stars: 2,
    emoji: '⚙️',
    color: '#c0c0c0',
    garageDecor: 'normal',
    description: 'Bom mecânico. Clientes indicam para amigos.',
    perks: ['Descontos de 10% em peças', 'Clientes retornam mais'],
  },
  {
    id: 'specialist',
    label: 'Especialista',
    minPoints: 700,
    maxPoints: 1499,
    stars: 3,
    emoji: '🏆',
    color: '#ffd700',
    garageDecor: 'upgraded',
    description: 'Especialista reconhecido na região.',
    perks: ['Descontos de 15%', 'Jobs de alta classe', 'Fila de espera'],
  },
  {
    id: 'master',
    label: 'Mestre Mecânico',
    minPoints: 1500,
    maxPoints: 2999,
    stars: 4,
    emoji: '⭐',
    color: '#ff9800',
    garageDecor: 'premium',
    description: 'Mestre na arte da mecânica. Fama regional.',
    perks: ['Descontos de 20%', 'Carros raros chegam', 'Bônus de gorjeta 30%'],
  },
  {
    id: 'legend',
    label: 'Lenda',
    minPoints: 3000,
    maxPoints: Infinity,
    stars: 5,
    emoji: '👑',
    color: '#e040fb',
    garageDecor: 'legendary',
    description: 'Lenda viva da mecânica. Clientes de todo o estado!',
    perks: ['Descontos de 25%', 'Carros exóticos', 'Bônus de gorjeta 50%', 'Patrocínios chegam'],
  },
];

// ─── ReputationSystem ─────────────────────────────────────────────────────────

export class ReputationSystem {
  constructor() {
    this._points = 0;
    this._currentLevel = REPUTATION_LEVELS[0];
    this._reviewHistory = []; // { rating, comment, clientName, timestamp }
    this._listeners = {};

    this._uiWidget = null;
    this._notificationQueue = [];
    this._isShowingNotification = false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    this._buildUI();
    this._updateUI();
    console.log('[ReputationSystem] Inicializado.');
  }

  // ── Reputação ─────────────────────────────────────────────────────────────

  /**
   * Adiciona pontos de reputação com uma avaliação.
   * @param {number} points - pontos a adicionar (pode ser negativo)
   * @param {Object} review - { rating: 1-5, comment: string, clientName: string }
   */
  addReputation(points, review = null) {
    const prevLevel = this._currentLevel;
    this._points = Math.max(0, this._points + points);

    if (review) {
      this._reviewHistory.unshift({
        ...review,
        points,
        timestamp: Date.now(),
      });
      // Mantém histórico limitado a 50 entradas
      if (this._reviewHistory.length > 50) this._reviewHistory.pop();
    }

    this._currentLevel = this._getLevelForPoints(this._points);

    // Animação de pontos
    this._showPointsAnimation(points);

    // Verifica se subiu de nível
    if (this._currentLevel.id !== prevLevel.id) {
      const isUpgrade = REPUTATION_LEVELS.indexOf(this._currentLevel) > REPUTATION_LEVELS.indexOf(prevLevel);
      this._onLevelChange(this._currentLevel, isUpgrade);
    }

    this._emit('reputationChange', {
      points: this._points,
      delta: points,
      level: this._currentLevel,
    });

    this._updateUI();
  }

  /**
   * Subtrai reputação (trabalho mal feito, reclamação).
   */
  penalize(points, reason = '') {
    this.addReputation(-Math.abs(points), reason ? { rating: 1, comment: reason, clientName: 'Reclamação' } : null);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get points() { return this._points; }
  get currentLevel() { return this._currentLevel; }
  get levelId() { return this._currentLevel.id; }
  get stars() { return this._currentLevel.stars; }

  /**
   * Porcentagem de progresso para o próximo nível (0-1).
   */
  get progressToNext() {
    const level = this._currentLevel;
    if (level.maxPoints === Infinity) return 1;
    const range = level.maxPoints - level.minPoints;
    const progress = this._points - level.minPoints;
    return Math.min(1, Math.max(0, progress / range));
  }

  get averageRating() {
    if (!this._reviewHistory.length) return 0;
    const sum = this._reviewHistory.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / this._reviewHistory.length;
  }

  /** Multiplicadores de perks baseados no nível. */
  get partDiscount() {
    const discounts = { unknown: 0, apprentice: 0.05, mechanic: 0.10, specialist: 0.15, master: 0.20, legend: 0.25 };
    return discounts[this._currentLevel.id] ?? 0;
  }

  get tipBonus() {
    const bonuses = { unknown: 0, apprentice: 0, mechanic: 0, specialist: 0, master: 0.30, legend: 0.50 };
    return bonuses[this._currentLevel.id] ?? 0;
  }

  // ── Histórico ─────────────────────────────────────────────────────────────

  getRecentReviews(count = 5) {
    return this._reviewHistory.slice(0, count);
  }

  // ── Serialização ──────────────────────────────────────────────────────────

  serialize() {
    return {
      points: this._points,
      levelId: this._currentLevel.id,
      reviewHistory: this._reviewHistory,
    };
  }

  load(data) {
    if (!data) return;
    this._points = data.points ?? 0;
    this._reviewHistory = data.reviewHistory ?? [];
    this._currentLevel = this._getLevelForPoints(this._points);
    this._updateUI();
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  _buildUI() {
    document.getElementById('reputation-widget')?.remove();

    if (!document.getElementById('reputation-styles')) {
      const style = document.createElement('style');
      style.id = 'reputation-styles';
      style.textContent = `
        #reputation-widget {
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0,0,0,0.8);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-family: 'Courier New', monospace;
          z-index: 1000;
          min-width: 200px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: border-color 0.5s, box-shadow 0.5s;
        }
        #reputation-widget:hover { border-color: rgba(255,255,255,0.3); }
        .rep-header { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .rep-main { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .rep-emoji { font-size: 24px; }
        .rep-info { flex: 1; }
        .rep-level { font-size: 13px; font-weight: bold; }
        .rep-points { font-size: 11px; color: #aaa; margin-top: 1px; }
        .rep-stars { font-size: 14px; letter-spacing: 2px; margin-bottom: 4px; }
        .rep-bar-container { background: rgba(255,255,255,0.1); border-radius: 4px; height: 4px; overflow: hidden; }
        .rep-bar { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
        .rep-perks { margin-top: 8px; font-size: 10px; color: #aaa; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; }
        .rep-perk { padding: 1px 0; }

        /* Notificação de pontos flutuante */
        .rep-float-points {
          position: fixed;
          left: 220px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          pointer-events: none;
          z-index: 9999;
          animation: float-up 1.5s ease-out forwards;
        }
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }

        /* Notificação de level up */
        #rep-level-up-banner {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.5);
          background: linear-gradient(135deg, #1a0030, #3d0066);
          border: 2px solid;
          border-radius: 16px;
          padding: 24px 40px;
          text-align: center;
          font-family: 'Courier New', monospace;
          color: white;
          z-index: 99999;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        #rep-level-up-banner.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .lu-emoji { font-size: 48px; margin-bottom: 8px; }
        .lu-title { font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 2px; }
        .lu-level { font-size: 24px; font-weight: bold; margin: 4px 0; }
        .lu-perks { font-size: 12px; color: #ccc; margin-top: 8px; }
        .lu-perk { padding: 2px 0; }
      `;
      document.head.appendChild(style);
    }

    const widget = document.createElement('div');
    widget.id = 'reputation-widget';
    widget.innerHTML = `
      <div class="rep-header">⭐ Reputação da Oficina</div>
      <div class="rep-main">
        <div class="rep-emoji" id="rep-emoji"></div>
        <div class="rep-info">
          <div class="rep-level" id="rep-level-name"></div>
          <div class="rep-points" id="rep-points-display"></div>
        </div>
      </div>
      <div class="rep-stars" id="rep-stars"></div>
      <div class="rep-bar-container">
        <div class="rep-bar" id="rep-bar"></div>
      </div>
      <div class="rep-perks" id="rep-perks"></div>
    `;

    widget.addEventListener('click', () => this._showReviewsPanel());
    document.body.appendChild(widget);
    this._uiWidget = widget;

    // Banner de level up
    const banner = document.createElement('div');
    banner.id = 'rep-level-up-banner';
    banner.innerHTML = `
      <div class="lu-emoji" id="lu-emoji"></div>
      <div class="lu-title">NÍVEL AUMENTOU!</div>
      <div class="lu-level" id="lu-level-name"></div>
      <div class="lu-perks" id="lu-perks-list"></div>
    `;
    document.body.appendChild(banner);
  }

  _updateUI() {
    const level = this._currentLevel;
    const widget = this._uiWidget;
    if (!widget) return;

    widget.style.borderColor = level.color + '66';
    widget.style.boxShadow = `0 0 15px ${level.color}33`;

    document.getElementById('rep-emoji').textContent = level.emoji;
    document.getElementById('rep-level-name').textContent = level.label;
    document.getElementById('rep-level-name').style.color = level.color;
    document.getElementById('rep-points-display').textContent = `${this._points} pts`;

    // Stars
    const fullStars = Math.floor(level.stars);
    const halfStar = level.stars % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(level.stars);
    document.getElementById('rep-stars').textContent =
      '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    document.getElementById('rep-stars').style.color = level.color;

    // Progress bar
    const bar = document.getElementById('rep-bar');
    bar.style.width = `${this.progressToNext * 100}%`;
    bar.style.background = `linear-gradient(90deg, ${level.color}88, ${level.color})`;

    // Perks
    const perksEl = document.getElementById('rep-perks');
    if (level.perks.length > 0) {
      perksEl.innerHTML = level.perks.map((p) => `<div class="rep-perk">✓ ${p}</div>`).join('');
    } else {
      perksEl.innerHTML = '<div class="rep-perk" style="color:#555">Sem perks ainda</div>';
    }
  }

  _showPointsAnimation(delta) {
    const widget = document.getElementById('reputation-widget');
    if (!widget) return;

    const el = document.createElement('div');
    el.className = 'rep-float-points';
    el.textContent = delta >= 0 ? `+${delta} ⭐` : `${delta} 💔`;
    el.style.color = delta >= 0 ? '#ffd700' : '#ff4444';
    el.style.top = `${widget.getBoundingClientRect().top + 20}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  _onLevelChange(newLevel, isUpgrade) {
    if (!isUpgrade) return;

    const banner = document.getElementById('rep-level-up-banner');
    if (!banner) return;

    document.getElementById('lu-emoji').textContent = newLevel.emoji;
    document.getElementById('lu-level-name').textContent = newLevel.label;
    document.getElementById('lu-level-name').style.color = newLevel.color;
    document.getElementById('lu-perks-list').innerHTML = newLevel.perks.length
      ? newLevel.perks.map((p) => `<div class="lu-perk">✓ ${p}</div>`).join('')
      : '';
    banner.style.borderColor = newLevel.color;

    banner.classList.add('visible');
    setTimeout(() => banner.classList.remove('visible'), 4000);

    this._emit('levelUp', { level: newLevel });
  }

  _showReviewsPanel() {
    // Cria modal de histórico de avaliações
    const existing = document.getElementById('rep-reviews-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'rep-reviews-modal';
    modal.style.cssText = `
      position:fixed;top:80px;left:20px;background:rgba(0,0,0,0.95);
      border:1px solid rgba(255,255,255,0.15);border-radius:12px;
      padding:16px;color:white;font-family:'Courier New',monospace;
      z-index:9999;width:280px;max-height:400px;overflow-y:auto;
    `;

    const recent = this.getRecentReviews(10);
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Avaliações Recentes</span>
        <button onclick="document.getElementById('rep-reviews-modal').remove()" 
                style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;">✕</button>
      </div>
      ${recent.length === 0 ? '<p style="color:#666;font-size:12px;">Nenhuma avaliação ainda.</p>' : ''}
      ${recent.map((r) => `
        <div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:11px;color:#aaa;">${r.clientName ?? 'Cliente'}</span>
            <span style="color:#ffd700;">${'★'.repeat(r.rating ?? 0)}</span>
          </div>
          ${r.comment ? `<div style="font-size:11px;color:#ccc;margin-top:2px;">${r.comment}</div>` : ''}
          <div style="font-size:10px;color:#555;margin-top:2px;">${r.points >= 0 ? '+' : ''}${r.points} pts</div>
        </div>
      `).join('')}
    `;
    document.body.appendChild(modal);

    // Fecha ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!modal.contains(e.target) && e.target !== document.getElementById('reputation-widget')) {
          modal.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _getLevelForPoints(points) {
    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
      if (points >= REPUTATION_LEVELS[i].minPoints) return REPUTATION_LEVELS[i];
    }
    return REPUTATION_LEVELS[0];
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data = {}) {
    (this._listeners[event] ?? []).forEach((cb) => cb(data));
  }
}
