// src/ui/CustomersPanel.js - Painel de visualização de clientes

export class CustomersPanel {
    constructor(customerSystem) {
        this.customerSystem = customerSystem;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'customers-panel';
        this.panel.className = 'customers-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="customers-header">
                <h2>👥 CLIENTES</h2>
                <button class="close-btn">×</button>
            </div>
            
            <div class="customers-stats" id="customers-stats">
                <!-- Estatísticas serão inseridas aqui -->
            </div>
            
            <div class="customers-grid" id="customers-grid">
                <!-- Cards serão inseridos aqui -->
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());
        
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
        const stats = this.customerSystem.getStats();
        const customers = this.customerSystem.getCustomerList();
        const customerOfDay = this.customerSystem.getCustomerOfTheDay();
        
        // Atualizar estatísticas
        this.updateStats(stats);
        
        // Atualizar grid de clientes
        this.updateCustomers(customers, customerOfDay);
    }

    updateStats(stats) {
        const statsEl = this.panel.querySelector('#customers-stats');
        
        statsEl.innerHTML = `
            <div class="customer-stat">
                <div class="value">${stats.totalCustomers}</div>
                <div class="label">Total Clientes</div>
            </div>
            <div class="customer-stat">
                <div class="value">${stats.vipCustomers}</div>
                <div class="label">VIPs</div>
            </div>
            <div class="customer-stat">
                <div class="value">${stats.avgSatisfaction}%</div>
                <div class="label">Satisfação Média</div>
            </div>
            <div class="customer-stat">
                <div class="value">${stats.totalJobs}</div>
                <div class="label">Serviços</div>
            </div>
        `;
    }

    updateCustomers(customers, customerOfDay) {
        const gridEl = this.panel.querySelector('#customers-grid');
        gridEl.innerHTML = '';
        
        customers.sort((a, b) => b.visits - a.visits).forEach(customer => {
            const card = document.createElement('div');
            card.className = `customer-card ${customer.id === customerOfDay.id ? 'customer-of-day' : ''}`;
            
            const satisfactionPercent = customer.satisfaction;
            let satisfactionClass = 'good';
            if (satisfactionPercent < 50) satisfactionClass = 'bad';
            else if (satisfactionPercent < 80) satisfactionClass = 'medium';
            
            card.innerHTML = `
                <div class="customer-header">
                    <span class="customer-name">${customer.name}</span>
                    <span class="customer-personality" title="${customer.description}">
                        ${customer.icon} ${customer.name}
                    </span>
                </div>
                
                <div class="customer-details">
                    ${customer.car || 'Vários carros'}
                </div>
                
                <div class="customer-stat-row">
                    <span class="label">Visitas:</span>
                    <span class="value">${customer.visits}</span>
                </div>
                
                <div class="customer-stat-row">
                    <span class="label">Gasto total:</span>
                    <span class="value">R$ ${customer.totalSpent}</span>
                </div>
                
                <div class="customer-stat-row">
                    <span class="label">Satisfação:</span>
                    <span class="value">${customer.satisfaction}%</span>
                </div>
                
                <div class="satisfaction-bar">
                    <div class="satisfaction-fill ${satisfactionClass}" style="width: ${satisfactionPercent}%"></div>
                </div>
                
                <div class="customer-footer">
                    <span class="loyalty-badge">${customer.loyaltyIcon || '🆕'} ${customer.loyaltyTitle || 'Novo Cliente'}</span>
                    <span>❤️ ${customer.preferredParts.join(', ')}</span>
                </div>
            `;
            
            gridEl.appendChild(card);
        });
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CustomersPanel = CustomersPanel;
}