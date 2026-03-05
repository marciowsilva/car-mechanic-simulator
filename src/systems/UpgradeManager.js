// src/systems/UpgradeManager.js - Gerencia upgrades de ferramentas e oficina

export class UpgradeManager {
    constructor() {
        console.log('🔧 Inicializando UpgradeManager...');
        
        // Níveis das ferramentas
        this.toolLevels = {
            wrench: 1,
            screwdriver: 1,
            hammer: 1,
            welder: 1,
            diagnostic: 1
        };
        
        // Upgrades da oficina
        this.garageUpgrades = {
            liftSpeed: { level: 1, maxLevel: 5, price: 1000, name: "Velocidade do Elevador" },
            partsDiscount: { level: 1, maxLevel: 5, price: 1500, name: "Desconto em Peças" },
            diagnosticPrecision: { level: 1, maxLevel: 5, price: 2000, name: "Precisão de Diagnóstico" }
        };
        
        // Preços de upgrade
        this.upgradePrices = {
            tool: [500, 1000, 2000, 4000, 8000],
            garage: [1000, 2000, 4000, 8000, 16000]
        };
    }

    // Calcular eficiência da ferramenta
    getToolEfficiency(toolId) {
        const level = this.toolLevels[toolId] || 1;
        return {
            repairAmount: 5 + (level * 5), // 10, 15, 20, 25, 30
            cost: 20 + (level * 10) // 30, 40, 50, 60, 70
        };
    }

    // Upgradar ferramenta
    upgradeTool(toolId) {
        if (!this.toolLevels[toolId]) return { success: false, message: "Ferramenta inválida" };
        
        const currentLevel = this.toolLevels[toolId];
        if (currentLevel >= 5) return { success: false, message: "Nível máximo atingido" };
        
        const price = this.upgradePrices.tool[currentLevel - 1];
        
        if (window.gameState && window.gameState.money >= price) {
            window.gameState.money -= price;
            this.toolLevels[toolId]++;
            
            return { 
                success: true, 
                message: `🔧 ${toolId} upgraded para nível ${this.toolLevels[toolId]}!`,
                price: price
            };
        }
        
        return { success: false, message: "💰 Dinheiro insuficiente" };
    }

    // Upgradar garagem
    upgradeGarage(upgradeId) {
        if (!this.garageUpgrades[upgradeId]) return { success: false, message: "Upgrade inválido" };
        
        const upgrade = this.garageUpgrades[upgradeId];
        if (upgrade.level >= upgrade.maxLevel) return { success: false, message: "Nível máximo atingido" };
        
        const price = this.upgradePrices.garage[upgrade.level - 1];
        
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

    // Calcular desconto em peças
    getPartsDiscount() {
        return this.garageUpgrades.partsDiscount.level * 5; // 5%, 10%, 15%, 20%, 25%
    }

    // Calcular bônus de diagnóstico
    getDiagnosticBonus() {
        return this.garageUpgrades.diagnosticPrecision.level * 10; // 10%, 20%, 30%, 40%, 50%
    }

    // Obter estatísticas
    getStats() {
        return {
            toolLevels: { ...this.toolLevels },
            garageUpgrades: { ...this.garageUpgrades },
            partsDiscount: this.getPartsDiscount(),
            diagnosticBonus: this.getDiagnosticBonus()
        };
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.UpgradeManager = UpgradeManager;
}