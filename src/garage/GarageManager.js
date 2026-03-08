// src/garage/GarageManager.js - Gerencia a evolução da garagem

import { StarterGarage } from "./StarterGarage.js";

export class GarageManager {
  constructor(container) {
    console.log("🏢 Inicializando Gerenciador da Garagem...");

    this.container = container;
    this.currentGarage = null;
    this.level = 1;
    this.maxLevel = 5;

    // Preços de upgrade
    this.upgradePrices = {
      2: 5000, // Segundo elevador
      3: 15000, // Terceiro elevador + máquinas
      4: 30000, // Quarto elevador + estante
      5: 50000, // Oficina de pintura + guincho
    };

    // Descrições dos upgrades
    this.upgradeDescriptions = {
      2: "➕ Segundo elevador + Máquina de pneus",
      3: "➕ Terceiro elevador + Computador + Novo armário",
      4: "➕ Quarto elevador + Estante de peças + Área de teste",
      5: "➕ Oficina de pintura + Guincho de motor + Decorações",
    };

    // Benefícios por nível
    this.levelBenefits = {
      1: {
        lifts: 1,
        workbenches: 1,
        cabinets: 1,
        tireMachine: false,
        computer: false,
        storage: false,
        paintBooth: false,
        engineCrane: false,
        testArea: false,
      },
      2: {
        lifts: 2,
        workbenches: 2,
        cabinets: 1,
        tireMachine: true,
        computer: false,
        storage: false,
        paintBooth: false,
        engineCrane: false,
        testArea: false,
      },
      3: {
        lifts: 3,
        workbenches: 2,
        cabinets: 2,
        tireMachine: true,
        computer: true,
        storage: false,
        paintBooth: false,
        engineCrane: false,
        testArea: false,
      },
      4: {
        lifts: 4,
        workbenches: 2,
        cabinets: 2,
        tireMachine: true,
        computer: true,
        storage: true,
        paintBooth: false,
        engineCrane: false,
        testArea: true,
      },
      5: {
        lifts: 4,
        workbenches: 2,
        cabinets: 2,
        tireMachine: true,
        computer: true,
        storage: true,
        paintBooth: true,
        engineCrane: true,
        testArea: true,
      },
    };

    this.initializeGarage();
  }

  initializeGarage() {
    this.currentGarage = new StarterGarage(this.container);
    this.currentGarage.level = 1;
  }

  // Verificar se pode fazer upgrade
  canUpgrade() {
    if (this.level >= this.maxLevel) return false;
    const price = this.upgradePrices[this.level + 1];
    return window.gameState && window.gameState.money >= price;
  }

  // Realizar upgrade
  upgrade() {
    if (!this.canUpgrade()) {
      return {
        success: false,
        message: "💰 Dinheiro insuficiente ou nível máximo",
      };
    }

    const nextLevel = this.level + 1;
    const price = this.upgradePrices[nextLevel];

    // Aplicar upgrade no estado do jogo
    window.gameState.money -= price;

    // Aplicar upgrade na garagem
    switch (nextLevel) {
      case 2:
        this.currentGarage.upgradeToLevel2();
        break;
      case 3:
        this.currentGarage.upgradeToLevel3();
        break;
      case 4:
        this.currentGarage.upgradeToLevel4();
        break;
      case 5:
        this.currentGarage.upgradeToLevel5();
        break;
    }

    this.level = nextLevel;

    // Registrar conquista
    if (
      window.achievementSystem &&
      typeof window.achievementSystem.checkAchievement === "function"
    ) {
      try {
        // Passar o ID correto da conquista
        window.achievementSystem.checkAchievement(`garageLevel${nextLevel}`);
        // OU usar o método checkAchievement com tipo
        // window.achievementSystem.checkAchievement('garageUpgraded', nextLevel);
      } catch (e) {
        console.log("⚠️ Erro ao registrar conquista:", e);
      }
    }

    return {
      success: true,
      message: `🏢 Garagem expandida para Nível ${nextLevel}!`,
      level: nextLevel,
      price: price,
      benefits: this.levelBenefits[nextLevel],
    };
  }

  // Obter benefícios atuais
  getCurrentBenefits() {
    return this.levelBenefits[this.level];
  }

  // Obter próximo upgrade
  getNextUpgrade() {
    if (this.level >= this.maxLevel) return null;

    return {
      level: this.level + 1,
      price: this.upgradePrices[this.level + 1],
      description: this.upgradeDescriptions[this.level + 1],
      benefits: this.levelBenefits[this.level + 1],
    };
  }

  // Obter estatísticas
  getStats() {
    return {
      level: this.level,
      maxLevel: this.maxLevel,
      benefits: this.getCurrentBenefits(),
      nextUpgrade: this.getNextUpgrade(),
    };
  }

  // Verificar se tem equipamento específico
  hasEquipment(equipment) {
    const benefits = this.getCurrentBenefits();
    return benefits[equipment] || false;
  }

  // Quantidade de elevadores
  getLiftCount() {
    return this.getCurrentBenefits().lifts;
  }

  // Posição do elevador disponível
  getAvailableLiftPosition(index) {
    const liftPositions = [
      [0, 0, 0], // Elevador 1 (centro)
      [4, 0, 2], // Elevador 2
      [-3, 0, 3], // Elevador 3
      [3, 0, -2], // Elevador 4
    ];

    if (index < this.getLiftCount()) {
      return liftPositions[index];
    }
    return liftPositions[0];
  }
}
