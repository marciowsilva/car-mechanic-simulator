// src/systems/EquipmentInteractionSystem.js - Sistema de interação com equipamentos

import {
  GarageEquipment,
  OperatingCosts,
  getUnlockedEquipment,
} from "/src/garage/GarageEquipment.js";
import { MinigameManager } from "/src/minigames/MinigameManager.js";

export class EquipmentInteractionSystem {
  constructor(garageExpansion) {
    this.garage = garageExpansion;
    this.activeEquipment = null;
    this.minigameActive = false;
    this.minigameManager = new MinigameManager();
    this.listeners = new Map();
    console.log("🔧 Sistema de interação com equipamentos inicializado");
  }

  // Interagir com equipamento
  interactWithEquipment(equipmentId) {
    const equipment = GarageEquipment[equipmentId];
    if (!equipment) {
      return { success: false, message: "❌ Equipamento não encontrado" };
    }

    // Verificar nível da garagem
    if (this.garage.level < equipment.unlockLevel) {
      return {
        success: false,
        message: `🔒 Necessário nível ${equipment.unlockLevel} da garagem`,
        requiredLevel: equipment.unlockLevel,
      };
    }

    // Verificar se tem minigame
    if (equipment.minigame) {
      this.startMinigame(equipment);
    }

    this.activeEquipment = equipment;

    // Disparar evento
    this.emit("equipmentUsed", equipment);

    return {
      success: true,
      message: `🔧 Usando ${equipment.name}`,
      equipment: equipment,
    };
  }

  // Iniciar minigame
  startMinigame(equipment) {
    this.minigameActive = true;

    let gameType = null;
    let difficulty = this.calculateDifficulty(equipment);

    switch (equipment.id) {
      case "wheelBalancer":
        gameType = "wheelBalancer";
        break;
      case "oilDrain":
        gameType = "oilDrain";
        break;
      // Adicionar outros minigames aqui
    }

    if (gameType) {
      this.minigameManager.startGame(gameType, difficulty);
    }

    this.emit("minigameStarted", { equipment, difficulty });
  }

  // Completar minigame
  completeMinigame(equipment, successRate) {
    if (!this.minigameActive) return;

    this.minigameActive = false;

    const success = Math.random() < successRate;
    const timeBonus = success ? Math.floor(Math.random() * 200) : 0;

    const result = {
      success: success,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      timeBonus: timeBonus,
      experienceGained: success ? 50 + timeBonus : 10,
      moneyGained: success ? 100 + timeBonus : 0,
    };

    // Aplicar recompensas
    if (result.success && window.gameState) {
      window.gameState.money += result.moneyGained;
      window.gameState.addExperience(result.experienceGained);
    }

    this.emit("minigameCompleted", result);

    return result;
  }

  // Calcular dificuldade baseada no nível do jogador
  calculateDifficulty(equipment) {
    const playerLevel = window.gameState?.level || 1;
    const baseDifficulty = equipment.unlockLevel * 0.5;
    return Math.max(0.1, Math.min(0.9, baseDifficulty / playerLevel));
  }

  // Usar dreno de óleo (com chance de multa)
  useOilDrain() {
    const equipment = GarageEquipment.oilDrain;

    // Verificar nível
    if (this.garage.level < equipment.unlockLevel) {
      return { success: false, message: "🔒 Dreno não disponível" };
    }

    // Chance de derramar óleo (20% se nível baixo, 5% se alto)
    const spillChance = Math.max(0.05, 0.2 - this.garage.level * 0.03);
    const spilled = Math.random() < spillChance;

    const cost = spilled
      ? OperatingCosts.oilDrain.spillPenalty
      : OperatingCosts.oilDrain.disposalCost;

    if (window.gameState && window.gameState.money >= cost) {
      window.gameState.money -= cost;

      this.emit("oilDrainUsed", { spilled, cost });

      return {
        success: true,
        message: spilled
          ? "⚠️ Você derramou óleo! Multa de R$ 100"
          : "✅ Óleo descartado corretamente",
        cost: cost,
        spilled: spilled,
      };
    }

    return { success: false, message: "💰 Dinheiro insuficiente" };
  }

  // Usar pista de teste
  useTestPath(carParts) {
    const equipment = GarageEquipment.testPath;

    if (this.garage.level < equipment.unlockLevel) {
      return { success: false, message: "🔒 Pista de teste não disponível" };
    }

    // Análise dos resultados do teste
    const results = {
      suspension: this.analyzeSuspension(carParts),
      brakes: this.analyzeBrakes(carParts),
      alignment: this.analyzeAlignment(carParts),
      overall: 0,
    };

    results.overall = Math.floor(
      (results.suspension + results.brakes + results.alignment) / 3,
    );

    // Custo do teste
    const cost = OperatingCosts.testPath.usageCost;
    if (window.gameState) {
      window.gameState.money -= cost;
    }

    this.emit("testCompleted", results);

    return {
      success: true,
      message: `🏁 Teste concluído: ${results.overall}% de aprovação`,
      results: results,
      cost: cost,
    };
  }

  analyzeSuspension(parts) {
    if (!parts.suspensao) return 50;
    return Math.min(100, parts.suspensao.condition + 10);
  }

  analyzeBrakes(parts) {
    if (!parts.freios) return 50;
    return Math.min(100, parts.freios.condition + 10);
  }

  analyzeAlignment(parts) {
    // Simulação simples
    return Math.floor(60 + Math.random() * 30);
  }

  // Usar oficina de pintura
  usePaintShop(currentColor, newColor) {
    const equipment = GarageEquipment.paintShop;

    if (this.garage.level < equipment.unlockLevel) {
      return {
        success: false,
        message: "🔒 Oficina de pintura não disponível",
      };
    }

    if (!equipment.paintJobs.includes(newColor)) {
      return { success: false, message: "❌ Cor não disponível" };
    }

    const cost = OperatingCosts.paintShop.baseCost;

    if (window.gameState && window.gameState.money >= cost) {
      window.gameState.money -= cost;

      this.emit("paintJobDone", { oldColor: currentColor, newColor, cost });

      return {
        success: true,
        message: `🎨 Carro pintado de ${newColor}!`,
        newColor: newColor,
        cost: cost,
      };
    }

    return { success: false, message: "💰 Dinheiro insuficiente" };
  }

  // Sistema de eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  // Obter estatísticas de uso
  getUsageStats() {
    return {
      activeEquipment: this.activeEquipment?.name || null,
      minigameActive: this.minigameActive,
      unlockedCount: getUnlockedEquipment(this.garage.level).length,
      totalEquipment: Object.keys(GarageEquipment).length,
    };
  }
}
