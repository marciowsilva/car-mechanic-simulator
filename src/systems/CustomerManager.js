// src/systems/CustomerManager.js - Gerencia clientes e jobs

export class CustomerManager {
    constructor() {
        console.log('👥 Inicializando CustomerManager...');
        this.customers = this.generateCustomers(10);
        this.currentJob = null;
    }

    // Gerar clientes iniciais
    generateCustomers(count) {
        const customers = [];
        const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Juliana', 'Pedro', 'Fernanda', 'Lucas', 'Mariana'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
        const carModels = ['Fiat Uno', 'VW Gol', 'Chevrolet Onix', 'Ford Ka', 'Renault Sandero', 'Toyota Corolla', 'Honda Civic', 'Jeep Renegade', 'Hyundai HB20', 'Nissan Kicks'];
        
        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const visits = Math.floor(Math.random() * 5);
            
            customers.push({
                id: i + 1,
                name: `${firstName} ${lastName}`,
                car: carModels[Math.floor(Math.random() * carModels.length)],
                visits: visits,
                satisfaction: 70 + Math.floor(Math.random() * 30),
                totalSpent: visits * (500 + Math.floor(Math.random() * 1000)),
                preferredParts: this.getRandomParts(2),
                isVIP: visits > 3
            });
        }
        return customers;
    }

    getRandomParts(count) {
        const allParts = ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'];
        const selected = [];
        for (let i = 0; i < count; i++) {
            const part = allParts[Math.floor(Math.random() * allParts.length)];
            if (!selected.includes(part)) selected.push(part);
        }
        return selected;
    }

    // Gerar um novo job
    generateJob() {
        const customer = this.customers[Math.floor(Math.random() * this.customers.length)];
        const difficulty = Math.random();
        let multiplier = 1;
        let difficultyName = 'Normal';
        
        if (difficulty < 0.3) {
            multiplier = 0.8;
            difficultyName = 'Fácil';
        } else if (difficulty > 0.7) {
            multiplier = 1.5;
            difficultyName = 'Difícil';
        }

        const basePayment = 500 + Math.floor(Math.random() * 1000);
        const payment = Math.floor(basePayment * multiplier);
        
        // Gerar peças com condições aleatórias
        const parts = {};
        const partTypes = ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'];
        
        partTypes.forEach(part => {
            let condition;
            if (difficulty < 0.3) {
                condition = 50 + Math.floor(Math.random() * 40); // Fácil: 50-90%
            } else if (difficulty > 0.7) {
                condition = 20 + Math.floor(Math.random() * 40); // Difícil: 20-60%
            } else {
                condition = 30 + Math.floor(Math.random() * 50); // Normal: 30-80%
            }
            
            parts[part] = {
                condition: condition,
                maxCondition: 100,
                price: this.getPartPrice(part)
            };
        });

        this.currentJob = {
            id: Date.now(),
            customer: customer,
            difficulty: difficultyName,
            payment: payment,
            parts: parts,
            startTime: Date.now(),
            timeLimit: 5 * 60 * 1000, // 5 minutos
            status: 'active'
        };

        return this.currentJob;
    }

    getPartPrice(partName) {
        const prices = {
            motor: 800,
            transmissao: 600,
            freios: 300,
            suspensao: 400,
            bateria: 150,
            alternador: 250
        };
        return prices[partName] || 500;
    }

    // Completar job
    completeJob(quality) {
        if (!this.currentJob) return null;

        const job = this.currentJob;
        const timeSpent = Date.now() - job.startTime;
        const timeBonus = timeSpent < job.timeLimit ? 100 : 0;
        
        // Calcular satisfação
        let satisfaction = 70;
        satisfaction += quality * 0.3; // Qualidade aumenta satisfação
        satisfaction -= (timeSpent - job.timeLimit) / 10000; // Atraso diminui satisfação
        
        satisfaction = Math.max(0, Math.min(100, satisfaction));
        
        // Atualizar cliente
        const customer = job.customer;
        customer.visits++;
        customer.satisfaction = Math.floor((customer.satisfaction + satisfaction) / 2);
        customer.totalSpent += job.payment + timeBonus;
        customer.isVIP = customer.visits > 3;

        const totalPayment = job.payment + timeBonus;

        this.currentJob = null;

        return {
            payment: totalPayment,
            satisfaction: Math.floor(satisfaction),
            timeBonus: timeBonus,
            customer: customer
        };
    }

    // Cancelar job (tempo esgotado)
    cancelJob() {
        if (!this.currentJob) return null;
        
        const job = this.currentJob;
        const customer = job.customer;
        
        // Penalidade por cancelamento
        customer.satisfaction = Math.max(0, customer.satisfaction - 20);
        
        this.currentJob = null;
        
        return customer;
    }

    // Verificar tempo restante
    getTimeRemaining() {
        if (!this.currentJob) return 0;
        const elapsed = Date.now() - this.currentJob.startTime;
        return Math.max(0, this.currentJob.timeLimit - elapsed);
    }

    // Formatar tempo
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Obter lista de clientes
    getCustomerList() {
        return this.customers.map(c => ({
            ...c,
            satisfactionClass: this.getSatisfactionClass(c.satisfaction)
        }));
    }

    getSatisfactionClass(satisfaction) {
        if (satisfaction >= 80) return 'good';
        if (satisfaction >= 50) return 'medium';
        return 'bad';
    }

    // Obter estatísticas
    getStats() {
        const totalCustomers = this.customers.length;
        const vipCustomers = this.customers.filter(c => c.isVIP).length;
        const avgSatisfaction = this.customers.reduce((sum, c) => sum + c.satisfaction, 0) / totalCustomers;
        const totalRevenue = this.customers.reduce((sum, c) => sum + c.totalSpent, 0);

        return {
            totalCustomers,
            vipCustomers,
            avgSatisfaction: Math.floor(avgSatisfaction),
            totalRevenue,
            activeJob: !!this.currentJob
        };
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CustomerManager = CustomerManager;
}