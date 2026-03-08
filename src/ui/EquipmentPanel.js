// src/ui/EquipmentPanel.js - Painel de equipamentos da garagem

import { GarageEquipment, EquipmentCategories, getEquipmentByCategory, getUnlockedEquipment } from '/src/garage/GarageEquipment.js';

export class EquipmentPanel {
    constructor(equipmentSystem, garageExpansion) {
        this.equipmentSystem = equipmentSystem;
        this.garage = garageExpansion;
        this.isVisible = false;
        this.currentCategory = 'all';
        this.createPanel();
        this.setupEventListeners();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'equipment-panel';
        this.panel.className = 'equipment-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="equipment-header">
                <h2>🔧 EQUIPAMENTOS DA GARAGEM</h2>
                <div class="header-stats">
                    <span class="money">💰 R$ <span id="equipment-money">0</span></span>
                    <button class="close-btn">×</button>
                </div>
            </div>
            
            <div class="equipment-categories">
                <button class="category-btn active" data-category="all">Todos</button>
                ${Object.entries(EquipmentCategories).map(([key, cat]) => `
                    <button class="category-btn" data-category="${key}" style="color: ${cat.color}">
                        ${cat.icon} ${cat.name}
                    </button>
                `).join('')}
            </div>
            
            <div class="equipment-grid" id="equipment-grid">
                <!-- Equipamentos serão inseridos aqui -->
            </div>
            
            <div class="equipment-stats">
                <div class="stat-item">
                    <span class="stat-label">Equipamentos:</span>
                    <span class="stat-value" id="equipment-count">0/${Object.keys(GarageEquipment).length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Nível da Garagem:</span>
                    <span class="stat-value" id="garage-level">1</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .equipment-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 900px;
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
            
            .equipment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .equipment-header h2 {
                margin: 0;
                color: #ff6b00;
                font-size: 18px;
            }
            
            .equipment-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding: 15px 20px;
                background: #222;
                border-bottom: 1px solid #444;
            }
            
            .category-btn {
                padding: 6px 12px;
                background: #333;
                color: white;
                border: none;
                border-radius: 15px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.3s;
            }
            
            .category-btn:hover {
                background: #444;
                transform: scale(1.05);
            }
            
            .category-btn.active {
                background: #ff6b00;
                color: white !important;
            }
            
            .equipment-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .equipment-card {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #444;
                transition: all 0.3s;
                cursor: pointer;
                position: relative;
            }
            
            .equipment-card:hover {
                transform: translateY(-2px);
                border-color: #ff6b00;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            
            .equipment-card.locked {
                opacity: 0.5;
                filter: grayscale(0.8);
            }
            
            .equipment-card.locked:hover {
                border-color: #ff0000;
            }
            
            .equipment-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            .equipment-name {
                font-size: 16px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .equipment-desc {
                font-size: 12px;
                color: #888;
                margin-bottom: 10px;
            }
            
            .equipment-level {
                display: inline-block;
                padding: 2px 8px;
                background: #333;
                border-radius: 10px;
                font-size: 10px;
                margin-bottom: 10px;
            }
            
            .equipment-price {
                font-size: 14px;
                color: #ffd700;
                font-weight: bold;
                margin: 5px 0;
            }
            
            .equipment-category {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 18px;
            }
            
            .equipment-stats {
                display: flex;
                justify-content: space-between;
                padding: 15px 20px;
                background: #1a1a1a;
                border-top: 1px solid #444;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .stat-label {
                color: #888;
                font-size: 12px;
            }
            
            .stat-value {
                color: #ffd700;
                font-weight: bold;
            }
            
            .use-btn {
                width: 100%;
                padding: 8px;
                margin-top: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .use-btn:hover:not(:disabled) {
                background: #45a049;
            }
            
            .use-btn:disabled {
                background: #666;
                cursor: not-allowed;
            }
            
            .lock-icon {
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 16px;
                color: #ff0000;
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Fechar
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());

        // Categorias
        this.panel.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.panel.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.update();
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
        const moneyEl = this.panel.querySelector('#equipment-money');
        if (moneyEl && window.gameState) {
            moneyEl.textContent = window.gameState.money;
        }

        // Atualizar contagem
        const countEl = this.panel.querySelector('#equipment-count');
        if (countEl) {
            const unlocked = getUnlockedEquipment(this.garage.level).length;
            const total = Object.keys(GarageEquipment).length;
            countEl.textContent = `${unlocked}/${total}`;
        }

        // Atualizar nível da garagem
        const levelEl = this.panel.querySelector('#garage-level');
        if (levelEl) {
            levelEl.textContent = this.garage.level;
        }

        // Atualizar grid
        this.updateGrid();
    }

    updateGrid() {
        const grid = this.panel.querySelector('#equipment-grid');
        grid.innerHTML = '';

        let equipmentList = this.currentCategory === 'all' 
            ? Object.values(GarageEquipment)
            : getEquipmentByCategory(this.currentCategory);

        equipmentList.forEach(eq => {
            const isUnlocked = this.garage.level >= eq.unlockLevel;
            const canAfford = window.gameState && window.gameState.money >= eq.price;

            const card = document.createElement('div');
            card.className = `equipment-card ${!isUnlocked ? 'locked' : ''}`;

            card.innerHTML = `
                <div class="equipment-category">${EquipmentCategories[eq.category]?.icon || '🔧'}</div>
                <div class="equipment-icon">${eq.icon}</div>
                <div class="equipment-name">${eq.name}</div>
                <div class="equipment-desc">${eq.description}</div>
                <div class="equipment-level">Nível ${eq.unlockLevel}+</div>
                <div class="equipment-price">💰 R$ ${eq.price}</div>
                <button class="use-btn" data-id="${eq.id}" ${!isUnlocked || !canAfford ? 'disabled' : ''}>
                    ${isUnlocked ? 'Usar' : '🔒 Bloqueado'}
                </button>
                ${!isUnlocked ? '<span class="lock-icon">🔒</span>' : ''}
            `;

            const btn = card.querySelector('.use-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useEquipment(eq.id);
            });

            grid.appendChild(card);
        });
    }

    useEquipment(equipmentId) {
        const result = this.equipmentSystem.interactWithEquipment(equipmentId);
        
        if (result.success) {
            window.uiManager.showNotification(result.message, 'success');
            this.update();
        } else {
            window.uiManager.showNotification(result.message, 'error');
        }
    }
}