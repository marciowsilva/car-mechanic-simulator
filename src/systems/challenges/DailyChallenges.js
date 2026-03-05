// daily-challenges.js - Sistema de desafios diários

export const CHALLENGES = {
    // Desafios de reparo
    repairMotor: {
        id: 'repairMotor',
        name: 'Especialista em Motor',
        description: 'Repare 3 motores',
        icon: '⚙️',
        category: 'repair',
        target: 3,
        reward: 800,
        progress: 0,
        completed: false,
        claimed: false
    },
    repairFreios: {
        id: 'repairFreios',
        name: 'Segurança em Primeiro Lugar',
        description: 'Repare 5 sistemas de freio',
        icon: '🛑',
        category: 'repair',
        target: 5,
        reward: 1000,
        progress: 0,
        completed: false,
        claimed: false
    },
    repairSuspensao: {
        id: 'repairSuspensao',
        name: 'Conforto e Estabilidade',
        description: 'Repare 4 suspensões',
        icon: '🔧',
        category: 'repair',
        target: 4,
        reward: 900,
        progress: 0,
        completed: false,
        claimed: false
    },
    
    // Desafios de serviço
    completeJobs: {
        id: 'completeJobs',
        name: 'Mecânico Ocupado',
        description: 'Complete 3 serviços',
        icon: '🚗',
        category: 'service',
        target: 3,
        reward: 1200,
        progress: 0,
        completed: false,
        claimed: false
    },
    perfectJobs: {
        id: 'perfectJobs',
        name: 'Perfeccionista',
        description: 'Complete 2 serviços com 100% de qualidade',
        icon: '✨',
        category: 'service',
        target: 2,
        reward: 1500,
        progress: 0,
        completed: false,
        claimed: false
    },
    fastJobs: {
        id: 'fastJobs',
        name: 'Relâmpago',
        description: 'Complete um serviço em menos de 2 minutos',
        icon: '⚡',
        category: 'service',
        target: 1,
        reward: 1000,
        progress: 0,
        completed: false,
        claimed: false
    },
    
    // Desafios de cliente
    vipCustomers: {
        id: 'vipCustomers',
        name: 'Atendimento VIP',
        description: 'Atenda 2 clientes VIP',
        icon: '👑',
        category: 'customer',
        target: 2,
        reward: 1500,
        progress: 0,
        completed: false,
        claimed: false
    },
    satisfaction100: {
        id: 'satisfaction100',
        name: 'Cliente Satisfeito',
        description: 'Deixe um cliente com 100% de satisfação',
        icon: '😊',
        category: 'customer',
        target: 1,
        reward: 800,
        progress: 0,
        completed: false,
        claimed: false
    },
    
    // Desafios de ferramentas
    useTools: {
        id: 'useTools',
        name: 'Ferramenteiro',
        description: 'Use 10 ferramentas diferentes',
        icon: '🔧',
        category: 'tools',
        target: 10,
        reward: 600,
        progress: 0,
        completed: false,
        claimed: false
    },
    diagnostic: {
        id: 'diagnostic',
        name: 'Diagnóstico Preciso',
        description: 'Use a ferramenta de diagnóstico 5 vezes',
        icon: '📊',
        category: 'tools',
        target: 5,
        reward: 500,
        progress: 0,
        completed: false,
        claimed: false
    },
    
    // Desafios de estoque
    useStock: {
        id: 'useStock',
        name: 'Consumidor',
        description: 'Use 3 peças do estoque',
        icon: '📦',
        category: 'inventory',
        target: 3,
        reward: 700,
        progress: 0,
        completed: false,
        claimed: false
    },
    buyStock: {
        id: 'buyStock',
        name: 'Estoquista',
        description: 'Compre 5 peças para o estoque',
        icon: '🛒',
        category: 'inventory',
        target: 5,
        reward: 900,
        progress: 0,
        completed: false,
        claimed: false
    },
    
    // Desafios de dinheiro
    earnMoney: {
        id: 'earnMoney',
        name: 'Faturando Alto',
        description: 'Ganhe R$ 5.000 em serviços',
        icon: '💰',
        category: 'money',
        target: 5000,
        reward: 1500,
        progress: 0,
        completed: false,
        claimed: false
    },
    spendMoney: {
        id: 'spendMoney',
        name: 'Investidor',
        description: 'Gaste R$ 3.000 em upgrades',
        icon: '💸',
        category: 'money',
        target: 3000,
        reward: 1000,
        progress: 0,
        completed: false,
        claimed: false
    }
};

export class DailyChallenges {
    constructor() {
        this.challenges = [];
        this.lastReset = Date.now();
        this.resetTime = 24 * 60 * 60 * 1000; // 24 horas
        this.consecutiveDays = 0;
        this.bonusMultiplier = 1.0;
        this.loadChallenges();
    }

    loadChallenges() {
        // Verificar se precisa resetar
        const now = Date.now();
        if (now - this.lastReset > this.resetTime) {
            this.resetChallenges();
        } else {
            // Carregar do localStorage se disponível
            const saved = localStorage.getItem('dailyChallenges');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.challenges = data.challenges || [];
                    this.lastReset = data.lastReset || now;
                    this.consecutiveDays = data.consecutiveDays || 0;
                } catch (e) {
                    console.error('Erro ao carregar desafios:', e);
                    this.generateNewChallenges();
                }
            } else {
                this.generateNewChallenges();
            }
        }
    }

    generateNewChallenges() {
        // Selecionar 5 desafios aleatórios
        const allChallenges = Object.values(CHALLENGES);
        const shuffled = allChallenges.sort(() => 0.5 - Math.random());
        this.challenges = shuffled.slice(0, 5).map(challenge => ({
            ...challenge,
            progress: 0,
            completed: false,
            claimed: false
        }));
        
        this.lastReset = Date.now();
        this.saveChallenges();
    }

    resetChallenges() {
        this.consecutiveDays++;
        this.bonusMultiplier = 1.0 + (this.consecutiveDays * 0.1); // +10% por dia consecutivo
        this.generateNewChallenges();
    }

    saveChallenges() {
        const data = {
            challenges: this.challenges,
            lastReset: this.lastReset,
            consecutiveDays: this.consecutiveDays
        };
        localStorage.setItem('dailyChallenges', JSON.stringify(data));
    }

    updateProgress(challengeId, amount = 1) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge || challenge.completed || challenge.claimed) return 0;

        challenge.progress += amount;
        
        if (challenge.progress >= challenge.target) {
            challenge.completed = true;
            this.saveChallenges();
            return challenge.reward;
        }
        
        this.saveChallenges();
        return 0;
    }

    claimReward(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge || !challenge.completed || challenge.claimed) return 0;

        challenge.claimed = true;
        
        // Calcular recompensa com bônus
        let reward = challenge.reward;
        if (this.consecutiveDays > 0) {
            reward = Math.floor(reward * this.bonusMultiplier);
        }
        
        this.saveChallenges();
        return reward;
    }

    getActiveChallenges() {
        return this.challenges.filter(c => !c.completed && !c.claimed);
    }

    getCompletedChallenges() {
        return this.challenges.filter(c => c.completed && !c.claimed);
    }

    getClaimedChallenges() {
        return this.challenges.filter(c => c.claimed);
    }

    getProgress() {
        const total = this.challenges.length;
        const completed = this.challenges.filter(c => c.completed).length;
        const claimed = this.challenges.filter(c => c.claimed).length;
        
        return {
            total,
            completed,
            claimed,
            remaining: total - claimed,
            percentage: Math.floor((claimed / total) * 100) || 0
        };
    }

    getTimeUntilReset() {
        const nextReset = this.lastReset + this.resetTime;
        const timeLeft = Math.max(0, nextReset - Date.now());
        
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        
        return { hours, minutes, timeLeft };
    }

    formatTimeLeft() {
        const { hours, minutes } = this.getTimeUntilReset();
        return `${hours}h ${minutes}m`;
    }

    // Métodos para integração com outros sistemas
    onRepair(partName) {
        // Progresso para desafios de reparo
        if (partName === 'motor') {
            this.updateProgress('repairMotor');
        } else if (partName === 'freios') {
            this.updateProgress('repairFreios');
        } else if (partName === 'suspensao') {
            this.updateProgress('repairSuspensao');
        }
        
        this.updateProgress('useTools');
    }

    onJobComplete(job) {
        this.updateProgress('completeJobs');
        
        if (job.quality >= 95) {
            this.updateProgress('perfectJobs');
        }
        
        const timeSpent = Date.now() - job.startTime;
        if (timeSpent < 120000) { // 2 minutos
            this.updateProgress('fastJobs');
        }
        
        this.updateProgress('earnMoney', job.payment);
    }

    onCustomerServed(customer) {
        if (customer.status === 'vip') {
            this.updateProgress('vipCustomers');
        }
        
        if (customer.satisfaction >= 95) {
            this.updateProgress('satisfaction100');
        }
    }

    onToolUsed(toolId) {
        if (toolId === 'diagnostic') {
            this.updateProgress('diagnostic');
        }
    }

    onInventoryUse() {
        this.updateProgress('useStock');
    }

    onInventoryBuy() {
        this.updateProgress('buyStock');
    }

    onUpgradeBuy(amount) {
        this.updateProgress('spendMoney', amount);
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.DailyChallenges = DailyChallenges;
    console.log('🌐 DailyChallenges disponível globalmente');
}
