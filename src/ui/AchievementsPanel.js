// src/ui/AchievementsPanel.js — Redesign flat moderno

export class AchievementsPanel {
  constructor(achievementSystem) {
    this.achievementSystem = achievementSystem;
    this.isVisible = false;
    this.currentCategory = 'all';
    this._createPanel();
  }

  _createPanel() {
    if (!document.getElementById('ach-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'ach-panel-styles';
      style.textContent = `
        #achievements-panel {
          position: fixed; inset: 0; z-index: 2000;
          display: none; align-items: center; justify-content: center;
          background: rgba(10,12,20,0.78); backdrop-filter: blur(6px);
          font-family: 'DM Sans', sans-serif;
        }
        #achievements-panel.show { display: flex; }

        .ach-modal {
          background: #181c27; border: 1px solid #2a3047;
          border-radius: 20px; width: 860px; max-width: 95vw;
          max-height: 88vh; display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6); overflow: hidden;
        }

        .ach-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #2a3047; flex-shrink: 0;
        }
        .ach-header-left { display: flex; align-items: center; gap: 12px; }
        .ach-title { font-size: 17px; font-weight: 700; color: #e2e8f0; }
        .ach-progress-badge {
          font-size: 12px; font-weight: 600; padding: 4px 10px;
          border-radius: 100px; background: rgba(59,130,246,0.12);
          color: #60a5fa; border: 1px solid rgba(59,130,246,0.25);
          font-family: 'DM Mono', monospace;
        }
        .ach-close {
          width: 32px; height: 32px; border-radius: 8px;
          background: transparent; border: 1px solid #2a3047;
          color: #64748b; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .ach-close:hover { background: #252b3b; color: #e2e8f0; }

        /* Stats */
        .ach-stats {
          display: grid; grid-template-columns: repeat(6,1fr);
          border-bottom: 1px solid #2a3047; flex-shrink: 0;
        }
        .ach-stat {
          text-align: center; padding: 14px 8px;
          border-right: 1px solid #2a3047;
        }
        .ach-stat:last-child { border-right: none; }
        .ach-stat-value {
          font-size: 20px; font-weight: 700; color: #3b82f6;
          font-family: 'DM Mono', monospace; margin-bottom: 3px;
        }
        .ach-stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }

        /* Barra de progresso geral */
        .ach-overall-bar {
          padding: 12px 24px; border-bottom: 1px solid #2a3047;
          display: flex; align-items: center; gap: 12px; flex-shrink: 0;
        }
        .ach-bar-bg {
          flex: 1; height: 6px; background: #1f2433;
          border-radius: 100px; overflow: hidden;
        }
        .ach-bar-fill {
          height: 100%; border-radius: 100px; background: #3b82f6;
          transition: width 0.6s ease;
        }
        .ach-bar-label { font-size: 12px; color: #64748b; white-space: nowrap; font-family: 'DM Mono', monospace; }

        /* Categorias */
        .ach-cats {
          display: flex; gap: 6px; padding: 12px 24px;
          border-bottom: 1px solid #2a3047; flex-wrap: wrap; flex-shrink: 0;
          background: #181c27;
        }
        .ach-cat {
          padding: 6px 14px; border-radius: 100px; font-size: 12px;
          font-weight: 600; cursor: pointer; border: 1px solid transparent;
          color: #64748b; background: transparent; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .ach-cat:hover { background: #1f2433; color: #94a3b8; }
        .ach-cat.active {
          background: rgba(59,130,246,0.12); border-color: #3b82f6; color: #60a5fa;
        }

        /* Grid */
        .ach-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
          gap: 10px; padding: 16px 24px; overflow-y: auto; flex: 1;
        }
        .ach-grid::-webkit-scrollbar { width: 4px; }
        .ach-grid::-webkit-scrollbar-track { background: transparent; }
        .ach-grid::-webkit-scrollbar-thumb { background: #2a3047; border-radius: 100px; }

        /* Card */
        .ach-card {
          background: #1f2433; border: 1px solid #2a3047;
          border-radius: 14px; padding: 16px; transition: all 0.15s;
          position: relative;
        }
        .ach-card:hover { border-color: #363d55; }
        .ach-card.unlocked { border-color: rgba(250,204,21,0.3); background: rgba(250,204,21,0.03); }
        .ach-card.hidden-card { opacity: 0.45; }

        .ach-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .ach-card-icon {
          width: 44px; height: 44px; border-radius: 10px;
          background: #252b3b; display: flex; align-items: center;
          justify-content: center; font-size: 22px; flex-shrink: 0;
        }
        .ach-card.unlocked .ach-card-icon { background: rgba(250,204,21,0.1); }

        .ach-card-info { flex: 1; min-width: 0; }
        .ach-card-name {
          font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ach-card.unlocked .ach-card-name { color: #facc15; }
        .ach-card-desc { font-size: 11px; color: #64748b; line-height: 1.4; }

        .ach-badge {
          position: absolute; top: 10px; right: 10px;
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          border-radius: 100px;
        }
        .ach-badge.secret { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
        .ach-badge.unlocked-badge { background: rgba(250,204,21,0.12); color: #facc15; border: 1px solid rgba(250,204,21,0.25); }

        .ach-reward {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;
        }
        .ach-reward-tag {
          font-size: 10px; font-weight: 600; padding: 2px 7px;
          border-radius: 100px;
        }
        .ach-reward-tag.money  { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid rgba(250,204,21,0.2); }
        .ach-reward-tag.xp     { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }

        .ach-status {
          font-size: 11px; font-weight: 600; padding: 3px 9px;
          border-radius: 100px; display: inline-block;
        }
        .ach-status.done   { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.25); }
        .ach-status.locked { background: rgba(100,116,139,0.12); color: #64748b; border: 1px solid rgba(100,116,139,0.2); }

        /* Notificação de conquista */
        .ach-notif {
          position: fixed; bottom: 88px; right: 16px;
          background: #181c27; border: 1px solid rgba(250,204,21,0.3);
          border-left: 3px solid #facc15;
          border-radius: 14px; padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
          min-width: 280px; max-width: 340px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          z-index: 9999;
          transform: translateX(calc(100% + 24px));
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'DM Sans', sans-serif;
        }
        .ach-notif.show { transform: translateX(0); }
        .ach-notif-icon { font-size: 32px; flex-shrink: 0; }
        .ach-notif-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
        .ach-notif-name { font-size: 14px; font-weight: 700; color: #facc15; margin-bottom: 4px; }
        .ach-notif-reward { font-size: 11px; color: #94a3b8; }
      `;
      document.head.appendChild(style);
    }

    this.panel = document.createElement('div');
    this.panel.id = 'achievements-panel';

    this.panel.innerHTML = `
      <div class="ach-modal">
        <div class="ach-header">
          <div class="ach-header-left">
            <div class="ach-title">Conquistas</div>
            <div class="ach-progress-badge" id="ach-progress">0 / 0</div>
          </div>
          <button class="ach-close" id="ach-close">✕</button>
        </div>

        <div class="ach-stats" id="ach-stats"></div>

        <div class="ach-overall-bar">
          <div class="ach-bar-bg"><div class="ach-bar-fill" id="ach-bar" style="width:0%"></div></div>
          <div class="ach-bar-label" id="ach-bar-label">0%</div>
        </div>

        <div class="ach-cats">
          <button class="ach-cat active" data-category="all">Todas</button>
          <button class="ach-cat" data-category="service">🚗 Serviços</button>
          <button class="ach-cat" data-category="money">💰 Dinheiro</button>
          <button class="ach-cat" data-category="quality">✨ Qualidade</button>
          <button class="ach-cat" data-category="customer">👥 Clientes</button>
          <button class="ach-cat" data-category="tools">🔧 Ferramentas</button>
          <button class="ach-cat" data-category="parts">🛒 Peças</button>
          <button class="ach-cat" data-category="time">⏰ Tempo</button>
          <button class="ach-cat" data-category="secret">🔮 Secretas</button>
        </div>

        <div class="ach-grid" id="ach-grid"></div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('ach-close').addEventListener('click', () => this.hide());

    this.panel.querySelectorAll('.ach-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        this.panel.querySelectorAll('.ach-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        this._renderGrid();
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isVisible) this.hide();
    });
  }

  show()   { this.isVisible = true;  this.panel.classList.add('show');    this.update(); }
  hide()   { this.isVisible = false; this.panel.classList.remove('show'); }
  toggle() { this.isVisible ? this.hide() : this.show(); }

  update() {
    this._renderProgress();
    this._renderStats();
    this._renderGrid();
  }

  _renderProgress() {
    const p = this.achievementSystem.getProgress?.() || { unlocked: 0, total: 0, percentage: 0 };
    const badge = document.getElementById('ach-progress');
    const bar   = document.getElementById('ach-bar');
    const label = document.getElementById('ach-bar-label');
    if (badge) badge.textContent = `${p.unlocked} / ${p.total}`;
    if (bar)   bar.style.width  = p.percentage + '%';
    if (label) label.textContent = p.percentage + '%';
  }

  _renderStats() {
    const s = this.achievementSystem.getStats?.() || {};
    const el = document.getElementById('ach-stats');
    if (!el) return;
    const items = [
      { v: s.jobsCompleted  || 0, l: 'Serviços' },
      { v: s.perfectJobs    || 0, l: 'Perfeitos' },
      { v: s.fastJobs       || 0, l: 'Rápidos' },
      { v: s.vipCustomers   || 0, l: 'VIPs' },
      { v: s.upgradesDone   || 0, l: 'Upgrades' },
      { v: s.partsBought    || 0, l: 'Peças' },
    ];
    el.innerHTML = items.map(i => `
      <div class="ach-stat">
        <div class="ach-stat-value">${i.v}</div>
        <div class="ach-stat-label">${i.l}</div>
      </div>`).join('');
  }

  _renderGrid() {
    const grid = document.getElementById('ach-grid');
    if (!grid) return;

    const list = this.currentCategory === 'all'
      ? this.achievementSystem.getAllAchievements?.() || []
      : this.achievementSystem.getAchievementsByCategory?.(this.currentCategory) || [];

    if (!list.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;font-size:14px">Nenhuma conquista nesta categoria</div>';
      return;
    }

    // Ordenar: desbloqueadas primeiro, depois secretas por último
    const sorted = [...list].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      if (a.secret && !b.secret) return 1;
      if (!a.secret && b.secret) return -1;
      return 0;
    });

    grid.innerHTML = sorted.map(ach => {
      const isHidden = ach.hidden && !ach.unlocked;
      const name  = isHidden ? '???' : ach.name;
      const desc  = isHidden ? 'Complete condições especiais para revelar' : ach.description;
      const icon  = isHidden ? '🔒' : ach.icon;

      const badge = ach.unlocked
        ? '<div class="ach-badge unlocked-badge">✓ Obtida</div>'
        : ach.secret && !ach.unlocked
        ? '<div class="ach-badge secret">Secreta</div>'
        : '';

      const rewards = [];
      if (ach.reward?.money)      rewards.push(`<span class="ach-reward-tag money">+R$ ${ach.reward.money}</span>`);
      if (ach.reward?.experience) rewards.push(`<span class="ach-reward-tag xp">+${ach.reward.experience} XP</span>`);

      const status = ach.unlocked
        ? '<span class="ach-status done">✓ Desbloqueada</span>'
        : '<span class="ach-status locked">🔒 Bloqueada</span>';

      return `
        <div class="ach-card ${ach.unlocked ? 'unlocked' : ''} ${isHidden ? 'hidden-card' : ''}">
          ${badge}
          <div class="ach-card-top">
            <div class="ach-card-icon">${icon}</div>
            <div class="ach-card-info">
              <div class="ach-card-name">${name}</div>
              <div class="ach-card-desc">${desc}</div>
            </div>
          </div>
          ${rewards.length ? `<div class="ach-reward">${rewards.join('')}</div>` : ''}
          ${status}
        </div>`;
    }).join('');
  }

  showUnlockedNotification(achievement) {
    // Remover notif anterior se existir
    document.querySelector('.ach-notif')?.remove();

    const notif = document.createElement('div');
    notif.className = 'ach-notif';

    const rewardParts = [];
    if (achievement.reward?.money)      rewardParts.push(`+R$ ${achievement.reward.money}`);
    if (achievement.reward?.experience) rewardParts.push(`+${achievement.reward.experience} XP`);

    notif.innerHTML = `
      <div class="ach-notif-icon">${achievement.icon}</div>
      <div>
        <div class="ach-notif-label">Conquista desbloqueada</div>
        <div class="ach-notif-name">${achievement.name}</div>
        ${rewardParts.length ? `<div class="ach-notif-reward">${rewardParts.join(' · ')}</div>` : ''}
      </div>
    `;

    document.body.appendChild(notif);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => notif.classList.add('show'));
    });

    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 400);
    }, 5000);
  }
}

if (typeof window !== 'undefined') window.AchievementsPanel = AchievementsPanel;
