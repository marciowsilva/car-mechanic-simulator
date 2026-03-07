// src/systems/UpgradeManager.js - Sistema completo de upgrades

export class UpgradeManager {
    constructor() {
        console.log('🔧 Inicializando UpgradeManager...');
        
        // Níveis das ferramentas (1-5)
        this.toolLevels = {
            wrench: 1,
            screwdriver: 1,
            hammer: 1,
            welder: 1,
            diagnostic: 1
        };
        
        // Upgrades da oficina
        this.garageUpgrades = {
            liftSpeed: { 
                level: 1, 
                maxLevel: 5, 
                basePrice: 1000, 
                name: "Velocidade do Elevador",
                description: "Aumenta a velocidade dos reparos",
                icon: "⬆️",
                effect: (level) => level * 10 // +10% por nível
            },
            partsDiscount: { 
                level: 1, 
                maxLevel: 5, 
                basePrice: 1500, 
                name: "Desconto em Peças",
                description: "Peças mais baratas na loja",
                icon: "💰",
                effect: (level) => level * 5 // 5% de desconto por nível
            },
            diagnosticPrecision: { 
                level: 1, 
                maxLevel: 5, 
                basePrice: 2000, 
                name: "Precisão de Diagnóstico",
                description: "Identifica problemas com mais precisão",
                icon: "🔍",
                effect: (level) => level * 10 // +10% precisão por nível
            },
            experienceBoost: { 
                level: 1, 
                maxLevel: 5, 
                basePrice: 1200, 
                name: "Bônus de Experiência",
                description: "Ganha mais experiência em reparos",
                icon: "⭐",
                effect: (level) => level * 5 // +5% XP por nível
            }
        };
        
        // Preços base
        this.toolBasePrice = 500;
    }

    // Calcular preço do upgrade da ferramenta
    getToolUpgradePrice(toolId) {
        const currentLevel = this.toolLevels[toolId] || 1;
        if (currentLevel >= 5) return null;
        return this.toolBasePrice * currentLevel;
    }

    // Calcular preço do upgrade da garagem
    getGarageUpgradePrice(upgradeId) {
        const upgrade = this.garageUpgrades[upgradeId];
        if (!upgrade || upgrade.level >= upgrade.maxLevel) return null;
        return upgrade.basePrice * upgrade.level;
    }

    // Upgradar ferramenta
    upgradeTool(toolId) {
        if (!this.toolLevels[toolId]) {
            return { success: false, message: "❌ Ferramenta inválida" };
        }
        
        const currentLevel = this.toolLevels[toolId];
        if (currentLevel >= 5) {
            return { success: false, message: "⚠️ Nível máximo atingido" };
        }
        
        const price = this.getToolUpgradePrice(toolId);
        
        if (window.gameState && window.gameState.money >= price) {
            window.gameState.money -= price;
            this.toolLevels[toolId]++;
            
            // Registrar no sistema de conquistas
            if (currentLevel === 4) {
                window.achievementSystem?.unlockAchievement?.('masterMechanic');
            }
            
            return { 
                success: true, 
                message: `🔧 ${this.getToolName(toolId)} nível ${this.toolLevels[toolId]}!`,
                price: price
            };
        }
        
        return { success: false, message: "💰 Dinheiro insuficiente" };
    }

    // Upgradar garagem
    upgradeGarage(upgradeId) {
        if (!this.garageUpgrades[upgradeId]) {
            return { success: false, message: "❌ Upgrade inválido" };
        }
        
        const upgrade = this.garageUpgrades[upgradeId];
        if (upgrade.level >= upgrade.maxLevel) {
            return { success: false, message: "⚠️ Nível máximo atingido" };
        }
        
        const price = this.getGarageUpgradePrice(upgradeId);
        
        if (window.gameState && window.gameState.money >= price) {
            window.gameState.money -= price;
            upgrade.level++;
            
            return { 
                success: true, 
                message: `🏢 ${upgrade.name} nível ${upgrade.level}!`,
                price: price
            };
        }
        
        return { success: false, message: "💰 Dinheiro insuficiente" };
    }

    // Calcular eficiência da ferramenta
    getToolEfficiency(toolId) {
        const level = this.toolLevels[toolId] || 1;
        const baseRepair = {
            wrench: 10,
            screwdriver: 5,
            hammer: 15,
            welder: 25,
            diagnostic: 0
        };
        
        const baseCost = {
            wrench: 5,
            screwdriver: 3,
            hammer: 8,
            welder: 12,
            diagnostic: 0
        };
        
        // Bônus por nível: +2 de reparo e +1 de custo por nível
        const repairBonus = (level - 1) * 2;
        const costBonus = (level - 1);
        
        return {
            repairAmount: baseRepair[toolId] + repairBonus,
            cost: baseCost[toolId] + costBonus,
            level: level
        };
    }

    // Calcular desconto em peças
    getPartsDiscount() {
        const level = this.garageUpgrades.partsDiscount.level;
        return level * 5; // 5%, 10%, 15%, 20%, 25%
    }

    // Calcular bônus de experiência
    getExperienceBonus() {
        const level = this.garageUpgrades.experienceBoost.level;
        return level * 5; // 5%, 10%, 15%, 20%, 25%
    }

    // Calcular bônus de diagnóstico
    getDiagnosticBonus() {
        const level = this.garageUpgrades.diagnosticPrecision.level;
        return level * 10; // 10%, 20%, 30%, 40%, 50%
    }

    // Calcular velocidade de reparo
    getRepairSpeed() {
        const level = this.garageUpgrades.liftSpeed.level;
        return level * 10; // +10% velocidade por nível
    }

    // Aplicar desconto em peça
    applyPartsDiscount(price) {
        const discount = this.getPartsDiscount() / 100;
        return Math.floor(price * (1 - discount));
    }

    // Aplicar bônus de experiência
    applyExperienceBonus(baseExp) {
        const bonus = this.getExperienceBonus() / 100;
        return Math.floor(baseExp * (1 + bonus));
    }

    // Obter nome da ferramenta
    getToolName(toolId) {
        const names = {
            wrench: "Chave Inglesa",
            screwdriver: "Chave de Fenda",
            hammer: "Martelo",
            welder: "Maçarico",
            diagnostic: "Diagnóstico"
        };
        return names[toolId] || toolId;
    }

    // Obter estatísticas completas
    getStats() {
        const tools = {};
        Object.keys(this.toolLevels).forEach(toolId => {
            tools[toolId] = {
                level: this.toolLevels[toolId],
                efficiency: this.getToolEfficiency(toolId),
                nextPrice: this.getToolUpgradePrice(toolId)
            };
        });
        
        const garage = {};
        Object.keys(this.garageUpgrades).forEach(upgradeId => {
            const ug = this.garageUpgrades[upgradeId];
            garage[upgradeId] = {
                level: ug.level,
                maxLevel: ug.maxLevel,
                name: ug.name,
                description: ug.description,
                icon: ug.icon,
                effect: ug.effect(ug.level),
                nextPrice: this.getGarageUpgradePrice(upgradeId)
            };
        });
        
        return {
            tools,
            garage,
            partsDiscount: this.getPartsDiscount(),
            experienceBonus: this.getExperienceBonus(),
            diagnosticBonus: this.getDiagnosticBonus(),
            repairSpeed: this.getRepairSpeed()
        };
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.UpgradeManager = UpgradeManager;
    console.log('🌐 UpgradeManager disponível globalmente');
}