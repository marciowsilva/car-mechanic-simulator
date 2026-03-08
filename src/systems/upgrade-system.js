// src/systems/upgrade-system.js - Sistema de upgrades completo

export class UpgradeSystem {
  constructor() {
    console.log("🔧 Inicializando UpgradeSystem...");

    // Níveis das ferramentas
    this.toolLevels = {
      wrench: 1,
      screwdriver: 1,
      hammer: 1,
      welder: 1,
      diagnostic: 1,
    };

    // Upgrades da oficina
    this.workshopUpgrades = {
      toolRack: {
        level: 1,
        maxLevel: 5,
        price: 1000,
        name: "Suporte de Ferramentas",
        desc: "Reduz custo de reparo em 5% por nível",
      },
      partsStorage: {
        level: 1,
        maxLevel: 5,
        price: 1500,
        name: "Estoque de Peças",
        desc: "Peças novas 10% mais baratas",
      },
      diagnosticComputer: {
        level: 1,
        maxLevel: 5,
        price: 2000,
        name: "Computador Diagnóstico",
        desc: "+10% precisão por nível",
      },
    };

    // Upgrades de habilidades
    this.skillUpgrades = {
      experience: {
        level: 1,
        maxLevel: 5,
        price: 800,
        name: "Aprendizado Rápido",
        desc: "+10% de experiência ganha",
      },
      efficiency: {
        level: 1,
        maxLevel: 5,
        price: 1000,
        name: "Eficiência",
        desc: "Reparos 5% mais eficientes",
      },
      negotiation: {
        level: 1,
        maxLevel: 5,
        price: 1200,
        name: "Negociação",
        desc: "Pagamentos 10% maiores",
      },
    };
  }

  // ===== MÉTODOS DE CÁLCULO =====

  // Calcular experiência com bônus (MÉTODO QUE ESTAVA FALTANDO)
  calculateExperience(baseExp) {
    // Garantir que baseExp é número
    const validExp = Number(baseExp) || 0;
    const expLevel = this.skillUpgrades.experience.level || 1;
    const bonus = Math.max(0, (expLevel - 1) * 0.1);
    return Math.floor(validExp * (1 + bonus));
  }

  // Calcular preço de peça com desconto
  calculatePartPrice(basePrice) {
    const validPrice = Number(basePrice) || 0;
    const storageLevel = this.workshopUpgrades.partsStorage.level || 1;
    const discount = Math.min(0.5, Math.max(0, (storageLevel - 1) * 0.1));
    return Math.floor(validPrice * (1 - discount));
  }

  // Calcular custo de reparo com desconto
  calculateRepairCost(baseCost) {
    const validCost = Number(baseCost) || 0;
    const rackLevel = this.workshopUpgrades.toolRack.level || 1;
    const discount = Math.min(0.25, Math.max(0, (rackLevel - 1) * 0.05));
    return Math.floor(validCost * (1 - discount));
  }

  // Calcular pagamento com bônus
  calculatePayment(basePayment) {
    const validPayment = Number(basePayment) || 0;
    const negotiationLevel = this.skillUpgrades.negotiation.level || 1;
    const bonus = Math.max(0, (negotiationLevel - 1) * 0.1);
    return Math.floor(validPayment * (1 + bonus));
  }

  // Calcular eficiência de reparo
  calculateRepairEfficiency(baseEfficiency) {
    const efficiencyLevel = this.skillUpgrades.efficiency.level || 1;
    const bonus = (efficiencyLevel - 1) * 0.05; // 5% por nível acima de 1
    return Math.floor(baseEfficiency * (1 + bonus));
  }

  // ===== MÉTODOS DE ESTATÍSTICAS DAS FERRAMENTAS =====

  getToolStats(toolId) {
    const level = this.toolLevels[toolId] || 1;
    const baseRepair =
      {
        wrench: 10,
        screwdriver: 5,
        hammer: 15,
        welder: 25,
        diagnostic: 0,
      }[toolId] || 10;

    const baseCost =
      {
        wrench: 5,
        screwdriver: 3,
        hammer: 8,
        welder: 12,
        diagnostic: 0,
      }[toolId] || 5;

    // Bônus por nível: +2 reparo e +1 custo por nível acima de 1
    const repairBonus = (level - 1) * 2;
    const costBonus = level - 1;

    return {
      repair: baseRepair + repairBonus,
      cost: baseCost + costBonus,
      level: level,
    };
  }

  // ===== MÉTODOS DE UPGRADE =====

  upgradeTool(toolId) {
    if (!this.toolLevels[toolId]) return false;
    if (this.toolLevels[toolId] >= 5) return false;

    const currentLevel = this.toolLevels[toolId];
    const price = 500 * currentLevel;

    if (window.gameState && window.gameState.money >= price) {
      window.gameState.money -= price;
      this.toolLevels[toolId]++;
      return true;
    }
    return false;
  }

  upgradeWorkshop(upgradeId) {
    const upgrade = this.workshopUpgrades[upgradeId];
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return false;

    const price = upgrade.price * upgrade.level;

    if (window.gameState && window.gameState.money >= price) {
      window.gameState.money -= price;
      upgrade.level++;
      return true;
    }
    return false;
  }

  upgradeSkill(skillId) {
    const skill = this.skillUpgrades[skillId];
    if (!skill || skill.level >= skill.maxLevel) return false;

    const price = skill.price * skill.level;

    if (window.gameState && window.gameState.money >= price) {
      window.gameState.money -= price;
      skill.level++;
      return true;
    }
    return false;
  }

  // ===== MÉTODOS DE UTILIDADE =====

  getToolName(toolId) {
    const names = {
      wrench: "Chave Inglesa",
      screwdriver: "Chave de Fenda",
      hammer: "Martelo",
      welder: "Maçarico",
      diagnostic: "Diagnóstico",
    };
    return names[toolId] || toolId;
  }

  getWorkshopUpgradeName(upgradeId) {
    return this.workshopUpgrades[upgradeId]?.name || upgradeId;
  }

  getSkillName(skillId) {
    return this.skillUpgrades[skillId]?.name || skillId;
  }

  // ===== ESTATÍSTICAS COMPLETAS =====

  getStats() {
    return {
      toolLevels: { ...this.toolLevels },
      workshopUpgrades: { ...this.workshopUpgrades },
      skillUpgrades: { ...this.skillUpgrades },
    };
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.UpgradeSystem = UpgradeSystem;
}
