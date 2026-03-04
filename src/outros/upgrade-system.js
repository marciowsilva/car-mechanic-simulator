// upgrade-system.js
import { TOOL_BASE_STATS } from './constants.js';
import { gameState } from './game.js';

export class UpgradeSystem {
    constructor() {
        this.toolLevels = {
            wrench: 1,
            screwdriver: 1,
            hammer: 1,
            welder: 1
        };
        
        this.workshopUpgrades = {
            toolRack: { level: 0, maxLevel: 3, price: 1000, name: 'Suporte de Ferramentas', desc: 'Reduz custo de reparo em 5% por nível' },
            partsStorage: { level: 0, maxLevel: 3, price: 1500, name: 'Estoque de Peças', desc: 'Peças novas 10% mais baratas' },
            diagnosticComputer: { level: 0, maxLevel: 2, price: 2000, name: 'Computador Diagnóstico', desc: 'Mostra informações detalhadas das peças' }
        };
        
        this.skillUpgrades = {
            experience: { level: 0, maxLevel: 5, price: 800, name: 'Aprendizado Rápido', desc: '+10% de experiência ganha' },
            efficiency: { level: 0, maxLevel: 5, price: 1000, name: 'Eficiência', desc: 'Reparos 5% mais eficientes' },
            negotiation: { level: 0, maxLevel: 3, price: 1200, name: 'Negociação', desc: 'Pagamentos 10% maiores' }
        };
    }
    
    getToolStats(toolId) {
        const base = TOOL_BASE_STATS[toolId];
        const level = this.toolLevels[toolId] || 1;
        
        return {
            ...base,
            repair: Math.floor(base.baseRepair * (1 + (level - 1) * 0.2)),
            cost: Math.floor(base.baseCost * (1 + (level - 1) * 0.1)),
            level: level
        };
    }
    
    upgradeTool(toolId) {
        if (this.toolLevels[toolId] >= 5) return false;
        
        const currentLevel = this.toolLevels[toolId];
        const price = 500 * currentLevel;
        
        if (gameState.money >= price) {
            gameState.updateMoney(-price);
            this.toolLevels[toolId]++;
            return true;
        }
        return false;
    }
    
    upgradeWorkshop(upgradeId) {
        const upgrade = this.workshopUpgrades[upgradeId];
        if (!upgrade || upgrade.level >= upgrade.maxLevel) return false;
        
        const price = upgrade.price * (upgrade.level + 1);
        
        if (gameState.money >= price) {
            gameState.updateMoney(-price);
            upgrade.level++;
            return true;
        }
        return false;
    }
    
    upgradeSkill(skillId) {
        const skill = this.skillUpgrades[skillId];
        if (!skill || skill.level >= skill.maxLevel) return false;
        
        const price = skill.price * (skill.level + 1);
        
        if (gameState.money >= price) {
            gameState.updateMoney(-price);
            skill.level++;
            return true;
        }
        return false;
    }
    
    calculatePartPrice(basePrice) {
        const storageLevel = this.workshopUpgrades.partsStorage.level;
        const discount = storageLevel * 0.1;
        return Math.floor(basePrice * (1 - discount));
    }
    
    calculateRepairCost(baseCost) {
        const rackLevel = this.workshopUpgrades.toolRack.level;
        const discount = rackLevel * 0.05;
        return Math.floor(baseCost * (1 - discount));
    }
    
    calculatePayment(basePayment) {
        const negotiationLevel = this.skillUpgrades.negotiation.level;
        const bonus = negotiationLevel * 0.1;
        return Math.floor(basePayment * (1 + bonus));
    }
    
    calculateExperience(baseExp) {
        const expLevel = this.skillUpgrades.experience.level;
        const bonus = expLevel * 0.1;
        return Math.floor(baseExp * (1 + bonus));
    }
    
    calculateRepairEfficiency(baseRepair) {
        const efficiencyLevel = this.skillUpgrades.efficiency.level;
        const bonus = efficiencyLevel * 0.05;
        return Math.floor(baseRepair * (1 + bonus));
    }
}