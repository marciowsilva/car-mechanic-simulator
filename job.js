// job.js - Sistema de serviços com clientes recorrentes

import { PART_TRANSLATIONS } from './constants.js';
import { CAR_MODELS } from './constants.js';
import { upgradeSystem, customerSystem } from './game.js';

export class Job {
    constructor(customerType = 'random') {
        this.id = Date.now();
        
        // Selecionar cliente baseado no tipo
        let customer;
        switch(customerType) {
            case 'regular':
                customer = customerSystem?.getRegularCustomer();
                break;
            case 'vip':
                customer = customerSystem?.getVIPCustomer();
                break;
            default:
                customer = customerSystem?.getRandomCustomer();
        }
        
        // Fallback para cliente padrão se algo der errado
        if (!customer) {
            customer = {
                name: this.generateCustomerName(),
                visits: 0,
                satisfaction: 100,
                status: 'new',
                favoritePart: 'motor',
                preferences: {
                    prefersFast: false,
                    prefersCheap: false,
                    isPatient: true,
                    negotiates: false
                }
            };
        }
        
        this.customerData = customer;
        this.customerName = customer.name;
        this.customerStatus = customer.status || 'new';
        this.customerVisits = customer.visits || 0;
        
        this.carData = this.generateCarData();
        this.carModel = this.formatCarModel();
        this.difficulty = this.generateDifficulty();
        this.targetConditions = this.generateTargetConditions();
        this.basePayment = this.calculateBasePayment();
        
        // Aplicar bônus de cliente recorrente
        if (customerSystem) {
            this.payment = customerSystem.calculatePaymentBonus(this.customerName, this.basePayment);
            this.timeLimit = customerSystem.calculateTimeBonus(this.customerName, this.generateTimeLimit());
        } else {
            this.payment = this.basePayment;
            this.timeLimit = this.generateTimeLimit();
        }
        
        this.startTime = Date.now();
        this.status = 'active';
        this.quality = 0;
        
        // Registrar visita (se for cliente real)
        if (customerSystem && customer.visits !== undefined) {
            customerSystem.recordVisit(this.customerName);
        }
    }

    generateCustomerName() {
        const firstNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Juliana', 'Pedro', 'Fernanda', 'Lucas', 'Mariana',
                           'Roberto', 'Patrícia', 'Marcos', 'Carla', 'Ricardo', 'Amanda', 'Paulo', 'Camila', 'André', 'Beatriz'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
                          'Costa', 'Martins', 'Rocha', 'Carvalho', 'Mendes', 'Nunes', 'Cardoso', 'Teixeira', 'Cavalcanti', 'Dias'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    generateCarData() {
        // Verificar se CAR_MODELS está definido
        if (!CAR_MODELS || CAR_MODELS.length === 0) {
            console.error('❌ CAR_MODELS não está definido!');
            // Fallback para modelo padrão
            return { brand: 'Fiat', model: 'Uno', type: 'compact', year: '2015', engineSize: '1.0' };
        }
        
        return CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
    }

    formatCarModel() {
        if (!this.carData) {
            return 'Carro Desconhecido';
        }
        return `${this.carData.brand} ${this.carData.model} (${this.carData.year})`;
    }

    generateDifficulty() {
        const rand = Math.random();
        if (rand < 0.3) return 'easy';
        if (rand < 0.7) return 'medium';
        return 'hard';
    }

    generateTargetConditions() {
        const targets = {};
        let minCondition, maxCondition;
        
        // Ajustar dificuldade baseada no tipo do carro
        let difficultyMultiplier = 1.0;
        if (this.carData && this.carData.type) {
            const multipliers = {
                compact: 0.8,
                sedan: 1.0,
                suv: 1.2,
                pickup: 1.3,
                sports: 1.5,
                luxury: 1.4
            };
            difficultyMultiplier = multipliers[this.carData.type] || 1.0;
        }
        
        // Ajustar dificuldade baseada no tipo de cliente
        let customerMultiplier = 1.0;
        if (this.customerStatus === 'vip') {
            customerMultiplier = 1.2; // VIPs são mais exigentes
        } else if (this.customerStatus === 'regular') {
            customerMultiplier = 1.1; // Regulares são um pouco mais exigentes
        }
        
        switch(this.difficulty) {
            case 'easy':
                minCondition = 60;
                maxCondition = 75;
                break;
            case 'medium':
                minCondition = 75;
                maxCondition = 85;
                break;
            case 'hard':
                minCondition = 85;
                maxCondition = 95;
                break;
        }
        
        // Aplicar multiplicadores
        const totalMultiplier = difficultyMultiplier * customerMultiplier;
        minCondition = Math.min(98, Math.round(minCondition * totalMultiplier));
        maxCondition = Math.min(99, Math.round(maxCondition * totalMultiplier));
        
        Object.keys(PART_TRANSLATIONS).forEach(partName => {
            const variation = Math.floor(Math.random() * 15) - 7;
            let target = Math.min(100, Math.max(minCondition, minCondition + variation));
            
            // Preferências do cliente podem afetar certas peças
            if (this.customerData && this.customerData.favoritePart === partName) {
                target = Math.min(100, target + 5); // Cliente é mais exigente com sua peça favorita
            }
            
            targets[partName] = target;
        });
        
        return targets;
    }

    calculateBasePayment() {
        const baseValues = { easy: 1500, medium: 2500, hard: 4000 };
        let payment = baseValues[this.difficulty];
        
        // Bônus por tipo de carro
        if (this.carData && this.carData.type) {
            const multipliers = {
                compact: 1.0,
                sedan: 1.2,
                suv: 1.5,
                pickup: 1.6,
                sports: 2.0,
                luxury: 1.8
            };
            payment = Math.round(payment * (multipliers[this.carData.type] || 1.0));
        }
        
        return payment;
    }

    generateTimeLimit() {
        const timeLimits = { easy: 180000, medium: 240000, hard: 300000 };
        let timeLimit = timeLimits[this.difficulty];
        
        // Ajustar tempo baseado no tipo do carro
        if (this.carData && this.carData.type) {
            const multipliers = {
                compact: 0.8,
                sedan: 1.0,
                suv: 1.2,
                pickup: 1.3,
                sports: 1.4,
                luxury: 1.3
            };
            timeLimit = Math.round(timeLimit * (multipliers[this.carData.type] || 1.0));
        }
        
        return timeLimit;
    }

    getTimeRemaining() {
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.timeLimit - elapsed);
    }

    isExpired() {
        return this.getTimeRemaining() <= 0;
    }

    checkCompletion(carParts) {
        let allCompleted = true;
        let totalQuality = 0;
        let partCount = 0;
        
        for (const [partName, targetCondition] of Object.entries(this.targetConditions)) {
            const currentCondition = carParts[partName]?.condition || 0;
            if (currentCondition < targetCondition) {
                allCompleted = false;
            }
            totalQuality += currentCondition;
            partCount++;
        }
        
        this.quality = Math.floor(totalQuality / partCount);
        return allCompleted;
    }

    getRemainingParts(carParts) {
        const remaining = [];
        for (const [partName, targetCondition] of Object.entries(this.targetConditions)) {
            if (carParts[partName].condition < targetCondition) {
                remaining.push(partName);
            }
        }
        return remaining;
    }

    getProgress(carParts) {
        let total = 0;
        let count = 0;
        
        for (const [partName, targetCondition] of Object.entries(this.targetConditions)) {
            const current = carParts[partName].condition;
            total += Math.min(100, (current / targetCondition) * 100);
            count++;
        }
        
        return Math.floor(total / count);
    }

    completeJob() {
        if (!customerSystem) return this.payment;
        
        const timeSpent = Date.now() - this.startTime;
        
        // Atualizar satisfação do cliente
        customerSystem.updateSatisfaction(
            this.customerName, 
            this.quality, 
            timeSpent, 
            this.payment
        );
        
        this.status = 'completed';
        return this.payment;
    }

    getCustomerInfo() {
        let statusIcon = '🆕';
        let statusColor = '#888';
        
        if (this.customerStatus === 'vip') {
            statusIcon = '👑';
            statusColor = '#ffd700';
        } else if (this.customerStatus === 'regular') {
            statusIcon = '⭐';
            statusColor = '#ff6b00';
        }
        
        return {
            name: this.customerName,
            icon: statusIcon,
            color: statusColor,
            visits: this.customerVisits,
            isReturning: this.customerVisits > 0
        };
    }

    getDifficultyText() {
        switch(this.difficulty) {
            case 'easy': return 'Fácil';
            case 'medium': return 'Médio';
            case 'hard': return 'Difícil';
            default: return 'Desconhecido';
        }
    }

    getDifficultyClass() {
        return `difficulty-${this.difficulty}`;
    }
}