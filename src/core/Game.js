// src/core/Game.js - ARQUIVO PRINCIPAL COMPLETO COM PROTEÇÃO

import {
  TOOL_BASE_STATS,
  PART_TRANSLATIONS,
  PART_POSITIONS,
} from "/src/utils/constants.js";
import { Database } from "/src/core/Database.js";
import { UpgradeSystem } from "/src/systems/upgrade-system.js";
import { AchievementSystem } from "/src/systems/achievements/AchievementSystem.js";
import { AudioManager } from "/src/systems/audio.js";
import { Inventory } from "/src/systems/Inventory.js";
import { SpecializationSystem } from "/src/systems/specializations.js";
import { GarageSystem } from "/src/garage/Garage.js";
import { CustomerSystem } from "/src/systems/customers/CustomerSystem.js";
import { DailyChallenges } from "/src/systems/challenges/DailyChallenges.js";
import { Job } from "/src/cars/Job.js";
import { CustomerCar } from "/src/cars/Car.js";
import { Scene3D } from "/src/garage/Scene3D.js";
import { UIManager } from "/src/ui/UIManager.js";
import { UsedPartsMarket } from "/src/systems/market/used-parts-market.js";
import { CareerMode } from "/src/systems/career-mode.js";

// ===== ESTADO GLOBAL DO JOGO =====
class GameState {
  constructor() {
    this.money = 5000;
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = 1000;
    this.reputation = 3;
    this.jobsCompleted = 0;
    this.currentJob = null;
    this.currentCar = null;
    this.selectedTool = "wrench";
    this.selectedPart = null;
  }

  updateMoney(amount) {
    this.money += amount;
    const moneyEl = document.getElementById("money");
    if (moneyEl) {
      moneyEl.textContent = `R$ ${this.money.toLocaleString()}`;
    }
    window.achievementSystem?.checkAchievements();
  }

  addExperience(amount) {
    const bonusAmount =
      window.upgradeSystem?.calculateExperience(amount) || amount;
    this.experience += bonusAmount;

    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }

    const levelEl = document.getElementById("level");
    if (levelEl) {
      levelEl.textContent = this.level;
    }
  }

  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    window.uiManager?.showNotification(
      `🎉 Nível ${this.level} alcançado!`,
      "success",
    );
  }

  updateReputation(change) {
    this.reputation = Math.max(1, Math.min(5, this.reputation + change));
    const stars = "★".repeat(this.reputation) + "☆".repeat(5 - this.reputation);
    const repEl = document.getElementById("reputation");
    if (repEl) {
      repEl.textContent = stars;
    }
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  // ===== NOVOS MÉTODOS PARA REPARO =====

  getToolEfficiency(toolType) {
    const tools = {
      wrench: { repair: 10, cost: 5, name: "Chave Inglesa" },
      screwdriver: { repair: 5, cost: 3, name: "Chave de Fenda" },
      hammer: { repair: 15, cost: 8, name: "Martelo" },
      welder: { repair: 25, cost: 12, name: "Maçarico" },
      diagnostic: { repair: 0, cost: 0, name: "Diagnóstico" },
    };
    return tools[toolType] || tools.wrench;
  }

  checkCarReady() {
    if (!this.currentCar || !this.currentCar.parts) {
      return {
        ready: false,
        averageCondition: 0,
        perfectCount: 0,
        totalParts: 0,
      };
    }

    const allParts = Object.values(this.currentCar.parts);
    const totalParts = allParts.length;

    if (totalParts === 0) {
      return {
        ready: false,
        averageCondition: 0,
        perfectCount: 0,
        totalParts: 0,
      };
    }

    let totalCondition = 0;
    allParts.forEach((part) => {
      totalCondition += part.condition || 0;
    });

    const averageCondition = totalCondition / totalParts;
    const perfectCount = allParts.filter(
      (p) => (p.condition || 0) >= 100,
    ).length;

    return {
      ready: averageCondition >= 90,
      averageCondition: Math.round(averageCondition),
      perfectCount,
      totalParts,
    };
  }

  repairPart(partName) {
    if (!this.currentCar || !this.currentCar.parts[partName]) {
      return { success: false, message: "❌ Peça não encontrada" };
    }

    const part = this.currentCar.parts[partName];
    const tool = this.getToolEfficiency(this.selectedTool);

    if (part.condition >= 100) {
      return { success: false, message: "✅ Peça já está em perfeito estado" };
    }

    if (this.money < tool.cost) {
      return { success: false, message: "💰 Dinheiro insuficiente" };
    }

    const oldCondition = part.condition;
    part.condition = Math.min(100, part.condition + tool.repair);
    this.money -= tool.cost;
    this.addExperience(5);

    const repairedAmount = Math.round(part.condition - oldCondition);

    this.updateMoney();

    return {
      success: true,
      message: `🔧 Reparou ${repairedAmount}% com ${tool.name}`,
      repairedAmount,
      partName,
      newCondition: part.condition,
    };
  }

  buyNewPart(partName) {
    if (!this.currentCar || !this.currentCar.parts[partName]) {
      return { success: false, message: "❌ Peça não encontrada" };
    }

    const part = this.currentCar.parts[partName];
    const partPrice = 500;

    if (this.money < partPrice) {
      return { success: false, message: "💰 Dinheiro insuficiente" };
    }

    part.condition = 100;
    this.money -= partPrice;
    this.addExperience(20);

    this.updateMoney();

    return {
      success: true,
      message: `🛒 Peça nova instalada!`,
      partName,
      newCondition: 100,
    };
  }
}

// ===== CRIAÇÃO DAS INSTÂNCIAS =====
const gameState = new GameState();
const upgradeSystem = new UpgradeSystem();
const achievementSystem = new AchievementSystem();
const db = new Database();
const audioManager = new AudioManager();
const inventory = new Inventory();
const specializationSystem = new SpecializationSystem();
const garageSystem = new GarageSystem();
const customerSystem = new CustomerSystem();
const dailyChallenges = new DailyChallenges();
let scene3D;
let uiManager;
const usedPartsMarket = new UsedPartsMarket();
const careerMode = new CareerMode();

Object.defineProperty(window, "scene3D", {
  set: (value) => {
    scene3D = value;
    window._scene3D = value;
  },
  get: () => window._scene3D || scene3D,
});

Object.defineProperty(window, "uiManager", {
  set: (value) => {
    uiManager = value;
    window._uiManager = value;
  },
  get: () => window._uiManager || uiManager,
});

// ===== FUNÇÕES GLOBAIS =====

// ===== FUNÇÕES GLOBAIS PARA REPARO =====

window.repairPart = (partName) => {
  if (!window.gameState) {
    window.uiManager?.showNotification("❌ Jogo não inicializado", "error");
    return;
  }

  const result = window.gameState.repairPart(partName);

  if (result.success) {
    window.uiManager?.showNotification(result.message, "success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();

    window.createRepairEffect?.(partName);

    const status = window.gameState.checkCarReady();
    if (status.ready) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification(
        "🎉 Carro pronto para entrega!",
        "success",
      );
    }
  } else {
    window.uiManager?.showNotification(result.message, "error");
  }
};

window.buyNewPart = (partName) => {
  if (!window.gameState) {
    window.uiManager?.showNotification("❌ Jogo não inicializado", "error");
    return;
  }

  const result = window.gameState.buyNewPart(partName);

  if (result.success) {
    window.uiManager?.showNotification(result.message, "success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();

    for (let i = 0; i < 3; i++) {
      setTimeout(() => window.createRepairEffect?.(partName), i * 200);
    }

    const status = window.gameState.checkCarReady();
    if (status.ready) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification(
        "🎉 Carro pronto para entrega!",
        "success",
      );
    }
  } else {
    window.uiManager?.showNotification(result.message, "error");
  }
};

window.selectPart = (partName) => {
  if (window.gameState) {
    window.gameState.selectedPart = partName;
    window.uiManager?.updatePartsList();
    window.uiManager?.showNotification(
      `🔧 Peça selecionada: ${partName}`,
      "info",
    );
  }
};

window.createRepairEffect = (partName) => {
  if (!window.scene3D || !window.scene3D.createRepairEffect) return;

  // Posições aproximadas das peças
  const positions = {
    motor: [0, 1.0, 1.0],
    transmissao: [0, 0.8, 0],
    freios: [0.5, 0.3, 1.5],
    suspensao: [-0.5, 0.3, 1.0],
    bateria: [0.3, 0.8, 1.2],
    alternador: [-0.3, 0.8, 1.2],
  };

  const pos = positions[partName];
  if (pos) {
    window.scene3D.createRepairEffect(
      new THREE.Vector3(pos[0], pos[1], pos[2]),
    );
  }
};

window.upgradeTool = (toolId) => {
  const price = 500 * upgradeSystem.toolLevels[toolId];
  if (upgradeSystem.upgradeTool(toolId)) {
    window.uiManager?.updateToolDisplay();
    window.uiManager?.updateUpgradeShop();
    window.uiManager?.showNotification(`🔧 Ferramenta upgraded!`, "success");
    dailyChallenges?.onUpgradeBuy(price);
    careerMode?.onToolUpgraded(toolId);
    careerMode?.onMoneySpent(price);
    db.saveUpgrades();
  }
};

window.upgradeWorkshop = (upgradeId) => {
  const upgrade = upgradeSystem.workshopUpgrades[upgradeId];
  const price = upgrade.price * (upgrade.level + 1);
  if (upgradeSystem.upgradeWorkshop(upgradeId)) {
    window.uiManager?.updateUpgradeShop();
    window.uiManager?.showNotification("🏢 Upgrade da oficina!", "success");
    dailyChallenges?.onUpgradeBuy(price);
    careerMode?.onToolUpgraded(toolId);
    careerMode?.onMoneySpent(price);
    db.saveUpgrades();
  }
};

window.upgradeSkill = (skillId) => {
  const skill = upgradeSystem.skillUpgrades[skillId];
  const price = skill.price * (skill.level + 1);
  if (upgradeSystem.upgradeSkill(skillId)) {
    window.uiManager?.updateUpgradeShop();
    window.uiManager?.showNotification("👤 Habilidade melhorada!", "success");
    dailyChallenges?.onUpgradeBuy(price);
    careerMode?.onToolUpgraded(toolId);
    careerMode?.onMoneySpent(price);
    db.saveUpgrades();
  }
};

window.upgradeTool = (toolId) => {
  if (!window.uiManager?.upgradeManager) {
    console.log("❌ UpgradeManager não disponível");
    return;
  }

  const result = window.uiManager.upgradeManager.upgradeTool(toolId);

  if (result.success) {
    window.uiManager.showNotification(result.message, "success");
    window.uiManager.upgradePanel.update();
    if (window.gameState) {
      window.gameState.updateMoney();
    }
  } else {
    window.uiManager.showNotification(result.message, "error");
  }
};

window.upgradeGarage = (upgradeId) => {
  if (!window.uiManager?.upgradeManager) {
    console.log("❌ UpgradeManager não disponível");
    return;
  }

  const result = window.uiManager.upgradeManager.upgradeGarage(upgradeId);

  if (result.success) {
    window.uiManager.showNotification(result.message, "success");
    window.uiManager.upgradePanel.update();
    if (window.gameState) {
      window.gameState.updateMoney();
    }
  } else {
    window.uiManager.showNotification(result.message, "error");
  }
};

window.createRepairEffect = (partName) => {
  if (
    window.scene3D &&
    typeof window.scene3D.createRepairEffect === "function"
  ) {
    window.scene3D.createRepairEffect(partName);
  }
};

// ===== INICIALIZAÇÃO =====
window.addEventListener("load", async () => {
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    document.getElementById("loading-progress").textContent = progress + "%";
    if (progress >= 100) clearInterval(progressInterval);
  }, 200);

  await db.init();

  setTimeout(() => {
    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loading-screen").style.display = "none";
    }, 500);
  }, 2000);

  const container = document.getElementById("game-container");

  const newScene3D = new Scene3D(container);
  const newUIManager = new UIManager();

  scene3D = newScene3D;
  uiManager = newUIManager;

  window.scene3D = newScene3D;
  window.uiManager = newUIManager;
  window._scene3D = newScene3D;
  window._uiManager = newUIManager;

  newScene3D.animate();
  db.loadPlayerData();
  db.loadUpgrades();
  db.loadAchievements();

  // Pré-carregar modelos
  scene3D.preloadCarModels().then(() => {
    console.log("🎮 Modelos prontos!");
  });

  setInterval(() => {
    db.savePlayerData();
    db.saveUpgrades();
    db.saveAchievements();
  }, 30000);
});

// ===== EXPORTAÇÕES =====
// Exportar todas as instâncias de uma vez
export {
  gameState,
  upgradeSystem,
  achievementSystem,
  db,
  audioManager,
  inventory,
  specializationSystem,
  garageSystem,
  customerSystem,
  dailyChallenges,
  usedPartsMarket,
  careerMode,
  scene3D,
  uiManager,
};

// ===== EXPORTAÇÕES GLOBAIS =====
// Expor globalmente para acesso via onclick e outros arquivos
window.gameState = gameState;
window.upgradeSystem = upgradeSystem;
window.achievementSystem = achievementSystem;
window.db = db;
window.audioManager = audioManager;
window.inventory = inventory;
window.specializationSystem = specializationSystem;
window.garageSystem = garageSystem;
window.customerSystem = customerSystem;
window.dailyChallenges = dailyChallenges;
window.usedPartsMarket = usedPartsMarket;
window.careerMode = careerMode;

// Também expor as classes construtoras
window.GameState = GameState;
window.Database = Database;
window.UpgradeSystem = UpgradeSystem;
window.AchievementSystem = AchievementSystem;
window.AudioManager = AudioManager;
window.Inventory = Inventory;
window.SpecializationSystem = SpecializationSystem;
window.GarageSystem = GarageSystem;
window.CustomerSystem = CustomerSystem;
window.DailyChallenges = DailyChallenges;
window.UsedPartsMarket = UsedPartsMarket;
window.CareerMode = CareerMode;
window.Job = Job;
window.CustomerCar = CustomerCar;
window.Scene3D = Scene3D;
window.UIManager = UIManager;

console.log("✅ Todas as classes exportadas globalmente");

// Expor GameState globalmente
if (typeof window !== "undefined") {
  window.GameState = GameState;
  console.log("🌐 GameState disponível globalmente");
}

// ===== PROTEÇÃO FINAL =====
// Garantir que gameState nunca seja substituído por um objeto simples
if (window.gameState && !(window.gameState instanceof GameState)) {
  console.warn("⚠️ gameState foi substituído! Recriando...");
  const dinheiroAntigo = window.gameState.money;
  const nivelAntigo = window.gameState.level;
  
  window.gameState = new GameState();
  window.gameState.money = dinheiroAntigo;
  window.gameState.level = nivelAntigo;
  
  console.log("✅ gameState restaurado como instância de GameState");
}

// Proteção adicional - verificar periodicamente
setInterval(() => {
  if (window.gameState && !(window.gameState instanceof GameState)) {
    console.error("❌ gameState perdeu sua classe! Recuperando...");
    const dinheiroAntigo = window.gameState.money;
    const nivelAntigo = window.gameState.level;
    
    window.gameState = new GameState();
    window.gameState.money = dinheiroAntigo;
    window.gameState.level = nivelAntigo;
    
    console.log("✅ gameState recuperado automaticamente");
  }
}, 1000);