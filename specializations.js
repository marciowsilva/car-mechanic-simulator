// specializations.js - SISTEMA DE ESPECIALIZAÇÕES OTIMIZADO

export const SPECIALIZATIONS = {
    engine: { id: 'engine', name: 'Especialista em Motor', desc: 'Reparos no motor são 20% mais eficientes', parts: ['motor'], bonus: 0.2, price: 2000, icon: '⚙️', level: 0, maxLevel: 3 },
    electric: { id: 'electric', name: 'Especialista em Elétrica', desc: 'Reparos elétricos são 20% mais eficientes', parts: ['bateria', 'alternador'], bonus: 0.2, price: 2000, icon: '⚡', level: 0, maxLevel: 3 },
    suspension: { id: 'suspension', name: 'Especialista em Suspensão', desc: 'Reparos em suspensão e freios são 20% mais eficientes', parts: ['suspensao', 'freios'], bonus: 0.2, price: 2000, icon: '🔧', level: 0, maxLevel: 3 },
    transmission: { id: 'transmission', name: 'Especialista em Transmissão', desc: 'Reparos na transmissão são 20% mais eficientes', parts: ['transmissao'], bonus: 0.2, price: 2000, icon: '🔄', level: 0, maxLevel: 3 },
    cooling: { id: 'cooling', name: 'Especialista em Arrefecimento', desc: 'Reparos no radiador são 20% mais eficientes', parts: ['radiador'], bonus: 0.2, price: 2000, icon: '💧', level: 0, maxLevel: 3 },
    exhaust: { id: 'exhaust', name: 'Especialista em Escape', desc: 'Reparos no escapamento são 20% mais eficientes', parts: ['escapamento'], bonus: 0.2, price: 2000, icon: '💨', level: 0, maxLevel: 3 }
};

export class SpecializationSystem {
    constructor() {
        this.specializations = JSON.parse(JSON.stringify(SPECIALIZATIONS));
        this.activeBonuses = {};
        this.updateBonuses();
    }

    buySpecialization(specId) {
        const spec = this.specializations[specId];
        if (!spec) return { success: false, message: 'Especialização não encontrada' };
        if (spec.level >= spec.maxLevel) return { success: false, message: '⚠️ Nível máximo atingido!' };

        const price = spec.price * (spec.level + 1);
        if (gameState.money < price) return { success: false, message: '💰 Dinheiro insuficiente!' };

        gameState.updateMoney(-price);
        spec.level++;
        this.updateBonuses();
        return { success: true, message: `✅ ${spec.name} nível ${spec.level}!` };
    }

    updateBonuses() {
        this.activeBonuses = {};
        Object.values(this.specializations).forEach(spec => {
            if (spec.level > 0) {
                spec.parts.forEach(partName => {
                    this.activeBonuses[partName] = (this.activeBonuses[partName] || 0) + (spec.bonus * spec.level);
                });
            }
        });
    }

    getPartBonus(partName) {
        return this.activeBonuses[partName] || 0;
    }

    calculateRepairEfficiency(baseEfficiency, partName) {
        return Math.floor(baseEfficiency * (1 + this.getPartBonus(partName)));
    }

    getNextLevelPrice(specId) {
        const spec = this.specializations[specId];
        if (!spec || spec.level >= spec.maxLevel) return null;
        return spec.price * (spec.level + 1);
    }

    getStats() {
        const totalLevels = Object.values(this.specializations).reduce((sum, s) => sum + s.level, 0);
        const maxPossible = Object.values(this.specializations).reduce((sum, s) => sum + s.maxLevel, 0);
        const totalSpent = Object.values(this.specializations).reduce((sum, s) => sum + (s.price * s.level), 0);

        return { totalSpent, totalLevels, maxPossible, completionPercent: Math.floor((totalLevels / maxPossible) * 100) };
    }
}