// specializations.js - Sistema de especializações do mecânico

export const SPECIALIZATIONS = {
    engine: {
        id: 'engine',
        name: 'Especialista em Motor',
        description: 'Reparos no motor são 20% mais eficientes',
        parts: ['motor'],
        bonus: 0.2,
        price: 2000,
        icon: '⚙️',
        level: 0,
        maxLevel: 3
    },
    electric: {
        id: 'electric',
        name: 'Especialista em Elétrica',
        description: 'Reparos em componentes elétricos são 20% mais eficientes',
        parts: ['bateria', 'alternador'],
        bonus: 0.2,
        price: 2000,
        icon: '⚡',
        level: 0,
        maxLevel: 3
    },
    suspension: {
        id: 'suspension',
        name: 'Especialista em Suspensão',
        description: 'Reparos na suspensão e freios são 20% mais eficientes',
        parts: ['suspensao', 'freios'],
        bonus: 0.2,
        price: 2000,
        icon: '🔧',
        level: 0,
        maxLevel: 3
    },
    transmission: {
        id: 'transmission',
        name: 'Especialista em Transmissão',
        description: 'Reparos na transmissão são 20% mais eficientes',
        parts: ['transmissao'],
        bonus: 0.2,
        price: 2000,
        icon: '🔄',
        level: 0,
        maxLevel: 3
    },
    cooling: {
        id: 'cooling',
        name: 'Especialista em Arrefecimento',
        description: 'Reparos no radiador são 20% mais eficientes',
        parts: ['radiador'],
        bonus: 0.2,
        price: 2000,
        icon: '💧',
        level: 0,
        maxLevel: 3
    },
    exhaust: {
        id: 'exhaust',
        name: 'Especialista em Escape',
        description: 'Reparos no escapamento são 20% mais eficientes',
        parts: ['escapamento'],
        bonus: 0.2,
        price: 2000,
        icon: '💨',
        level: 0,
        maxLevel: 3
    }
};

export class SpecializationSystem {
    constructor() {
        this.specializations = JSON.parse(JSON.stringify(SPECIALIZATIONS)); // Cópia profunda
        this.activeBonuses = {};
    }

    // Comprar upgrade de especialização
    buySpecialization(specId) {
        const spec = this.specializations[specId];
        if (!spec) return false;

        if (spec.level >= spec.maxLevel) {
            return { success: false, message: '⚠️ Especialização já está no nível máximo!' };
        }

        const price = spec.price * (spec.level + 1);
        
        if (gameState.money >= price) {
            gameState.updateMoney(-price);
            spec.level++;
            this.updateBonuses();
            return { success: true, message: `✅ ${spec.name} nível ${spec.level} adquirido!` };
        } else {
            return { success: false, message: '💰 Dinheiro insuficiente!' };
        }
    }

    // Atualizar bônus ativos
    updateBonuses() {
        this.activeBonuses = {};
        
        Object.values(this.specializations).forEach(spec => {
            if (spec.level > 0) {
                spec.parts.forEach(partName => {
                    if (!this.activeBonuses[partName]) {
                        this.activeBonuses[partName] = 0;
                    }
                    // Bônus acumulativo por nível
                    this.activeBonuses[partName] += spec.bonus * spec.level;
                });
            }
        });
    }

    // Calcular bônus para uma peça específica
    getPartBonus(partName) {
        return this.activeBonuses[partName] || 0;
    }

    // Calcular eficiência de reparo com bônus
    calculateRepairEfficiency(baseEfficiency, partName) {
        const bonus = this.getPartBonus(partName);
        return Math.floor(baseEfficiency * (1 + bonus));
    }

    // Obter custo para próximo nível
    getNextLevelPrice(specId) {
        const spec = this.specializations[specId];
        if (!spec || spec.level >= spec.maxLevel) return null;
        return spec.price * (spec.level + 1);
    }

    // Verificar se pode comprar próximo nível
    canBuyNextLevel(specId) {
        const spec = this.specializations[specId];
        if (!spec || spec.level >= spec.maxLevel) return false;
        const price = spec.price * (spec.level + 1);
        return gameState.money >= price;
    }

    // Obter estatísticas das especializações
    getStats() {
        const totalSpent = Object.values(this.specializations).reduce((sum, spec) => {
            return sum + (spec.price * spec.level);
        }, 0);

        const totalLevels = Object.values(this.specializations).reduce((sum, spec) => {
            return sum + spec.level;
        }, 0);

        const maxPossible = Object.values(this.specializations).reduce((sum, spec) => {
            return sum + spec.maxLevel;
        }, 0);

        return {
            totalSpent,
            totalLevels,
            maxPossible,
            completionPercent: Math.floor((totalLevels / maxPossible) * 100)
        };
    }
}