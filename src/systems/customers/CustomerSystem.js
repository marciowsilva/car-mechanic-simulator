// src/systems/customers/CustomerSystem.js - Versão avançada

import { getRandomCar } from '/src/cars/CarCatalog.js';

// Personalidades dos clientes
const PERSONALITIES = {
    patient: {
        name: 'Paciente',
        description: 'Não se importa com o tempo',
        timeMultiplier: 1.5,
        priceMultiplier: 1.0,
        satisfactionBonus: 10,
        icon: '😊'
    },
    impatient: {
        name: 'Apressado',
        description: 'Quer tudo para ontem',
        timeMultiplier: 0.7,
        priceMultiplier: 1.2,
        satisfactionBonus: -10,
        icon: '⚡'
    },
    generous: {
        name: 'Generoso',
        description: 'Paga bem acima do valor',
        timeMultiplier: 1.2,
        priceMultiplier: 1.5,
        satisfactionBonus: 15,
        icon: '💰'
    },
    cheap: {
        name: 'Econômico',
        description: 'Busca o menor preço',
        timeMultiplier: 1.1,
        priceMultiplier: 0.7,
        satisfactionBonus: -5,
        icon: '💸'
    },
    expert: {
        name: 'Entendido',
        description: 'Conhece mecânica',
        timeMultiplier: 1.0,
        priceMultiplier: 1.1,
        satisfactionBonus: 5,
        icon: '🔧'
    },
    novice: {
        name: 'Iniciante',
        description: 'Primeira vez na oficina',
        timeMultiplier: 1.3,
        priceMultiplier: 0.9,
        satisfactionBonus: 20,
        icon: '🆕'
    }
};

// Níveis de fidelidade
const LOYALTY_LEVELS = {
    new: { minVisits: 0, multiplier: 1.0, title: 'Novo Cliente', icon: '🆕' },
    regular: { minVisits: 3, multiplier: 1.1, title: 'Cliente Regular', icon: '⭐' },
    loyal: { minVisits: 10, multiplier: 1.2, title: 'Cliente Fiel', icon: '🌟🌟' },
    vip: { minVisits: 20, multiplier: 1.3, title: 'Cliente VIP', icon: '👑' }
};

export class CustomerSystem {
    constructor() {
        console.log('👥 Inicializando CustomerSystem avançado...');
        this.customers = this.generateCustomers(15);
        this.currentJob = null;
        this.totalEarnings = 0;
        this.totalJobs = 0;
    }

    // Gerar clientes iniciais
    generateCustomers(count) {
        const customers = [];
        const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Juliana', 'Pedro', 'Fernanda', 'Lucas', 'Mariana',
                           'Roberto', 'Patrícia', 'Marcos', 'Carla', 'Ricardo', 'Amanda', 'Paulo', 'Camila', 'André', 'Beatriz'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
                          'Costa', 'Martins', 'Rocha', 'Carvalho', 'Mendes', 'Nunes', 'Cardoso', 'Teixeira', 'Cavalcanti', 'Dias'];
        
        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const personalityKeys = Object.keys(PERSONALITIES);
            const personality = personalityKeys[Math.floor(Math.random() * personalityKeys.length)];
            const visits = Math.floor(Math.random() * 15);
            
            customers.push({
                id: i + 1,
                name: `${firstName} ${lastName}`,
                personality: personality,
                ...PERSONALITIES[personality],
                visits: visits,
                satisfaction: 70 + Math.floor(Math.random() * 30),
                totalSpent: 0,
                favoriteMechanic: null,
                lastVisit: null,
                preferredParts: this.getRandomParts(2),
                complaints: 0,
                recommendations: 0
            });
        }
        return customers;
    }

    getRandomParts(count) {
        const allParts = ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'escapamento'];
        const selected = [];
        for (let i = 0; i < count; i++) {
            const part = allParts[Math.floor(Math.random() * allParts.length)];
            if (!selected.includes(part)) selected.push(part);
        }
        return selected;
    }

    // Gerar um novo job
    generateJob() {
        // Escolher cliente (tende a pegar clientes com mais visitas)
        const customer = this.selectCustomerByPriority();
        
        // Determinar dificuldade baseada no cliente e no histórico
        const difficulty = this.calculateDifficulty(customer);
        
        // Pegar carro compatível
        const car = getRandomCar(difficulty.level);
        if (!car) return null;

        // Calcular pagamento base
        const basePayment = car.basePrice * 0.1; // 10% do valor do carro
        const payment = Math.floor(basePayment * difficulty.multiplier * customer.priceMultiplier);
        
        // Calcular tempo limite
        const baseTime = 5 * 60 * 1000; // 5 minutos base
        const timeLimit = Math.floor(baseTime * difficulty.timeMultiplier * customer.timeMultiplier);
        
        // Gerar peças com condições variáveis
        const parts = this.generateParts(car, difficulty, customer);
        
        // Registrar job
        this.currentJob = {
            id: Date.now(),
            customer: { ...customer },
            car: { ...car },
            difficulty: difficulty.name,
            payment: payment,
            parts: parts,
            startTime: Date.now(),
            timeLimit: timeLimit,
            status: 'active',
            quality: 0
        };

        return this.currentJob;
    }

    selectCustomerByPriority() {
        // Dar prioridade para clientes com mais visitas (60% de chance)
        if (Math.random() < 0.6) {
            const regulars = this.customers.filter(c => c.visits >= 3);
            if (regulars.length > 0) {
                return regulars[Math.floor(Math.random() * regulars.length)];
            }
        }
        // Cliente aleatório
        return this.customers[Math.floor(Math.random() * this.customers.length)];
    }

    calculateDifficulty(customer) {
        const base = Math.random();
        let difficulty, multiplier, timeMultiplier, name;
        
        // Influência da satisfação do cliente
        const satisfactionBonus = customer.satisfaction > 80 ? -0.2 : customer.satisfaction < 50 ? 0.3 : 0;
        
        if (base + satisfactionBonus < 0.3) {
            difficulty = 'easy';
            multiplier = 0.8;
            timeMultiplier = 1.2;
            name = 'Fácil';
        } else if (base + satisfactionBonus > 0.7) {
            difficulty = 'hard';
            multiplier = 1.5;
            timeMultiplier = 0.8;
            name = 'Difícil';
        } else {
            difficulty = 'medium';
            multiplier = 1.0;
            timeMultiplier = 1.0;
            name = 'Normal';
        }
        
        return { level: difficulty, multiplier, timeMultiplier, name };
    }

    generateParts(car, difficulty, customer) {
        const parts = {};
        
        car.parts.forEach(partType => {
            let condition;
            
            // Condição baseada na dificuldade
            if (difficulty.level === 'easy') {
                condition = 60 + Math.floor(Math.random() * 30);
            } else if (difficulty.level === 'hard') {
                condition = 20 + Math.floor(Math.random() * 40);
            } else {
                condition = 40 + Math.floor(Math.random() * 40);
            }
            
            // Ajuste baseado nas preferências do cliente
            if (customer.preferredParts.includes(partType)) {
                condition -= 10; // Cliente usa mais essa peça
            }
            
            parts[partType] = {
                condition: Math.max(10, Math.min(100, condition)),
                maxCondition: 100,
                price: this.getPartPrice(partType)
            };
        });
        
        return parts;
    }

    getPartPrice(partName) {
        const prices = {
            motor: 800,
            transmissao: 600,
            freios: 300,
            suspensao: 400,
            bateria: 150,
            alternador: 250,
            radiador: 200,
            escapamento: 180,
            turbo: 1200,
            diferencial: 500,
            embreagem: 350,
            sensor: 120,
            eletronica: 450
        };
        return prices[partName] || 500;
    }

    // Completar job
    completeJob(quality) {
        if (!this.currentJob) return null;

        const job = this.currentJob;
        const timeSpent = Date.now() - job.startTime;
        const timeBonus = timeSpent < job.timeLimit ? 100 : 0;
        
        // Calcular satisfação base
        let satisfaction = 70;
        satisfaction += quality * 0.3; // Qualidade aumenta satisfação
        satisfaction -= Math.max(0, (timeSpent - job.timeLimit) / 10000); // Atraso diminui
        
        // Ajustes por personalidade
        satisfaction += job.customer.satisfactionBonus;
        
        // Satisfação entre 0 e 100
        satisfaction = Math.max(0, Math.min(100, satisfaction));
        
        // Atualizar cliente
        const customerIndex = this.customers.findIndex(c => c.id === job.customer.id);
        if (customerIndex >= 0) {
            const customer = this.customers[customerIndex];
            customer.visits++;
            customer.lastVisit = Date.now();
            customer.satisfaction = Math.floor((customer.satisfaction + satisfaction) / 2);
            customer.totalSpent += job.payment + timeBonus;
            
            // Atualizar nível de fidelidade
            this.updateLoyaltyLevel(customer);
        }

        const totalPayment = job.payment + timeBonus;
        this.totalEarnings += totalPayment;
        this.totalJobs++;

        this.currentJob = null;

        return {
            payment: totalPayment,
            satisfaction: Math.floor(satisfaction),
            timeBonus: timeBonus,
            customer: job.customer
        };
    }

    updateLoyaltyLevel(customer) {
        let newLevel = 'new';
        for (const [level, data] of Object.entries(LOYALTY_LEVELS)) {
            if (customer.visits >= data.minVisits) {
                newLevel = level;
            }
        }
        customer.loyaltyLevel = newLevel;
        customer.loyaltyTitle = LOYALTY_LEVELS[newLevel].title;
        customer.loyaltyIcon = LOYALTY_LEVELS[newLevel].icon;
    }

    // Cancelar job
    cancelJob() {
        if (!this.currentJob) return null;
        
        const job = this.currentJob;
        const customerIndex = this.customers.findIndex(c => c.id === job.customer.id);
        
        if (customerIndex >= 0) {
            const customer = this.customers[customerIndex];
            customer.satisfaction = Math.max(0, customer.satisfaction - 30);
            customer.complaints++;
        }
        
        this.currentJob = null;
        
        return job.customer;
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
            satisfactionClass: this.getSatisfactionClass(c.satisfaction),
            personalityData: PERSONALITIES[c.personality]
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
        const vipCustomers = this.customers.filter(c => c.visits >= 10).length;
        const avgSatisfaction = this.customers.reduce((sum, c) => sum + c.satisfaction, 0) / totalCustomers;
        
        // Calcular distribuição de personalidades
        const personalityCount = {};
        Object.keys(PERSONALITIES).forEach(p => personalityCount[p] = 0);
        this.customers.forEach(c => personalityCount[c.personality]++);

        return {
            totalCustomers,
            vipCustomers,
            avgSatisfaction: Math.floor(avgSatisfaction),
            totalEarnings: this.totalEarnings,
            totalJobs: this.totalJobs,
            activeJob: !!this.currentJob,
            personalityDistribution: personalityCount,
            loyaltyLevels: {
                new: this.customers.filter(c => (c.visits || 0) < 3).length,
                regular: this.customers.filter(c => (c.visits || 0) >= 3 && (c.visits || 0) < 10).length,
                loyal: this.customers.filter(c => (c.visits || 0) >= 10 && (c.visits || 0) < 20).length,
                vip: this.customers.filter(c => (c.visits || 0) >= 20).length
            }
        };
    }

    // Obter cliente do dia (destaque)
    getCustomerOfTheDay() {
        // Cliente com maior potencial (visitas + satisfação)
        return this.customers.reduce((best, current) => {
            const bestScore = (best.visits * 2) + best.satisfaction;
            const currentScore = (current.visits * 2) + current.satisfaction;
            return currentScore > bestScore ? current : best;
        }, this.customers[0]);
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CustomerSystem = CustomerSystem;
}