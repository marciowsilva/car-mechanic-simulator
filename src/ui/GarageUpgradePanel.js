// src/ui/GarageUpgradePanel.js - Painel de upgrade da garagem

export class GarageUpgradePanel {
    constructor(garageManager) {
        this.garageManager = garageManager;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'garage-upgrade-panel';
        this.panel.className = 'garage-upgrade-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="upgrade-header">
                <h2>🏢 EXPANDIR GARAGEM</h2>
                <button class="close-btn">×</button>
            </div>
            
            <div class="current-level">
                <h3>Nível Atual: <span id="current-level">1</span>/5</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="level-progress" style="width: 20%"></div>
                </div>
            </div>
            
            <div class="benefits-panel">
                <h3>⚡ BENEFÍCIOS ATUAIS</h3>
                <div id="current-benefits" class="benefits-list"></div>
            </div>
            
            <div class="next-upgrade" id="next-upgrade">
                <!-- Próximo upgrade será mostrado aqui -->
            </div>
            
            <div class="upgrade-actions">
                <button class="upgrade-btn" id="do-upgrade">⬆️ EXPANDIR GARAGEM</button>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
        this.initEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .garage-upgrade-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 450px;
                background: rgba(30, 30, 30, 0.98);
                border: 2px solid #ff6b00;
                border-radius: 15px;
                color: white;
                z-index: 1000;
                padding: 25px;
                backdrop-filter: blur(5px);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #ff6b00;
                padding-bottom: 10px;
            }
            
            .upgrade-header h2 {
                color: #ff6b00;
                margin: 0;
                font-size: 20px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .close-btn:hover {
                color: #ff6b00;
            }
            
            .current-level {
                margin-bottom: 20px;
                background: #222;
                padding: 15px;
                border-radius: 8px;
            }
            
            .current-level h3 {
                margin: 0 0 10px 0;
                color: #ffd700;
            }
            
            .progress-bar {
                height: 8px;
                background: #333;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #ff6b00;
                transition: width 0.3s;
            }
            
            .benefits-panel {
                background: #222;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .benefits-panel h3 {
                color: #4CAF50;
                margin: 0 0 10px 0;
            }
            
            .benefits-list {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .benefit-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px;
                background: #333;
                border-radius: 5px;
            }
            
            .benefit-icon {
                font-size: 16px;
            }
            
            .benefit-name {
                flex: 1;
                font-size: 12px;
            }
            
            .benefit-value {
                color: #ffd700;
                font-weight: bold;
            }
            
            .next-upgrade {
                background: #222;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #ff6b00;
            }
            
            .next-upgrade h3 {
                color: #ff6b00;
                margin: 0 0 10px 0;
            }
            
            .next-desc {
                color: #888;
                margin: 10px 0;
            }
            
            .next-price {
                color: #ffd700;
                font-size: 18px;
                font-weight: bold;
                text-align: right;
            }
            
            .next-benefits {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #444;
            }
            
            .next-benefit {
                color: #4CAF50;
                font-size: 12px;
                margin: 3px 0;
            }
            
            .upgrade-btn {
                width: 100%;
                padding: 15px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .upgrade-btn:hover:not(:disabled) {
                background: #45a049;
                transform: scale(1.02);
            }
            
            .upgrade-btn:disabled {
                background: #666;
                cursor: not-allowed;
            }
        `;
        
        document.head.appendChild(style);
    }

    initEventListeners() {
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());
        
        this.panel.querySelector('#do-upgrade').addEventListener('click', () => {
            const result = this.garageManager.upgrade();
            
            if (result.success) {
                window.uiManager?.showNotification(result.message, 'success');
                window.uiManager?.updateMoney();
                this.update();
            } else {
                window.uiManager?.showNotification(result.message, 'error');
            }
        });

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
        const stats = this.garageManager.getStats();
        const next = stats.nextUpgrade;
        const benefits = stats.benefits;
        
        // Atualizar nível
        document.getElementById('current-level').textContent = stats.level;
        document.getElementById('level-progress').style.width = 
            `${(stats.level / stats.maxLevel) * 100}%`;
        
        // Atualizar benefícios atuais
        this.updateBenefits(benefits);
        
        // Atualizar próximo upgrade
        if (next) {
            const canUpgrade = this.garageManager.canUpgrade();
            const moneyNeeded = next.price - (window.gameState?.money || 0);
            
            document.getElementById('next-upgrade').innerHTML = `
                <h3>🔮 PRÓXIMO NÍVEL</h3>
                <div class="next-desc">${next.description}</div>
                <div class="next-price">💰 R$ ${next.price}</div>
                <div class="next-benefits">
                    <div class="next-benefit">✨ +${next.benefits.lifts - benefits.lifts} elevador(es)</div>
                    ${next.benefits.tireMachine && !benefits.tireMachine ? 
                        '<div class="next-benefit">🔧 + Máquina de pneus</div>' : ''}
                    ${next.benefits.computer && !benefits.computer ? 
                        '<div class="next-benefit">💻 + Computador</div>' : ''}
                    ${next.benefits.storage && !benefits.storage ? 
                        '<div class="next-benefit">📦 + Estante de peças</div>' : ''}
                    ${next.benefits.paintBooth && !benefits.paintBooth ? 
                        '<div class="next-benefit">🎨 + Oficina de pintura</div>' : ''}
                    ${next.benefits.engineCrane && !benefits.engineCrane ? 
                        '<div class="next-benefit">🏗️ + Guincho de motor</div>' : ''}
                </div>
                ${!canUpgrade ? `<div class="next-benefit" style="color: #ff6b00;">
                    💰 Faltam R$ ${moneyNeeded}</div>` : ''}
            `;
            
            document.getElementById('do-upgrade').disabled = !canUpgrade;
        } else {
            document.getElementById('next-upgrade').innerHTML = `
                <h3>✨ NÍVEL MÁXIMO</h3>
                <p>Parabéns! Sua garagem está completa!</p>
                <p style="color: #ffd700;">🏆 Mecânico Lendário</p>
            `;
            document.getElementById('do-upgrade').disabled = true;
        }
    }

    updateBenefits(benefits) {
        const list = document.getElementById('current-benefits');
        
        list.innerHTML = `
            <div class="benefit-item">
                <span class="benefit-icon">⬆️</span>
                <span class="benefit-name">Elevadores</span>
                <span class="benefit-value">${benefits.lifts}/4</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">🔧</span>
                <span class="benefit-name">Bancadas</span>
                <span class="benefit-value">${benefits.workbenches}/4</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">📦</span>
                <span class="benefit-name">Armários</span>
                <span class="benefit-value">${benefits.cabinets}/4</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">⚙️</span>
                <span class="benefit-name">Máq. Pneus</span>
                <span class="benefit-value">${benefits.tireMachine ? '✅' : '❌'}</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">💻</span>
                <span class="benefit-name">Computador</span>
                <span class="benefit-value">${benefits.computer ? '✅' : '❌'}</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">📚</span>
                <span class="benefit-name">Estante</span>
                <span class="benefit-value">${benefits.storage ? '✅' : '❌'}</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">🎨</span>
                <span class="benefit-name">Pintura</span>
                <span class="benefit-value">${benefits.paintBooth ? '✅' : '❌'}</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">🏗️</span>
                <span class="benefit-name">Guincho</span>
                <span class="benefit-value">${benefits.engineCrane ? '✅' : '❌'}</span>
            </div>
        `;
    }
}