// customers.js - Sistema de clientes recorrentes

export class CustomerSystem {
    constructor() {
        this.customers = {};
        this.totalCustomers = 0;
        this.regularCustomers = 0;
        this.vipCustomers = 0;
        this.loadSampleCustomers();
    }

    loadSampleCustomers() {
        // Clientes iniciais (alguns já com histórico)
        const sampleCustomers = [
            { name: 'João Silva', visits: 3, satisfaction: 95, totalSpent: 4500, favoritePart: 'motor' },
            { name: 'Maria Santos', visits: 5, satisfaction: 98, totalSpent: 8200, favoritePart: 'freios' },
            { name: 'Carlos Oliveira', visits: 1, satisfaction: 80, totalSpent: 1200, favoritePart: 'bateria' },
            { name: 'Ana Souza', visits: 2, satisfaction: 90, totalSpent: 2800, favoritePart: 'suspensao' },
            { name: 'Pedro Costa', visits: 0, satisfaction: 100, totalSpent: 0, favoritePart: 'transmissao' }
        ];

        sampleCustomers.forEach(customer => {
            this.addCustomer(customer);
        });
    }

    addCustomer(customerData) {
        const id = this.generateCustomerId(customerData.name);
        this.customers[id] = {
            ...customerData,
            id,
            lastVisit: Date.now(),
            preferences: this.generatePreferences(customerData.favoritePart),
            complaints: 0,
            recommendations: 0
        };
        this.totalCustomers++;
        this.updateCustomerStatus();
        return this.customers[id];
    }

    generateCustomerId(name) {
        return name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    }

    generatePreferences(favoritePart) {
        return {
            favoritePart,
            prefersFast: Math.random() > 0.5,
            prefersCheap: Math.random() > 0.7,
            isPatient: Math.random() > 0.6,
            negotiates: Math.random() > 0.8
        };
    }

    updateCustomerStatus() {
        this.regularCustomers = 0;
        this.vipCustomers = 0;

        Object.values(this.customers).forEach(customer => {
            if (customer.visits >= 5) {
                this.vipCustomers++;
                customer.status = 'vip';
            } else if (customer.visits >= 2) {
                this.regularCustomers++;
                customer.status = 'regular';
            } else {
                customer.status = 'new';
            }
        });
    }

    recordVisit(customerName) {
        const customer = this.getCustomerByName(customerName);
        if (customer) {
            customer.visits++;
            customer.lastVisit = Date.now();
            this.updateCustomerStatus();
            
            // Bônus por fidelidade
            if (customer.visits === 3) {
                this.unlockLoyaltyBonus(customer);
            }
            if (customer.visits === 5) {
                this.unlockVIPStatus(customer);
            }
        }
    }

    getCustomerByName(name) {
        return Object.values(this.customers).find(c => c.name === name);
    }

    getRandomCustomer() {
        const customerArray = Object.values(this.customers);
        return customerArray[Math.floor(Math.random() * customerArray.length)];
    }

    getRegularCustomer() {
        const regulars = Object.values(this.customers).filter(c => c.visits >= 2);
        if (regulars.length === 0) return this.getRandomCustomer();
        return regulars[Math.floor(Math.random() * regulars.length)];
    }

    getVIPCustomer() {
        const vips = Object.values(this.customers).filter(c => c.visits >= 5);
        if (vips.length === 0) return this.getRegularCustomer();
        return vips[Math.floor(Math.random() * vips.length)];
    }

    calculatePaymentBonus(customerName, basePayment) {
        const customer = this.getCustomerByName(customerName);
        if (!customer) return basePayment;

        let multiplier = 1.0;

        // Bônus por frequência
        if (customer.visits >= 5) multiplier += 0.2; // +20% para VIPs
        else if (customer.visits >= 2) multiplier += 0.1; // +10% para regulares

        // Bônus por satisfação
        if (customer.satisfaction >= 95) multiplier += 0.1;
        else if (customer.satisfaction <= 70) multiplier -= 0.1;

        return Math.floor(basePayment * multiplier);
    }

    calculateTimeBonus(customerName, baseTime) {
        const customer = this.getCustomerByName(customerName);
        if (!customer) return baseTime;

        let timeMultiplier = 1.0;

        // Clientes VIPs são mais pacientes
        if (customer.visits >= 5) timeMultiplier += 0.3;
        else if (customer.visits >= 2) timeMultiplier += 0.1;

        // Preferências pessoais
        if (customer.preferences.isPatient) timeMultiplier += 0.2;
        if (customer.preferences.prefersFast) timeMultiplier -= 0.1;

        return Math.floor(baseTime * timeMultiplier);
    }

    updateSatisfaction(customerName, quality, timeSpent, pricePaid) {
        const customer = this.getCustomerByName(customerName);
        if (!customer) return;

        let satisfactionChange = 0;

        // Qualidade do serviço
        if (quality >= 95) satisfactionChange += 10;
        else if (quality >= 80) satisfactionChange += 5;
        else if (quality >= 60) satisfactionChange += 0;
        else satisfactionChange -= 10;

        // Tempo de serviço
        const expectedTime = this.calculateTimeBonus(customerName, 240000); // 4 minutos base
        if (timeSpent < expectedTime * 0.7) satisfactionChange += 5;
        else if (timeSpent > expectedTime * 1.3) satisfactionChange -= 5;

        // Preço
        const expectedPrice = this.calculatePaymentBonus(customerName, 2000);
        if (pricePaid < expectedPrice * 0.8) satisfactionChange += 5;
        else if (pricePaid > expectedPrice * 1.2) satisfactionChange -= 5;

        customer.satisfaction = Math.max(0, Math.min(100, customer.satisfaction + satisfactionChange));
    }

    unlockLoyaltyBonus(customer) {
        console.log(`🎁 Cliente ${customer.name} ganhou bônus de fidelidade!`);
        // Implementar bônus específico
    }

    unlockVIPStatus(customer) {
        console.log(`👑 ${customer.name} agora é um cliente VIP!`);
        // Implementar benefícios VIP
    }

    getCustomerCard(customerName) {
        const customer = this.getCustomerByName(customerName);
        if (!customer) return null;

        let statusIcon = '🆕';
        let statusColor = '#888';
        
        if (customer.status === 'vip') {
            statusIcon = '👑';
            statusColor = '#ffd700';
        } else if (customer.status === 'regular') {
            statusIcon = '⭐';
            statusColor = '#ff6b00';
        }

        return {
            name: customer.name,
            icon: statusIcon,
            color: statusColor,
            visits: customer.visits,
            satisfaction: customer.satisfaction,
            favoritePart: customer.favoritePart,
            totalSpent: customer.totalSpent
        };
    }

    getStats() {
        return {
            totalCustomers: this.totalCustomers,
            regularCustomers: this.regularCustomers,
            vipCustomers: this.vipCustomers,
            averageSatisfaction: this.calculateAverageSatisfaction(),
            totalRevenue: this.calculateTotalRevenue()
        };
    }

    calculateAverageSatisfaction() {
        const customers = Object.values(this.customers);
        if (customers.length === 0) return 0;
        const sum = customers.reduce((acc, c) => acc + c.satisfaction, 0);
        return Math.floor(sum / customers.length);
    }

    calculateTotalRevenue() {
        return Object.values(this.customers).reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    }
}