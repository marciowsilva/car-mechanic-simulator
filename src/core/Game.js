// game.js - ARQUIVO PRINCIPAL COMPLETO

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
    document.getElementById("money").textContent =
      `R$ ${this.money.toLocaleString()}`;
    window.achievementSystem?.checkAchievements();
  }

  addExperience(amount) {
    const bonusAmount =
      window.upgradeSystem?.calculateExperience(amount) || amount;
    this.experience += bonusAmount;

    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }

    document.getElementById("level").textContent = this.level;
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
    document.getElementById("reputation").textContent = stars;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  repairPart(partName, amount) {
    if (!this.currentCar || !this.currentCar.parts[partName]) return false;

    const part = this.currentCar.parts[partName];
    const oldCondition = part.condition;
    part.condition = Math.min(100, part.condition + amount);

    // Atualizar dinheiro (custo do reparo)
    const repairCost = Math.round(amount * 10);
    if (this.money >= repairCost) {
      this.money -= repairCost;
      this.addExperience(5);
      this.updateMoney();
      return true;
    }
    return false;
  }

  buyNewPart(partName) {
    if (!this.currentCar || !this.currentCar.parts[partName]) return false;

    const part = this.currentCar.parts[partName];
    const partPrice = 500; // Preço fixo por enquanto

    if (this.money >= partPrice) {
      this.money -= partPrice;
      part.condition = 100;
      this.addExperience(20);
      this.updateMoney();
      return true;
    }
    return false;
  }

  checkAllPartsGood() {
    if (!this.currentCar) return false;

    return Object.values(this.currentCar.parts).every(
      (part) => part.condition >= 90,
    );
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

window.repairPart = (partName) => {
  if (!window.gameState || !window.gameState.currentCar) {
    window.uiManager?.showNotification("❌ Nenhum carro na oficina", "error");
    return;
  }

  const tool = window.gameState.selectedTool || "wrench";
  const repairAmounts = {
    wrench: 10,
    screwdriver: 5,
    hammer: 15,
    welder: 25,
    diagnostic: 0,
  };

  const amount = repairAmounts[tool] || 10;

  if (window.gameState.repairPart(partName, amount)) {
    window.uiManager?.showNotification(`✅ ${partName} reparado!`, "success");
    window.uiManager?.updatePartsList();

    // Criar efeito visual
    window.createRepairEffect?.(partName);

    // Verificar se todos os reparos foram feitos
    if (window.gameState.checkAllPartsGood()) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification(
        "🎉 Carro pronto para entrega!",
        "success",
      );
    }
  } else {
    window.uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
  }
};

window.buyPart = (partName) => {
  if (!window.gameState || !window.gameState.currentCar) {
    window.uiManager?.showNotification("❌ Nenhum carro na oficina", "error");
    return;
  }

  if (window.gameState.buyNewPart(partName)) {
    window.uiManager?.showNotification(
      `🛒 ${partName} nova instalada!`,
      "success",
    );
    window.uiManager?.updatePartsList();

    // Criar efeito visual mais forte
    for (let i = 0; i < 3; i++) {
      setTimeout(() => window.createRepairEffect?.(partName), i * 200);
    }

    if (window.gameState.checkAllPartsGood()) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification(
        "🎉 Carro pronto para entrega!",
        "success",
      );
    }
  } else {
    window.uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
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
