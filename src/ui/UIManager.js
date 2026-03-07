// src/ui/UIManager.js - Versão completa com todos os sistemas integrados

import { UpgradeManager } from '/src/systems/UpgradeManager.js';
import { UpgradePanel } from '/src/ui/UpgradePanel.js';
import { CustomersPanel } from '/src/ui/CustomersPanel.js';

export class UIManager {
    constructor() {
        console.log('🖥️ UIManager profissional inicializando');
        this.elements = {};
        this.notificationTimeout = null;
        this.parts = [];
        this.challengesInterval = null;
        this.marketInterval = null;
        this.tournamentInterval = null;
        
        this.cacheElements();
        this.initEventListeners();
        this.loadSystems();
        this.updateAllDisplays();
        
        setInterval(() => this.updateTimer(), 1000);
    }

    // ===== SISTEMA DE CACHE DE ELEMENTOS =====
    cacheElements() {
        console.log('📦 Cacheando elementos da UI...');
        
        const elementosIds = [
            // Painéis principais
            'game-container', 'ui-overlay', 'top-panel', 'tool-panel',
            'car-parts-panel', 'bottom-panel', 'interaction-info',
            
            // Estatísticas
            'money', 'level', 'reputation', 'jobs-completed',
            
            // Informações de serviço
            'job-info', 'parts-list',
            
            // Botões
            'new-job', 'deliver-car', 'upgrade-shop-btn', 'inventory-btn', 'customers-btn',
            
            // Áudio
            'toggle-music', 'toggle-sfx',
            
            // Notificações
            'notification',
            
            // Loading
            'loading-screen', 'loading-progress'
        ];
        
        elementosIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                this.elements[id] = el;
                console.log(`   ✅ #${id} cacheado`);
            } else {
                console.log(`   ⚠️ #${id} não encontrado (usando fallback)`);
                this.elements[id] = this.createFallbackElement(id);
            }
        });
        
        console.log(`📊 Total de elementos cacheados: ${Object.keys(this.elements).length}`);
    }

    createFallbackElement(id) {
        return {
            id: id,
            style: {},
            classList: { 
                add: () => {}, 
                remove: () => {},
                contains: () => false
            },
            textContent: '',
            innerHTML: '',
            addEventListener: () => {},
            removeEventListener: () => {},
            disabled: false,
            dataset: {}
        };
    }

    getElement(id) {
        return this.elements[id] || this.createFallbackElement(id);
    }

    // ===== CARREGAMENTO DE SISTEMAS =====
    async loadSystems() {
        console.log('🔌 Carregando sistemas...');
        
        try {
            // Carregar UpgradeManager
            const upgradeModule = await import('/src/systems/UpgradeManager.js');
            const UpgradeManager = upgradeModule.UpgradeManager || upgradeModule.default;
            this.upgradeManager = new UpgradeManager();
            console.log('✅ UpgradeManager carregado');
            
            // Criar painel de upgrades
            this.upgradePanel = new UpgradePanel(this.upgradeManager);
            
            // Carregar CustomerSystem
            const customerModule = await import('/src/systems/customers/CustomerSystem.js');
            const CustomerSystem = customerModule.CustomerSystem || customerModule.default;
            this.customerSystem = new CustomerSystem();
            console.log('✅ CustomerSystem carregado');
            
            // Criar painel de clientes
            this.customersPanel = new CustomersPanel(this.customerSystem);
            
            // Carregar Inventory se disponível
            try {
                const inventoryModule = await import('/src/systems/Inventory.js');
                const Inventory = inventoryModule.Inventory || inventoryModule.default;
                this.inventory = new Inventory();
                console.log('✅ Inventory carregado');
            } catch (err) {
                console.log('⚠️ Inventory não disponível:', err);
            }
            
            // Carregar sistemas adicionais
            this.loadAdditionalSystems();
            
        } catch (err) {
            console.error('❌ Erro ao carregar sistemas:', err);
        }
    }

    async loadAdditionalSystems() {
        // Carregar sistemas de forma assíncrona sem travar
        setTimeout(() => {
            import('/src/systems/achievements/AchievementSystem.js').then(module => {
                const AchievementSystem = module.AchievementSystem || module.default;
                this.achievementSystem = new AchievementSystem();
                console.log('✅ AchievementSystem carregado');
            }).catch(() => {});
            
            import('/src/systems/challenges/DailyChallenges.js').then(module => {
                const DailyChallenges = module.DailyChallenges || module.default;
                this.dailyChallenges = new DailyChallenges();
                console.log('✅ DailyChallenges carregado');
            }).catch(() => {});
            
            import('/src/systems/market/used-parts-market.js').then(module => {
                const UsedPartsMarket = module.UsedPartsMarket || module.default;
                this.usedPartsMarket = new UsedPartsMarket();
                console.log('✅ UsedPartsMarket carregado');
            }).catch(() => {});
        }, 1000);
    }

    // ===== INICIALIZAÇÃO DE EVENTOS =====
    initEventListeners() {
        console.log('🔌 Inicializando event listeners...');
        
        // Botão Novo Cliente
        this.getElement('new-job').addEventListener('click', () => {
            this.createNewJob();
        });

        // Botão Entregar Carro
        this.getElement('deliver-car').addEventListener('click', () => {
            this.deliverCar();
        });

        // Botão Upgrades
        this.getElement('upgrade-shop-btn').addEventListener('click', () => {
            if (this.upgradePanel) {
                this.upgradePanel.toggle();
            } else {
                this.showNotification('❌ Sistema de upgrades não disponível', 'error');
            }
        });

        // Botão Clientes
        const customersBtn = this.getElement('customers-btn');
        if (customersBtn) {
            customersBtn.addEventListener('click', () => {
                if (this.customersPanel) {
                    this.customersPanel.toggle();
                } else {
                    this.showNotification('❌ Sistema de clientes não disponível', 'error');
                }
            });
        }

        // Botão Estoque
        this.getElement('inventory-btn').addEventListener('click', () => {
            this.showNotification('📦 Sistema de estoque em desenvolvimento', 'info');
        });

        // Seleção de ferramentas
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('selected'));
                tool.classList.add('selected');
                const toolId = tool.dataset.tool;
                if (window.gameState) {
                    window.gameState.selectedTool = toolId;
                }
                this.showNotification(`🔧 Ferramenta: ${toolId}`, 'info');
            });
        });

        // Controles de áudio
        this.getElement('toggle-music').addEventListener('click', () => {
            console.log('🎵 Música toggled');
        });

        this.getElement('toggle-sfx').addEventListener('click', () => {
            console.log('🔊 SFX toggled');
        });

        // Tecla ESC para fechar painéis
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.upgradePanel?.isVisible) this.upgradePanel.hide();
                if (this.customersPanel?.isVisible) this.customersPanel.hide();
            }
        });
    }

    // ===== GERENCIAMENTO DE JOBS =====
    createNewJob() {
        if (!window.gameState) {
            this.showNotification('❌ Jogo não inicializado', 'error');
            return;
        }

        // Se já existe um job ativo, perguntar se quer substituir
        if (window.gameState.currentJob) {
            if (!confirm('Já existe um serviço ativo. Deseja cancelá-lo e iniciar um novo?')) {
                return;
            }
        }

        // Usar CustomerSystem se disponível
        if (this.customerSystem) {
            const job = this.customerSystem.generateJob();
            if (!job) {
                this.showNotification('❌ Erro ao gerar job', 'error');
                return;
            }
            
            window.gameState.currentJob = job;
            window.gameState.currentCar = { parts: job.parts };
            
            const customer = job.customer;
            const personalityIcon = customer.icon || '👤';
            this.showNotification(`🚗 ${personalityIcon} ${customer.name} - R$ ${job.payment}`, 'success');
        } else {
            // Fallback para job simples
            const job = {
                id: Date.now(),
                customerName: this.generateCustomerName(),
                carModel: this.generateCarModel(),
                difficulty: 'Fácil',
                payment: Math.floor(1000 + Math.random() * 2000),
                parts: this.generateParts()
            };

            window.gameState.currentJob = job;
            window.gameState.currentCar = { parts: job.parts };
            this.showNotification(`🚗 Novo cliente: ${job.customerName}`, 'success');
        }

        this.updateJobInfo();
        this.updatePartsList();
        this.getElement('deliver-car').disabled = false;
    }

    deliverCar() {
        if (!window.gameState?.currentJob) {
            this.showNotification('❌ Nenhum serviço ativo', 'error');
            return;
        }

        // Usar CustomerSystem se disponível
        if (this.customerSystem && this.customerSystem.currentJob) {
            // Calcular qualidade baseada nas condições das peças
            const parts = window.gameState.currentCar.parts;
            let totalCondition = 0;
            let count = 0;
            
            Object.values(parts).forEach(part => {
                totalCondition += part.condition || 0;
                count++;
            });
            
            const quality = count > 0 ? totalCondition / count : 0;
            const result = this.customerSystem.completeJob(quality);
            
            if (result) {
                window.gameState.money += result.payment;
                window.gameState.jobsCompleted++;
                
                const bonusText = result.timeBonus > 0 ? ` (bônus R$ ${result.timeBonus})` : '';
                this.showNotification(`💰 Serviço concluído! R$ ${result.payment}${bonusText}`, 'success');
                
                if (result.satisfaction >= 80) {
                    this.showNotification(`😊 Cliente satisfeito!`, 'success');
                } else if (result.satisfaction < 50) {
                    this.showNotification(`😞 Cliente insatisfeito...`, 'error');
                }
            }
        } else {
            // Fallback simples
            const payment = window.gameState.currentJob.payment || 1000;
            window.gameState.money += payment;
            window.gameState.jobsCompleted++;
            this.showNotification(`💰 Serviço concluído! R$ ${payment}`, 'success');
        }

        window.gameState.currentJob = null;
        window.gameState.currentCar = null;

        this.updateMoney();
        this.updateJobsCompleted();
        this.updateJobInfo();
        this.updatePartsList();
        this.getElement('deliver-car').disabled = true;
    }

    // ===== GERADORES (FALLBACK) =====
    generateCustomerName() {
        const names = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Souza', 'Pedro Costa'];
        return names[Math.floor(Math.random() * names.length)];
    }

    generateCarModel() {
        const models = ['Fiat Uno', 'VW Gol', 'Chevrolet Onix', 'Ford Ka', 'Renault Sandero'];
        return models[Math.floor(Math.random() * models.length)];
    }

    generateParts() {
        return {
            motor: { condition: 30 + Math.random() * 70, maxCondition: 100 },
            transmissao: { condition: 30 + Math.random() * 70, maxCondition: 100 },
            freios: { condition: 30 + Math.random() * 70, maxCondition: 100 },
            suspensao: { condition: 30 + Math.random() * 70, maxCondition: 100 },
            bateria: { condition: 30 + Math.random() * 70, maxCondition: 100 },
            alternador: { condition: 30 + Math.random() * 70, maxCondition: 100 }
        };
    }

    // ===== ATUALIZAÇÕES DE DISPLAY =====
    updateAllDisplays() {
        this.updateMoney();
        this.updateLevel();
        this.updateReputation();
        this.updateJobsCompleted();
        this.updateJobInfo();
        this.updatePartsList();
    }

    updateMoney() {
        const moneyEl = this.getElement('money');
        if (window.gameState) {
            moneyEl.textContent = `R$ ${window.gameState.money.toLocaleString()}`;
        }
    }

    updateLevel() {
        const levelEl = this.getElement('level');
        if (window.gameState) {
            levelEl.textContent = window.gameState.level;
        }
    }

    updateReputation() {
        const repEl = this.getElement('reputation');
        if (window.gameState) {
            const stars = '★'.repeat(window.gameState.reputation) + '☆'.repeat(5 - window.gameState.reputation);
            repEl.textContent = stars;
        }
    }

    updateJobsCompleted() {
        const jobsEl = this.getElement('jobs-completed');
        if (window.gameState) {
            jobsEl.textContent = window.gameState.jobsCompleted || 0;
        }
    }

    updateJobInfo() {
        const el = this.getElement('job-info');
        if (!window.gameState?.currentJob) {
            el.innerHTML = '<div class="empty-state">🚗 Nenhum serviço ativo</div>';
            return;
        }

        const job = window.gameState.currentJob;
        
        // Usar CustomerSystem se disponível
        if (this.customerSystem && this.customerSystem.currentJob) {
            const customer = job.customer;
            const timeLeft = this.customerSystem.getTimeRemaining();
            const timeStr = this.customerSystem.formatTime(timeLeft);
            
            const personalityIcon = customer.icon || '👤';
            const isUrgent = timeLeft < 60000 ? 'urgent' : '';
            
            el.innerHTML = `
                <div class="job-header">
                    <span class="job-customer">${personalityIcon} ${customer.name}</span>
                    <span class="job-difficulty">${job.difficulty || 'Normal'}</span>
                </div>
                <div class="job-info-item">
                    <span>Carro:</span>
                    <span>${job.car?.brand || ''} ${job.car?.model || 'Desconhecido'} (${job.car?.year || ''})</span>
                </div>
                <div class="job-info-item">
                    <span>Personalidade:</span>
                    <span>${customer.name || 'Normal'}</span>
                </div>
                <div class="job-info-item">
                    <span>Tempo:</span>
                    <span class="${isUrgent}">⏰ ${timeStr}</span>
                </div>
                <div class="job-payment">
                    Pagamento: R$ ${job.payment}
                </div>
            `;
        } else {
            // Fallback simples
            el.innerHTML = `
                <div class="job-header">
                    <span class="job-customer">${job.customerName || 'Cliente'}</span>
                    <span class="job-difficulty">${job.difficulty || 'Normal'}</span>
                </div>
                <div class="job-info-item">
                    <span>Carro:</span>
                    <span>${job.carModel || 'Desconhecido'}</span>
                </div>
                <div class="job-payment">
                    Pagamento: R$ ${job.payment || 1000}
                </div>
            `;
        }
    }

    updatePartsList() {
        const el = this.getElement('parts-list');
        if (!window.gameState?.currentCar) {
            el.innerHTML = '<div class="empty-state">🔧 Nenhum carro na oficina</div>';
            return;
        }

        const parts = window.gameState.currentCar.parts;
        const gameState = window.gameState;
        
        // Calcular status geral
        let totalCondition = 0;
        let totalParts = 0;
        let perfectCount = 0;
        
        Object.values(parts).forEach(part => {
            totalCondition += part.condition || 0;
            totalParts++;
            if ((part.condition || 0) >= 100) perfectCount++;
        });
        
        const averageCondition = totalParts > 0 ? Math.round(totalCondition / totalParts) : 0;
        
        let html = `
            <div class="car-status">
                <div class="progress-info">
                    <span>Progresso: ${averageCondition}%</span>
                    <span>Peças perfeitas: ${perfectCount}/${totalParts}</span>
                </div>
                <div class="overall-progress">
                    <div class="progress-bar" style="width: ${averageCondition}%"></div>
                </div>
            </div>
            <div class="parts-list">
        `;

        Object.entries(parts).forEach(([name, data]) => {
            const condition = Math.round(data.condition || 0);
            let conditionClass = 'condition-good';
            let conditionText = 'Bom';
            
            if (condition < 30) {
                conditionClass = 'condition-bad';
                conditionText = 'Péssimo';
            } else if (condition < 60) {
                conditionClass = 'condition-medium';
                conditionText = 'Regular';
            } else if (condition < 90) {
                conditionClass = 'condition-medium';
                conditionText = 'Desgastado';
            }

            // Usar UpgradeManager se disponível para custos
            let repairCost = 5;
            let canRepair = gameState.money >= 5;
            
            if (this.upgradeManager) {
                const tool = this.upgradeManager.getToolEfficiency(gameState.selectedTool);
                repairCost = tool.cost;
                canRepair = gameState.money >= repairCost && condition < 100;
            }

            html += `
                <div class="part-item ${gameState.selectedPart === name ? 'selected' : ''}" 
                     onclick="window.selectPart && window.selectPart('${name}')">
                    <div class="part-header">
                        <span class="part-name">${this.getPartDisplayName(name)}</span>
                        <span class="part-condition ${conditionClass}">${condition}% - ${conditionText}</span>
                    </div>
                    <div class="part-progress">
                        <div class="progress-bar" style="width: ${condition}%"></div>
                    </div>
                    <div class="part-actions">
                        <button class="part-btn repair-btn" 
                                onclick="event.stopPropagation(); window.repairPart('${name}')"
                                ${!canRepair ? 'disabled' : ''}>
                            🔧 Reparar (R$ ${repairCost})
                        </button>
                        <button class="part-btn buy-btn" 
                                onclick="event.stopPropagation(); window.buyNewPart('${name}')"
                                ${gameState.money < 500 ? 'disabled' : ''}>
                            🛒 Nova (R$ 500)
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        el.innerHTML = html;
    }

    getPartDisplayName(partName) {
        const names = {
            motor: 'Motor',
            transmissao: 'Transmissão',
            freios: 'Freios',
            suspensao: 'Suspensão',
            bateria: 'Bateria',
            alternador: 'Alternador',
            radiador: 'Radiador',
            escapamento: 'Escapamento',
            turbo: 'Turbo',
            diferencial: 'Diferencial',
            embreagem: 'Embreagem',
            sensor: 'Sensor',
            eletronica: 'Eletrônica'
        };
        return names[partName] || partName;
    }

    // ===== TIMER =====
    updateTimer() {
        if (window.gameState?.currentJob && this.customerSystem?.currentJob) {
            this.updateJobInfo();
            
            // Verificar se tempo esgotou
            if (this.customerSystem.getTimeRemaining() <= 0) {
                const customer = this.customerSystem.cancelJob();
                window.gameState.currentJob = null;
                window.gameState.currentCar = null;
                this.updateJobInfo();
                this.updatePartsList();
                this.getElement('deliver-car').disabled = true;
                
                if (customer) {
                    this.showNotification(`⏰ ${customer.name} foi embora!`, 'error');
                } else {
                    this.showNotification('⏰ Tempo esgotado!', 'error');
                }
            }
        }
    }

    // ===== NOTIFICAÇÕES =====
    showNotification(message, type = 'info') {
        const notification = this.getElement('notification');
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        notification.textContent = message;
        notification.style.backgroundColor = 
            type === 'error' ? '#ff3333' : 
            type === 'success' ? '#00aa00' : '#ff6b00';
        
        notification.classList.add('show');
        
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // ===== MÉTODOS DE ATUALIZAÇÃO DE PAINÉIS =====
    updateUpgradePanel() {
        if (this.upgradePanel) {
            this.upgradePanel.update();
        }
    }

    updateCustomersPanel() {
        if (this.customersPanel) {
            this.customersPanel.update();
        }
    }
}

// ===== FUNÇÕES GLOBAIS =====
window.selectPart = (partName) => {
    if (window.gameState) {
        window.gameState.selectedPart = partName;
        if (window.uiManager) {
            window.uiManager.updatePartsList();
            window.uiManager.showNotification(`🔧 Peça selecionada: ${partName}`, 'info');
        }
    }
};

// Expor globalmente
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
    console.log('🌐 UIManager disponível globalmente');
}