// src/ui/UpgradePanel.js - Painel de upgrades melhorado

export class UpgradePanel {
    constructor(upgradeManager) {
        this.manager = upgradeManager;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'upgrade-panel';
        this.panel.className = 'upgrade-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="upgrade-header">
                <h2>🛠️ UPGRADES</h2>
                <div class="header-stats">
                    <span class="money">💰 R$ <span id="upgrade-money">0</span></span>
                    <button class="close-btn">×</button>
                </div>
            </div>
            
            <div class="upgrade-tabs">
                <button class="tab-btn active" data-tab="tools">🔧 Ferramentas</button>
                <button class="tab-btn" data-tab="garage">🏢 Garagem</button>
                <button class="tab-btn" data-tab="stats">📊 Estatísticas</button>
            </div>
            
            <div class="tab-content active" id="tools-tab">
                <div class="upgrade-grid" id="tool-upgrades"></div>
            </div>
            
            <div class="tab-content" id="garage-tab">
                <div class="upgrade-grid" id="garage-upgrades"></div>
            </div>
            
            <div class="tab-content" id="stats-tab">
                <div class="stats-panel" id="stats-content"></div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
        this.initEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .upgrade-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 700px;
                max-width: 90%;
                max-height: 80vh;
                background: rgba(30, 30, 30, 0.98);
                border: 2px solid #ff6b00;
                border-radius: 15px;
                color: white;
                z-index: 1000;
                overflow: hidden;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 30px rgba(0,0,0,0.5);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .upgrade-header h2 {
                margin: 0;
                color: #ff6b00;
                font-size: 20px;
            }
            
            .header-stats {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .header-stats .money {
                color: #ffd700;
                font-weight: bold;
                font-size: 16px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0 10px;
                transition: color 0.3s;
            }
            
            .close-btn:hover {
                color: #ff6b00;
            }
            
            .upgrade-tabs {
                display: flex;
                gap: 10px;
                padding: 15px 20px;
                background: #222;
                border-bottom: 1px solid #444;
            }
            
            .tab-btn {
                flex: 1;
                padding: 10px;
                background: #333;
                border: none;
                color: white;
                cursor: pointer;
                border-radius: 5px;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .tab-btn:hover {
                background: #444;
            }
            
            .tab-btn.active {
                background: #ff6b00;
                color: white;
            }
            
            .tab-content {
                display: none;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .upgrade-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
            }
            
            .upgrade-item {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #444;
                transition: all 0.3s;
            }
            
            .upgrade-item:hover {
                border-color: #ff6b00;
                transform: translateY(-2px);
            }
            
            .upgrade-item.maxed {
                opacity: 0.6;
                border-color: #4CAF50;
            }
            
            .upgrade-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .upgrade-name {
                font-size: 16px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .upgrade-desc {
                font-size: 12px;
                color: #888;
                margin-bottom: 10px;
            }
            
            .upgrade-level {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .level-bar {
                flex: 1;
                height: 4px;
                background: #444;
                border-radius: 2px;
                margin: 0 10px;
                overflow: hidden;
            }
            
            .level-progress {
                height: 100%;
                background: #ff6b00;
                transition: width 0.3s;
            }
            
            .level-text {
                font-size: 12px;
                color: #ffd700;
                min-width: 60px;
                text-align: right;
            }
            
            .upgrade-effect {
                font-size: 13px;
                color: #4CAF50;
                margin: 10px 0;
                padding: 5px;
                background: rgba(76, 175, 80, 0.1);
                border-radius: 4px;
                text-align: center;
            }
            
            .upgrade-price {
                font-size: 14px;
                color: #ffd700;
                font-weight: bold;
                margin: 10px 0;
                text-align: right;
            }
            
            .upgrade-btn {
                width: 100%;
                padding: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .upgrade-btn:hover:not(:disabled) {
                background: #45a049;
                transform: scale(1.02);
            }
            
            .upgrade-btn:disabled {
                background: #666;
                cursor: not-allowed;
                opacity: 0.5;
            }
            
            .upgrade-btn.maxed-btn {
                background: #333;
                color: #888;
                cursor: default;
            }
            
            .stats-panel {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .stat-card {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #ff6b00;
                margin: 10px 0;
            }
            
            .stat-label {
                font-size: 12px;
                color: #888;
            }
        `;
        
        document.head.appendChild(style);
    }

    initEventListeners() {
        // Fechar
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());
        
        // Abas
        this.panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tabId = btn.dataset.tab;
                this.panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.panel.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.panel.style.display = 'block';
        this.update();
    }

    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    update() {
        // Atualizar dinheiro
        const moneyEl = document.getElementById('upgrade-money');
        if (moneyEl && window.gameState) {
            moneyEl.textContent = window.gameState.money;
        }
        
        const stats = this.manager.getStats();
        
        // Atualizar ferramentas
        this.updateTools(stats.tools);
        
        // Atualizar garagem
        this.updateGarage(stats.garage);
        
        // Atualizar estatísticas
        this.updateStats(stats);
    }

    updateTools(tools) {
        const container = this.panel.querySelector('#tool-upgrades');
        container.innerHTML = '';
        
        Object.entries(tools).forEach(([toolId, data]) => {
            const efficiency = data.efficiency;
            const isMaxed = data.level >= 5;
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${isMaxed ? 'maxed' : ''}`;
            
            let buttonHtml = '';
            if (isMaxed) {
                buttonHtml = `<button class="upgrade-btn maxed-btn" disabled>⭐ NÍVEL MÁXIMO</button>`;
            } else {
                buttonHtml = `<button class="upgrade-btn" onclick="window.upgradeTool('${toolId}')">
                    🔧 Upgradar (R$ ${data.nextPrice})
                </button>`;
            }
            
            item.innerHTML = `
                <div class="upgrade-name">${this.manager.getToolName(toolId)}</div>
                <div class="upgrade-level">
                    <span>Nível ${data.level}/5</span>
                    <div class="level-bar">
                        <div class="level-progress" style="width: ${(data.level/5)*100}%"></div>
                    </div>
                </div>
                <div class="upgrade-effect">
                    ⚡ Reparo: +${efficiency.repairAmount}% | 💰 Custo: R$ ${efficiency.cost}
                </div>
                ${buttonHtml}
            `;
            
            container.appendChild(item);
        });
    }

    updateGarage(garage) {
        const container = this.panel.querySelector('#garage-upgrades');
        container.innerHTML = '';
        
        Object.entries(garage).forEach(([upgradeId, data]) => {
            const isMaxed = data.level >= data.maxLevel;
            const progress = (data.level / data.maxLevel) * 100;
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${isMaxed ? 'maxed' : ''}`;
            
            let buttonHtml = '';
            if (isMaxed) {
                buttonHtml = `<button class="upgrade-btn maxed-btn" disabled>⭐ NÍVEL MÁXIMO</button>`;
            } else {
                buttonHtml = `<button class="upgrade-btn" onclick="window.upgradeGarage('${upgradeId}')">
                    🏢 Upgradar (R$ ${data.nextPrice})
                </button>`;
            }
            
            item.innerHTML = `
                <div class="upgrade-icon">${data.icon}</div>
                <div class="upgrade-name">${data.name}</div>
                <div class="upgrade-desc">${data.description}</div>
                <div class="upgrade-level">
                    <span>Nível ${data.level}/${data.maxLevel}</span>
                    <div class="level-bar">
                        <div class="level-progress" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="upgrade-effect">
                    ✨ Efeito: +${data.effect}%
                </div>
                ${buttonHtml}
            `;
            
            container.appendChild(item);
        });
    }

    updateStats(stats) {
        const container = this.panel.querySelector('#stats-content');
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">💰 Desconto em Peças</div>
                <div class="stat-value">${stats.partsDiscount}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">⭐ Bônus de Experiência</div>
                <div class="stat-value">+${stats.experienceBonus}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">🔍 Precisão de Diagnóstico</div>
                <div class="stat-value">+${stats.diagnosticBonus}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">⬆️ Velocidade de Reparo</div>
                <div class="stat-value">+${stats.repairSpeed}%</div>
            </div>
        `;
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.UpgradePanel = UpgradePanel;
}