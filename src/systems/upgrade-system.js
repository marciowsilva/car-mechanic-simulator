// src/systems/upgrade-system.js - VERSÃO MÍNIMA

export class UpgradeSystem {
    constructor() {
        console.log('🔧 UpgradeSystem (mínimo) inicializado');
        this.toolLevels = { wrench: 1, screwdriver: 1, hammer: 1, welder: 1 };
        this.workshopUpgrades = {};
        this.skillUpgrades = {};
    }
    
    getToolStats(toolId) {
        return { repair: 10, cost: 50, level: 1 };
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.UpgradeSystem = UpgradeSystem;
    console.log('🌐 UpgradeSystem disponível globalmente');
}
