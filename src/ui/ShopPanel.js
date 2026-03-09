// src/ui/ShopPanel.js - Painel da loja de peças (CORRIGIDO)

export class ShopPanel {
    constructor(economySystem) {
        this.economy = economySystem;
        this.isVisible = false;
        this.selectedRarity = 'comum';
        this.selectedPart = null;
        this.quantity = 1;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'shop-panel';
        this.panel.className = 'shop-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="shop-header">
                <h2>🛒 LOJA DE PEÇAS</h2>
                <div class="header-stats">
                    <span class="money">💰 R$ <span id="shop-money">0</span></span>
                    <button class="close-btn">×</button>
                </div>
            </div>
            
            <div class="shop-tabs">
                <button class="tab-btn active" data-tab="buy">🛒 Comprar</button>
                <button class="tab-btn" data-tab="sell">💰 Vender</button>
                <button class="tab-btn" data-tab="specials">✨ Ofertas</button>
            </div>
            
            <div class="tab-content active" id="buy-tab">
                <div class="shop-filters">
                    <select id="part-type-filter">
                        <option value="">Todas as peças</option>
                        <option value="motor">Motor</option>
                        <option value="transmissao">Transmissão</option>
                        <option value="freios">Freios</option>
                        <option value="suspensao">Suspensão</option>
                        <option value="bateria">Bateria</option>
                        <option value="alternador">Alternador</option>
                        <option value="radiador">Radiador</option>
                        <option value="escapamento">Escapamento</option>
                    </select>
                    
                    <select id="rarity-filter">
                        <option value="comum">Comum</option>
                        <option value="incomum">Incomum</option>
                        <option value="raro">Raro</option>
                        <option value="epico">Épico</option>
                        <option value="lendario">Lendário</option>
                    </select>
                </div>
                
                <div class="quantity-selector">
                    <button class="qty-btn" id="qty-minus">-</button>
                    <span id="quantity">1</span>
                    <button class="qty-btn" id="qty-plus">+</button>
                </div>
                
                <div class="parts-grid" id="buy-parts-grid">
                    <!-- Peças serão inseridas aqui -->
                </div>
            </div>
            
            <div class="tab-content" id="sell-tab">
                <div class="inventory-list" id="inventory-list">
                    <!-- Inventário será inserido aqui -->
                </div>
            </div>
            
            <div class="tab-content" id="specials-tab">
                <div class="specials-grid" id="specials-grid">
                    <!-- Ofertas serão inseridas aqui -->
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
            .shop-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
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
            
            .shop-panel.show {
                display: block;
            }
            
            .shop-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .shop-header h2 {
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
            
            .shop-tabs {
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
            
            .shop-filters {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .shop-filters select {
                flex: 1;
                padding: 8px;
                background: #333;
                color: white;
                border: 1px solid #444;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .shop-filters select:hover {
                border-color: #ff6b00;
            }
            
            .quantity-selector {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .qty-btn {
                width: 30px;
                height: 30px;
                background: #ff6b00;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .qty-btn:hover {
                background: #ff8c00;
                transform: scale(1.1);
            }
            
            .qty-btn:disabled {
                background: #666;
                cursor: not-allowed;
                transform: none;
            }
            
            #quantity {
                font-size: 18px;
                font-weight: bold;
                color: #ffd700;
                min-width: 30px;
                text-align: center;
            }
            
            .parts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .part-card {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #444;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .part-card:hover {
                border-color: #ff6b00;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            
            .part-card.selected {
                border: 2px solid #ff6b00;
                background: #333;
            }
            
            .part-name {
                font-size: 16px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .part-rarity {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                display: inline-block;
                margin-bottom: 8px;
            }
            
            .rarity-comum { background: #666; color: white; }
            .rarity-incomum { background: #2196F3; color: white; }
            .rarity-raro { background: #9C27B0; color: white; }
            .rarity-epico { background: #FF9800; color: black; }
            .rarity-lendario { background: #FFD700; color: black; }
            
            .part-price {
                font-size: 18px;
                color: #ffd700;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .buy-btn {
                width: 100%;
                padding: 8px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .buy-btn:hover:not(:disabled) {
                background: #45a049;
                transform: scale(1.02);
            }
            
            .buy-btn:disabled {
                background: #666;
                cursor: not-allowed;
                opacity: 0.5;
            }
            
            .inventory-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .special-card {
                background: linear-gradient(145deg, #2a2a2a, #332211);
                border: 2px solid gold;
                padding: 15px;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }
            
            .special-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(255,215,0,0.3);
            }
            
            .special-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: gold;
                color: black;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .discount-badge {
                display: inline-block;
                background: #ff0000;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                margin-left: 5px;
            }
            
            .specials-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
                color: #666;
                font-style: italic;
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
        
        // Abas
        const tabBtns = this.panel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover active de todas as abas
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tabId = btn.dataset.tab;
                
                // Esconder todos os conteúdos
                const tabContents = this.panel.querySelectorAll('.tab-content');
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Mostrar o conteúdo selecionado
                const selectedTab = this.panel.querySelector(`#${tabId}-tab`);
                if (selectedTab) {
                    selectedTab.classList.add('active');
                    
                    // Atualizar o conteúdo da aba
                    if (tabId === 'buy') this.updateBuyTab();
                    if (tabId === 'sell') this.updateSellTab();
                    if (tabId === 'specials') this.updateSpecialsTab();
                }
            });
        });
        
        // Quantidade
        const qtyMinus = this.panel.querySelector('#qty-minus');
        const qtyPlus = this.panel.querySelector('#qty-plus');
        const qtySpan = this.panel.querySelector('#quantity');
        
        if (qtyMinus) {
            qtyMinus.addEventListener('click', () => {
                if (this.quantity > 1) {
                    this.quantity--;
                    if (qtySpan) qtySpan.textContent = this.quantity;
                    this.updateBuyTab();
                }
            });
        }
        
        if (qtyPlus) {
            qtyPlus.addEventListener('click', () => {
                if (this.quantity < 10) {
                    this.quantity++;
                    if (qtySpan) qtySpan.textContent = this.quantity;
                    this.updateBuyTab();
                }
            });
        }
        
        // Filtros
        const partFilter = this.panel.querySelector('#part-type-filter');
        const rarityFilter = this.panel.querySelector('#rarity-filter');
        
        if (partFilter) {
            partFilter.addEventListener('change', () => this.updateBuyTab());
        }
        
        if (rarityFilter) {
            rarityFilter.addEventListener('change', () => this.updateBuyTab());
        }
        
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
        const moneyEl = this.panel.querySelector('#shop-money');
        if (moneyEl && window.gameState) {
            moneyEl.textContent = window.gameState.money;
        }
        
        // Atualizar aba ativa
        const activeTab = this.panel.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabId = activeTab.dataset.tab;
            if (tabId === 'buy') this.updateBuyTab();
            if (tabId === 'sell') this.updateSellTab();
            if (tabId === 'specials') this.updateSpecialsTab();
        }
    }

    updateBuyTab() {
        const partFilter = this.panel.querySelector('#part-type-filter');
        const rarityFilter = this.panel.querySelector('#rarity-filter');
        const grid = this.panel.querySelector('#buy-parts-grid');
        
        if (!partFilter || !rarityFilter || !grid) return;
        
        const partType = partFilter.value;
        const rarity = rarityFilter.value;
        
        grid.innerHTML = '';
        
        const partTypes = partType ? [partType] : Object.keys(this.economy.basePrices);
        
        partTypes.forEach(type => {
            const price = this.economy.calculatePartPrice(type, rarity, this.quantity);
            const canBuy = window.gameState && window.gameState.money >= price;
            
            const card = document.createElement('div');
            card.className = `part-card ${this.selectedPart === type ? 'selected' : ''}`;
            
            card.addEventListener('click', () => {
                this.selectedPart = type;
                this.updateBuyTab();
            });
            
            card.innerHTML = `
                <div class="part-name">${this.economy.getPartDisplayName(type)}</div>
                <div class="part-rarity rarity-${rarity}">${rarity.toUpperCase()}</div>
                <div class="part-price">R$ ${price}</div>
                <button class="buy-btn" data-part="${type}" data-quantity="${this.quantity}" data-rarity="${rarity}">
                    Comprar ${this.quantity}x
                </button>
            `;
            
            // Adicionar evento ao botão de compra
            const buyBtn = card.querySelector('.buy-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const part = e.target.dataset.part;
                    const qty = parseInt(e.target.dataset.quantity);
                    const rar = e.target.dataset.rarity;
                    
                    if (window.buyPart) {
                        window.buyPart(part, qty, rar);
                    }
                });
            }
            
            grid.appendChild(card);
        });
    }

    updateSellTab() {
        const grid = this.panel.querySelector('#inventory-list');
        if (!grid) return;
        
        if (!window.inventory) {
            grid.innerHTML = '<div class="empty-state">📦 Inventário não disponível</div>';
            return;
        }
        
        const inventory = window.inventory;
        
        grid.innerHTML = '';
        
        Object.entries(inventory.parts || {}).forEach(([partType, quantity]) => {
            if (quantity > 0) {
                const card = document.createElement('div');
                card.className = 'part-card';
                
                card.innerHTML = `
                    <div class="part-name">${this.economy.getPartDisplayName(partType)}</div>
                    <div class="part-price">Quantidade: ${quantity}</div>
                    <button class="buy-btn" data-part="${partType}">
                        Vender (R$ ${Math.floor(this.economy.basePrices[partType] * 0.3)})
                    </button>
                `;
                
                const sellBtn = card.querySelector('.buy-btn');
                if (sellBtn) {
                    sellBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const part = e.target.dataset.part;
                        if (window.sellPart) {
                            window.sellPart(part);
                        }
                    });
                }
                
                grid.appendChild(card);
            }
        });
        
        if (grid.children.length === 0) {
            grid.innerHTML = '<div class="empty-state">📦 Nenhuma peça no inventário</div>';
        }
    }

    updateSpecialsTab() {
        const grid = this.panel.querySelector('#specials-grid');
        if (!grid) return;
        
        const specials = this.economy.getActiveSpecials();
        
        grid.innerHTML = '';
        
        specials.forEach(special => {
            const canBuy = window.gameState && window.gameState.money >= special.price;
            
            const card = document.createElement('div');
            card.className = 'special-card';
            
            card.innerHTML = `
                <div class="special-badge">✨ OFERTA</div>
                <div class="part-name">${special.partName}</div>
                <div class="part-rarity rarity-${special.rarity}">${special.rarity.toUpperCase()}</div>
                <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <span style="text-decoration: line-through; color: #888;">R$ ${special.originalPrice}</span>
                    <span class="discount-badge">-${special.discount}%</span>
                </div>
                <div class="part-price">R$ ${special.price}</div>
                <button class="buy-btn" data-special="${special.id}">
                    Comprar Oferta
                </button>
            `;
            
            const buyBtn = card.querySelector('.buy-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const specialId = e.target.dataset.special;
                    if (window.buySpecial) {
                        window.buySpecial(specialId);
                    } else {
                        window.uiManager?.showNotification('🔧 Funcionalidade em desenvolvimento', 'info');
                    }
                });
            }
            
            grid.appendChild(card);
        });
        
        if (grid.children.length === 0) {
            grid.innerHTML = '<div class="empty-state">✨ Nenhuma oferta ativa no momento</div>';
        }
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.ShopPanel = ShopPanel;
}