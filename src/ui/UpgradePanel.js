// src/ui/UpgradePanel.js — Redesign flat moderno

export class UpgradePanel {
  constructor(upgradeManager) {
    this.manager = upgradeManager;
    this.isVisible = false;
    this.activeTab = 'tools';
    this._createPanel();
  }

  _createPanel() {
    // Injetar fonte se necessário
    if (!document.getElementById('upgrade-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'upgrade-panel-styles';
      style.textContent = `
        #upgrade-panel {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 2000; display: none; align-items: center; justify-content: center;
          background: rgba(10,12,20,0.75); backdrop-filter: blur(6px);
          font-family: 'DM Sans', sans-serif;
        }
        #upgrade-panel.show { display: flex; }

        .up-modal {
          background: #181c27; border: 1px solid #2a3047;
          border-radius: 20px; width: 780px; max-width: 95vw;
          max-height: 88vh; display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6); overflow: hidden;
        }

        /* Header */
        .up-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #2a3047; flex-shrink: 0;
        }
        .up-header-left { display: flex; align-items: center; gap: 12px; }
        .up-title { font-size: 17px; font-weight: 700; color: #e2e8f0; }
        .up-money {
          display: flex; align-items: center; gap: 6px;
          background: rgba(250,204,21,0.08); border: 1px solid rgba(250,204,21,0.2);
          border-radius: 100px; padding: 6px 14px;
          font-size: 14px; font-weight: 700; color: #facc15;
          font-family: 'DM Mono', monospace;
        }
        .up-close {
          width: 32px; height: 32px; border-radius: 8px;
          background: transparent; border: 1px solid #2a3047;
          color: #64748b; cursor: pointer; font-size: 18px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .up-close:hover { background: #252b3b; color: #e2e8f0; }

        /* Tabs */
        .up-tabs {
          display: flex; gap: 4px; padding: 12px 24px;
          border-bottom: 1px solid #2a3047; flex-shrink: 0;
          background: #181c27;
        }
        .up-tab {
          padding: 8px 18px; border-radius: 100px; font-size: 13px;
          font-weight: 600; cursor: pointer; border: 1px solid transparent;
          color: #64748b; background: transparent; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .up-tab:hover { background: #1f2433; color: #94a3b8; }
        .up-tab.active {
          background: rgba(59,130,246,0.12); border-color: #3b82f6;
          color: #60a5fa;
        }

        /* Body */
        .up-body { overflow-y: auto; padding: 20px 24px; flex: 1; }
        .up-body::-webkit-scrollbar { width: 4px; }
        .up-body::-webkit-scrollbar-track { background: transparent; }
        .up-body::-webkit-scrollbar-thumb { background: #2a3047; border-radius: 100px; }

        /* Grid */
        .up-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }

        /* Card de upgrade */
        .up-card {
          background: #1f2433; border: 1px solid #2a3047;
          border-radius: 14px; padding: 18px; transition: all 0.15s;
        }
        .up-card:hover { border-color: #363d55; }
        .up-card.maxed { opacity: 0.6; }

        .up-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 14px;
        }
        .up-card-icon {
          width: 44px; height: 44px; border-radius: 10px;
          background: #252b3b; display: flex; align-items: center;
          justify-content: center; font-size: 22px; flex-shrink: 0;
        }
        .up-card-info { flex: 1; margin: 0 12px; }
        .up-card-name { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px; }
        .up-card-desc { font-size: 11px; color: #64748b; line-height: 1.4; }

        .up-level-badge {
          font-size: 11px; font-weight: 700; padding: 3px 8px;
          border-radius: 100px; white-space: nowrap; flex-shrink: 0;
        }
        .up-level-badge.normal {
          background: rgba(59,130,246,0.12); color: #60a5fa;
          border: 1px solid rgba(59,130,246,0.25);
        }
        .up-level-badge.maxed {
          background: rgba(34,197,94,0.12); color: #22c55e;
          border: 1px solid rgba(34,197,94,0.25);
        }

        /* Barra de nível */
        .up-level-bar-wrap { margin-bottom: 12px; }
        .up-level-bar-labels {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #64748b; margin-bottom: 5px;
        }
        .up-level-bar-bg {
          height: 4px; background: #252b3b; border-radius: 100px;
          overflow: hidden;
        }
        .up-level-bar-fill {
          height: 100%; border-radius: 100px; background: #3b82f6;
          transition: width 0.4s ease;
        }
        .up-card.maxed .up-level-bar-fill { background: #22c55e; }

        /* Efeitos */
        .up-effects {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;
        }
        .up-effect-tag {
          font-size: 11px; font-weight: 600; padding: 3px 9px;
          border-radius: 100px; background: rgba(34,197,94,0.08);
          color: #22c55e; border: 1px solid rgba(34,197,94,0.2);
        }
        .up-effect-tag.cost {
          background: rgba(250,204,21,0.08); color: #facc15;
          border-color: rgba(250,204,21,0.2);
        }

        /* Botão de upgrade */
        .up-btn {
          width: 100%; padding: 10px; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .up-btn.buy {
          background: #22c55e; color: white;
        }
        .up-btn.buy:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.01); }
        .up-btn.buy:disabled {
          background: #252b3b; color: #64748b; cursor: not-allowed;
        }
        .up-btn.maxed-btn {
          background: transparent; color: #22c55e;
          border: 1px solid rgba(34,197,94,0.25); cursor: default;
        }

        /* Stats tab */
        .up-stats-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        .up-stat-card {
          background: #1f2433; border: 1px solid #2a3047;
          border-radius: 14px; padding: 20px; text-align: center;
        }
        .up-stat-icon { font-size: 28px; margin-bottom: 8px; }
        .up-stat-value {
          font-size: 28px; font-weight: 700; color: #3b82f6;
          font-family: 'DM Mono', monospace; margin-bottom: 4px;
        }
        .up-stat-label { font-size: 12px; color: #64748b; }
      `;
      document.head.appendChild(style);
    }

    this.panel = document.createElement('div');
    this.panel.id = 'upgrade-panel';

    this.panel.innerHTML = `
      <div class="up-modal">
        <div class="up-header">
          <div class="up-header-left">
            <div class="up-title">Upgrades</div>
            <div class="up-money" id="up-money">R$ 0</div>
          </div>
          <button class="up-close" id="up-close">✕</button>
        </div>

        <div class="up-tabs">
          <button class="up-tab active" data-tab="tools">Ferramentas</button>
          <button class="up-tab" data-tab="garage">Oficina</button>
          <button class="up-tab" data-tab="stats">Estatísticas</button>
        </div>

        <div class="up-body" id="up-body">
          <div id="up-content"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('up-close').addEventListener('click', () => this.hide());

    this.panel.querySelectorAll('.up-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.panel.querySelectorAll('.up-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this._renderTab();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) this.hide();
    });
  }

  show() {
    this.isVisible = true;
    this.panel.classList.add('show');
    this.update();
  }

  hide() {
    this.isVisible = false;
    this.panel.classList.remove('show');
  }

  toggle() { this.isVisible ? this.hide() : this.show(); }

  update() {
    // Dinheiro
    const moneyEl = document.getElementById('up-money');
    if (moneyEl && window.gameState) {
      moneyEl.textContent = `R$ ${(window.gameState.money || 0).toLocaleString('pt-BR')}`;
    }
    this._renderTab();
  }

  _renderTab() {
    const stats = this.manager.getStats();
    const content = document.getElementById('up-content');
    if (!content) return;

    if (this.activeTab === 'tools')  content.innerHTML = this._renderTools(stats.tools);
    if (this.activeTab === 'garage') content.innerHTML = this._renderGarage(stats.garage);
    if (this.activeTab === 'stats')  content.innerHTML = this._renderStats(stats);
  }

  _renderTools(tools) {
    const money = window.gameState?.money || 0;
    let html = '<div class="up-grid">';

    const icons = { wrench:'🔧', screwdriver:'🪛', hammer:'🔨', welder:'⚡', diagnostic:'📊' };
    const descs = {
      wrench:      'Reparo básico eficiente e versátil',
      screwdriver: 'Alta precisão para ajustes finos',
      hammer:      'Força bruta para reparos pesados',
      welder:      'Soldagem e reparos avançados',
      diagnostic:  'Identificação precisa de falhas',
    };

    Object.entries(tools).forEach(([id, data]) => {
      const isMaxed  = data.level >= 5;
      const canBuy   = !isMaxed && money >= (data.nextPrice || 0);
      const pct      = (data.level / 5) * 100;
      const eff      = data.efficiency;

      html += `
        <div class="up-card ${isMaxed ? 'maxed' : ''}">
          <div class="up-card-top">
            <div class="up-card-icon">${icons[id] || '🔧'}</div>
            <div class="up-card-info">
              <div class="up-card-name">${this.manager.getToolName(id)}</div>
              <div class="up-card-desc">${descs[id] || ''}</div>
            </div>
            <span class="up-level-badge ${isMaxed ? 'maxed' : 'normal'}">
              ${isMaxed ? 'MAX' : `Nv ${data.level}`}
            </span>
          </div>

          <div class="up-level-bar-wrap">
            <div class="up-level-bar-labels">
              <span>Nível ${data.level} / 5</span>
              ${!isMaxed ? `<span style="color:#facc15">Próximo: R$ ${(data.nextPrice||0).toLocaleString('pt-BR')}</span>` : '<span style="color:#22c55e">Nível máximo</span>'}
            </div>
            <div class="up-level-bar-bg">
              <div class="up-level-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <div class="up-effects">
            <span class="up-effect-tag">+${eff.repairAmount}% reparo</span>
            <span class="up-effect-tag cost">R$ ${eff.cost} / uso</span>
          </div>

          ${isMaxed
            ? `<button class="up-btn maxed-btn">✓ Nível máximo</button>`
            : `<button class="up-btn buy" onclick="window.upgradeTool('${id}'); window.uiManager?.upgradePanel?.update()"
                ${canBuy ? '' : 'disabled'}>
                ${canBuy ? `Melhorar — R$ ${(data.nextPrice||0).toLocaleString('pt-BR')}` : 'Dinheiro insuficiente'}
              </button>`
          }
        </div>`;
    });

    return html + '</div>';
  }

  _renderGarage(garage) {
    const money = window.gameState?.money || 0;
    let html = '<div class="up-grid">';

    Object.entries(garage).forEach(([id, data]) => {
      const isMaxed = data.level >= data.maxLevel;
      const canBuy  = !isMaxed && money >= (data.nextPrice || 0);
      const pct     = (data.level / data.maxLevel) * 100;

      html += `
        <div class="up-card ${isMaxed ? 'maxed' : ''}">
          <div class="up-card-top">
            <div class="up-card-icon">${data.icon}</div>
            <div class="up-card-info">
              <div class="up-card-name">${data.name}</div>
              <div class="up-card-desc">${data.description}</div>
            </div>
            <span class="up-level-badge ${isMaxed ? 'maxed' : 'normal'}">
              ${isMaxed ? 'MAX' : `Nv ${data.level}`}
            </span>
          </div>

          <div class="up-level-bar-wrap">
            <div class="up-level-bar-labels">
              <span>Nível ${data.level} / ${data.maxLevel}</span>
              ${!isMaxed ? `<span style="color:#facc15">Próximo: R$ ${(data.nextPrice||0).toLocaleString('pt-BR')}</span>` : '<span style="color:#22c55e">Nível máximo</span>'}
            </div>
            <div class="up-level-bar-bg">
              <div class="up-level-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <div class="up-effects">
            <span class="up-effect-tag">+${data.effect}% bônus</span>
          </div>

          ${isMaxed
            ? `<button class="up-btn maxed-btn">✓ Nível máximo</button>`
            : `<button class="up-btn buy" onclick="window.upgradeGarage('${id}'); window.uiManager?.upgradePanel?.update()"
                ${canBuy ? '' : 'disabled'}>
                ${canBuy ? `Melhorar — R$ ${(data.nextPrice||0).toLocaleString('pt-BR')}` : 'Dinheiro insuficiente'}
              </button>`
          }
        </div>`;
    });

    return html + '</div>';
  }

  _renderStats(stats) {
    const items = [
      { icon: '💰', value: stats.partsDiscount + '%',   label: 'Desconto em Peças' },
      { icon: '⭐', value: '+' + stats.experienceBonus + '%', label: 'Bônus de Experiência' },
      { icon: '🔍', value: '+' + stats.diagnosticBonus + '%', label: 'Precisão de Diagnóstico' },
      { icon: '⬆️', value: '+' + stats.repairSpeed + '%',     label: 'Velocidade de Reparo' },
    ];

    return `<div class="up-stats-grid">
      ${items.map(i => `
        <div class="up-stat-card">
          <div class="up-stat-icon">${i.icon}</div>
          <div class="up-stat-value">${i.value}</div>
          <div class="up-stat-label">${i.label}</div>
        </div>
      `).join('')}
    </div>`;
  }
}

if (typeof window !== 'undefined') window.UpgradePanel = UpgradePanel;
