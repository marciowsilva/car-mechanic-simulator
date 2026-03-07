// src/ui/GaragePanel.js - Painel de gerenciamento da garagem

export class GaragePanel {
    constructor(garageExpansion) {
        this.garage = garageExpansion;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'garage-panel';
        this.panel.className = 'garage-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="garage-header">
                <h2>🏢 GARAGEM</h2>
                <div class="header-stats">
                    <span class="money">💰 R$ <span id="garage-money">0</span></span>
                    <button class="close-btn">×</button>
                </div>
            </div>
            
            <div class="garage-level-display">
                <div class="level-icon" id="garage-level-icon">🏚️</div>
                <div class="level-info">
                    <div class="level-name" id="garage-level-name">Garagem Simples</div>
                    <div class="level-desc" id="garage-level-desc">Nível 1/5</div>
                    <div class="level-progress">
                        <div class="progress-bar" id="garage-progress" style="width: 20%"></div>
                    </div>
                </div>
            </div>
            
            <div class="garage-benefits">
                <div class="benefit-item">
                    <span class="benefit-icon">⬆️</span>
                    <span class="benefit-label">Elevadores:</span>
                    <span class="benefit-value" id="garage-lifts">1</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">🔧</span>
                    <span class="benefit-label">Bancadas:</span>
                    <span class="benefit-value" id="garage-benches">1</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">📦</span>
                    <span class="benefit-label">Estoque:</span>
                    <span class="benefit-value" id="garage-storage">50</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">⚡</span>
                    <span class="benefit-label">Velocidade:</span>
                    <span class="benefit-value" id="garage-speed">+10%</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">💰</span>
                    <span class="benefit-label">Desconto:</span>
                    <span class="benefit-value" id="garage-discount">2%</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">⭐</span>
                    <span class="benefit-label">XP Bônus:</span>
                    <span class="benefit-value" id="garage-xp">+5%</span>
                </div>
            </div>
            
            <div class="garage-actions">
                <button class="action-btn expand-btn" id="expand-garage">
                    <span class="btn-icon">⬆️</span>
                    <span class="btn-text">Expandir Garagem</span>
                    <span class="btn-price" id="expand-price">R$ 10.000</span>
                </button>
            </div>
            
            <div class="garage-decorations">
                <h3>✨ Decorações</h3>
                <div class="decoration-slots" id="decoration-slots">
                    <!-- Slots serão inseridos aqui -->
                </div>
                <div class="decoration-shop">
                    <button class="decoration-btn" data-type="1">
                        <span class="decoration-icon">🖼️</span>
                        <span>Poster (R$ 1.000)</span>
                    </button>
                    <button class="decoration-btn" data-type="2">
                        <span class="decoration-icon">🌿</span>
                        <span>Planta (R$ 2.000)</span>
                    </button>
                    <button class="decoration-btn" data-type="3">
                        <span class="decoration-icon">🏆</span>
                        <span>Troféu (R$ 3.000)</span>
                    </button>
                    <button class="decoration-btn" data-type="4">
                        <span class="decoration-icon">💡</span>
                        <span>Letreiro (R$ 4.000)</span>
                    </button>
                </div>
            </div>
            
            <div class="garage-next" id="garage-next">
                <h3>🔮 Próximo Nível</h3>
                <div class="next-info">
                    <span class="next-name" id="next-name">Garagem Ampliada</span>
                    <span class="next-price" id="next-price">R$ 10.000</span>
                </div>
                <div class="next-benefits" id="next-benefits">
                    +1 elevador, +1 bancada, +50 estoque
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
        this.initEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .garage-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                max-width: 90%;
                max-height: 80vh;
                background: rgba(30, 30, 30, 0.98);
                border: 2px solid #ff6b00;
                border-radius: 15px;
                color: white;
                z-index: 1000;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            
            .garage-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .garage-header h2 {
                margin: 0;
                color: #ff6b00;
            }
            
            .garage-level-display {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 20px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
            }
            
            .level-icon {
                font-size: 48px;
                width: 80px;
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #333;
                border-radius: 10px;
            }
            
            .level-info {
                flex: 1;
            }
            
            .level-name {
                font-size: 18px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .level-desc {
                font-size: 12px;
                color: #888;
                margin-bottom: 10px;
            }
            
            .level-progress {
                height: 6px;
                background: #444;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .level-progress .progress-bar {
                height: 100%;
                background: #ff6b00;
                transition: width 0.3s;
            }
            
            .garage-benefits {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 15px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
            }
            
            .benefit-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: #333;
                border-radius: 5px;
            }
            
            .benefit-icon {
                font-size: 16px;
            }
            
            .benefit-label {
                font-size: 12px;
                color: #888;
                flex: 1;
            }
            
            .benefit-value {
                font-size: 14px;
                font-weight: bold;
                color: #ffd700;
            }
            
            .garage-actions {
                padding: 15px;
                border-bottom: 1px solid #444;
            }
            
            .expand-btn {
                width: 100%;
                padding: 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s;
            }
            
            .expand-btn:hover:not(:disabled) {
                background: #45a049;
                transform: scale(1.02);
            }
            
            .expand-btn:disabled {
                background: #666;
                cursor: not-allowed;
                opacity: 0.5;
            }
            
            .btn-price {
                color: #ffd700;
                font-size: 14px;
            }
            
            .garage-decorations {
                padding: 15px;
                border-bottom: 1px solid #444;
            }
            
            .garage-decorations h3 {
                color: #ff6b00;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .decoration-slots {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .decoration-slot {
                aspect-ratio: 1;
                background: #333;
                border: 1px solid #444;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .decoration-slot:hover {
                border-color: #ff6b00;
                background: #3a3a3a;
            }
            
            .decoration-slot.filled {
                background: #4a4a4a;
                border-color: #ffd700;
            }
            
            .decoration-shop {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .decoration-btn {
                padding: 8px;
                background: #333;
                color: white;
                border: 1px solid #444;
                border-radius: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .decoration-btn:hover:not(:disabled) {
                border-color: #ff6b00;
                background: #3a3a3a;
            }
            
            .decoration-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .garage-next {
                padding: 15px;
                background: #2a2a2a;
            }
            
            .garage-next h3 {
                color: #ff6b00;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .next-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .next-name {
                font-weight: bold;
                color: #ffd700;
            }
            
            .next-price {
                color: #4CAF50;
            }
            
            .next-benefits {
                font-size: 12px;
                color: #888;
            }
        `;
        
        document.head.appendChild(style);
    }

    initEventListeners() {
        // Fechar
        const closeBtn = this.panel.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Expandir garagem
        const expandBtn = this.panel.querySelector('#expand-garage');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                const result = this.garage.expand();
                if (result.success) {
                    window.uiManager.showNotification(result.message, 'success');
                    window.uiManager.updateMoney();
                    this.update();
                    
                    if (window.scene3D && window.scene3D.updateGarage) {
                        window.scene3D.updateGarage(this.garage.level);
                    }
                } else {
                    window.uiManager.showNotification(result.message, 'error');
                }
            });
        }

        // Botões de decoração
        this.panel.querySelectorAll('.decoration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = parseInt(e.currentTarget.dataset.type);
                this.addDecoration(type);
            });
        });

        // ESC
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
        const moneyEl = this.panel.querySelector('#garage-money');
        if (moneyEl && window.gameState) {
            moneyEl.textContent = window.gameState.money;
        }

        const stats = this.garage.getStats();
        const benefits = stats.benefits;

        // Informações do nível
        this.panel.querySelector('#garage-level-icon').textContent = stats.currentImage;
        this.panel.querySelector('#garage-level-name').textContent = stats.currentName;
        this.panel.querySelector('#garage-level-desc').textContent = `Nível ${stats.level}/${stats.maxLevel}`;
        this.panel.querySelector('#garage-progress').style.width = `${stats.progress}%`;

        // Benefícios
        this.panel.querySelector('#garage-lifts').textContent = benefits.lifts;
        this.panel.querySelector('#garage-benches').textContent = benefits.workbenches;
        this.panel.querySelector('#garage-storage').textContent = benefits.storage;
        this.panel.querySelector('#garage-speed').textContent = `+${benefits.repairSpeedBonus}%`;
        this.panel.querySelector('#garage-discount').textContent = `${benefits.partDiscount}%`;
        this.panel.querySelector('#garage-xp').textContent = `+${benefits.experienceBonus}%`;

        // Próximo nível
        if (stats.nextLevel) {
            this.panel.querySelector('#next-name').textContent = stats.nextLevel.name;
            this.panel.querySelector('#next-price').textContent = `R$ ${stats.nextLevel.price}`;
            this.panel.querySelector('#next-benefits').textContent = 
                `+1 elevador, +1 bancada, +50 estoque`;
            this.panel.querySelector('#expand-price').textContent = `R$ ${stats.nextLevel.price}`;
            this.panel.querySelector('#expand-garage').disabled = false;
        } else {
            this.panel.querySelector('#next-name').textContent = 'Nível máximo!';
            this.panel.querySelector('#next-price').textContent = '---';
            this.panel.querySelector('#next-benefits').textContent = 'Parabéns!';
            this.panel.querySelector('#expand-price').textContent = 'MÁXIMO';
            this.panel.querySelector('#expand-garage').disabled = true;
        }

        // Atualizar slots de decoração
        this.updateDecorationSlots();
    }

    updateDecorationSlots() {
        const slotsContainer = this.panel.querySelector('#decoration-slots');
        const stats = this.garage.getStats();
        
        slotsContainer.innerHTML = '';
        
        for (let i = 0; i < stats.decorationSlotsTotal; i++) {
            const slot = document.createElement('div');
            slot.className = 'decoration-slot';
            
            if (i < stats.decorations.length) {
                const decoration = stats.decorations[i];
                slot.classList.add('filled');
                
                // Ícone baseado no tipo
                const icons = ['🖼️', '🌿', '🏆', '💡'];
                slot.textContent = icons[decoration.type - 1] || '✨';
                
                slot.addEventListener('click', () => {
                    if (confirm('Remover esta decoração?')) {
                        const result = this.garage.removeDecoration(i);
                        if (result.success) {
                            window.uiManager.showNotification(result.message, 'info');
                            this.update();
                        }
                    }
                });
            } else {
                slot.textContent = '➕';
            }
            
            slotsContainer.appendChild(slot);
        }
    }

    addDecoration(type) {
        if (this.garage.level < 2) {
            window.uiManager.showNotification('❌ Expanda a garagem primeiro!', 'error');
            return;
        }

        // Posição aleatória (simplificado)
        const position = {
            x: Math.random() * 10 - 5,
            y: 1,
            z: Math.random() * 10 - 5
        };

        const result = this.garage.addDecoration(type, position);
        
        if (result.success) {
            window.uiManager.showNotification(result.message, 'success');
            window.uiManager.updateMoney();
            this.update();
            
            // Atualizar cena 3D
            if (window.scene3D && window.scene3D.addDecoration) {
                window.scene3D.addDecoration(type, position);
            }
        } else {
            window.uiManager.showNotification(result.message, 'error');
        }
    }
}