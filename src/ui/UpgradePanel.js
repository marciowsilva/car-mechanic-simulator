// src/ui/UpgradePanel.js - Painel de upgrades

export class UpgradePanel {
    constructor(upgradeManager) {
        this.manager = upgradeManager;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        // Criar elemento do painel
        this.panel = document.createElement('div');
        this.panel.id = 'upgrade-panel';
        this.panel.className = 'upgrade-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="upgrade-header">
                <h2>🛠️ UPGRADES</h2>
                <button class="close-btn">×</button>
            </div>
            
            <div class="upgrade-section">
                <h3>🔧 Ferramentas</h3>
                <div id="tool-upgrades" class="upgrade-grid"></div>
            </div>
            
            <div class="upgrade-section">
                <h3>🏢 Garagem</h3>
                <div id="garage-upgrades" class="upgrade-grid"></div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // Event listeners
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());
        
        // Estilos
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .upgrade-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                max-width: 90%;
                max-height: 80vh;
                background: rgba(30, 30, 30, 0.95);
                border: 2px solid #ff6b00;
                border-radius: 10px;
                color: white;
                z-index: 1000;
                overflow-y: auto;
                backdrop-filter: blur(5px);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #ff6b00;
            }
            
            .upgrade-header h2 {
                margin: 0;
                color: #ff6b00;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0 10px;
            }
            
            .close-btn:hover {
                color: #ff6b00;
            }
            
            .upgrade-section {
                padding: 20px;
            }
            
            .upgrade-section h3 {
                margin: 0 0 15px 0;
                color: #ffd700;
            }
            
            .upgrade-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .upgrade-item {
                background: #3a3a3a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #555;
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
                background: #555;
                border-radius: 2px;
                margin: 0 10px;
                overflow: hidden;
            }
            
            .level-progress {
                height: 100%;
                background: #ff6b00;
                transition: width 0.3s;
            }
            
            .upgrade-price {
                color: #ffd700;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .upgrade-btn {
                width: 100%;
                padding: 8px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .upgrade-btn:disabled {
                background: #666;
                cursor: not-allowed;
            }
            
            .upgrade-btn:hover:not(:disabled) {
                background: #45a049;
            }
        `;
        
        document.head.appendChild(style);
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
        const stats = this.manager.getStats();
        
        // Atualizar ferramentas
        const toolDiv = this.panel.querySelector('#tool-upgrades');
        toolDiv.innerHTML = '';
        
        Object.entries(stats.toolLevels).forEach(([toolId, level]) => {
            if (level < 5) {
                const price = this.manager.upgradePrices.tool[level - 1];
                const efficiency = this.manager.getToolEfficiency(toolId);
                
                const item = document.createElement('div');
                item.className = 'upgrade-item';
                item.innerHTML = `
                    <div class="upgrade-name">${this.getToolName(toolId)}</div>
                    <div class="upgrade-desc">Nível ${level}/5</div>
                    <div class="upgrade-level">
                        <span>Eficiência: +${efficiency.repairAmount}%</span>
                        <span>Custo: R$ ${efficiency.cost}</span>
                    </div>
                    <div class="upgrade-price">Preço: R$ ${price}</div>
                    <button class="upgrade-btn" onclick="window.upgradeTool('${toolId}')">
                        🔧 Upgradar
                    </button>
                `;
                
                toolDiv.appendChild(item);
            }
        });

        // Atualizar garagem
        const garageDiv = this.panel.querySelector('#garage-upgrades');
        garageDiv.innerHTML = '';
        
        Object.entries(stats.garageUpgrades).forEach(([upgradeId, upgrade]) => {
            if (upgrade.level < upgrade.maxLevel) {
                const price = this.manager.upgradePrices.garage[upgrade.level - 1];
                
                const item = document.createElement('div');
                item.className = 'upgrade-item';
                item.innerHTML = `
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">Nível ${upgrade.level}/${upgrade.maxLevel}</div>
                    <div class="upgrade-level">
                        <div class="level-bar">
                            <div class="level-progress" style="width: ${(upgrade.level/upgrade.maxLevel)*100}%"></div>
                        </div>
                    </div>
                    <div class="upgrade-price">Preço: R$ ${price}</div>
                    <button class="upgrade-btn" onclick="window.upgradeGarage('${upgradeId}')">
                        🏢 Upgradar
                    </button>
                `;
                
                garageDiv.appendChild(item);
            }
        });
    }

    getToolName(toolId) {
        const names = {
            wrench: 'Chave Inglesa',
            screwdriver: 'Chave de Fenda',
            hammer: 'Martelo',
            welder: 'Maçarico',
            diagnostic: 'Diagnóstico'
        };
        return names[toolId] || toolId;
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.UpgradePanel = UpgradePanel;
}