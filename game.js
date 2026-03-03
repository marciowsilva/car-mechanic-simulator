// game.js - ARQUIVO PRINCIPAL COMPLETO

import {
  TOOL_BASE_STATS,
  PART_TRANSLATIONS,
  PART_POSITIONS,
} from "./constants.js";
import { Database } from "./database.js";
import { UpgradeSystem } from "./upgrade-system.js";
import { AchievementSystem } from "./achievement-system.js";
import { AudioManager } from "./audio.js";
import { Inventory } from "./inventory.js";
import { SpecializationSystem } from "./specializations.js";
import { GarageSystem } from "./garage.js";
import { CustomerSystem } from "./customers.js";
import { DailyChallenges } from "./daily-challenges.js";
import { Job } from "./job.js";
import { CustomerCar } from "./car.js";
import { Scene3D } from "./scene3d.js";
import { UIManager } from "./ui.js";
import { UsedPartsMarket } from "./used-parts-market.js";
import { CareerMode } from "./career-mode.js";

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

// ===== EXPORTAÇÕES =====
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
  scene3D,
  uiManager,
  usedPartsMarket,
  careerMode,
};

// ===== EXPORTAÇÕES GLOBAIS =====
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
  if (!gameState.currentCar || !gameState.currentJob) return;

  const part = gameState.currentCar.parts[partName];
  const targetCondition = gameState.currentJob.targetConditions[partName];
  const toolStats = upgradeSystem.getToolStats(gameState.selectedTool);

  if (gameState.selectedTool === "diagnostic") {
    window.uiManager?.showNotification(
      `🔍 Diagnóstico: ${PART_TRANSLATIONS[partName].display} está em ${Math.min(100, Math.round(part.condition))}%, necessário ${Math.min(100, Math.round(targetCondition))}%`,
      "info",
    );
    audioManager?.playSound("click");
    dailyChallenges?.onToolUsed("diagnostic");
    return;
  }

  if (part.condition >= targetCondition || part.condition >= 100) {
    window.uiManager?.showNotification(
      "✅ Peça já atende aos requisitos!",
      "info",
    );
    audioManager?.playSound("error");
    return;
  }

  const baseEfficiency = upgradeSystem.calculateRepairEfficiency(
    toolStats.repair,
  );
  const repairEfficiency = specializationSystem.calculateRepairEfficiency(
    baseEfficiency,
    partName,
  );
  const repairCost = upgradeSystem.calculateRepairCost(toolStats.cost);

  if (gameState.money < repairCost) {
    window.uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
    audioManager?.playSound("error");
    return;
  }

  audioManager?.playSound(gameState.selectedTool);
  dailyChallenges?.onToolUsed(gameState.selectedTool);
  careerMode?.onPartUsed(partName);

  if (window.scene3D) {
    const pos = PART_POSITIONS[partName];
    if (pos)
      window.scene3D.createRepairEffect(
        new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]),
      );
  }

  const newCondition = Math.min(100, part.condition + repairEfficiency);
  part.condition = newCondition;

  gameState.updateMoney(-repairCost);
  gameState.addExperience(50);

  // Registrar nos desafios
  dailyChallenges?.onRepair(partName);

  window.scene3D?.updatePartLabels(gameState.currentCar, gameState.currentJob);
  window.uiManager?.updatePartsList();
  window.uiManager?.updateJobInfo();
  window.uiManager?.checkJobCompletion();

  window.uiManager?.showNotification(
    `✅ Reparou ${PART_TRANSLATIONS[partName].display}!`,
    "success",
  );
  db.savePlayerData();
};

window.buyNewPart = (partName) => {
  if (!gameState.currentCar || !gameState.currentJob) return;

  const part = gameState.currentCar.parts[partName];
  const targetCondition = gameState.currentJob.targetConditions[partName];

  if (part.condition >= targetCondition || part.condition >= 100) {
    window.uiManager?.showNotification("✅ Peça já está ok!", "info");
    audioManager?.playSound("error");
    return;
  }

  // Tentar usar do estoque primeiro
  if (inventory.hasPart(partName)) {
    inventory.usePart(partName);
    part.condition = 100;
    gameState.addExperience(50);
    window.uiManager?.showNotification(
      `📦 Usou ${PART_TRANSLATIONS[partName].display} do estoque!`,
      "success",
    );
    dailyChallenges?.onInventoryUse();
  } else {
    const partPrice = upgradeSystem.calculatePartPrice(part.price);
    if (gameState.money < partPrice) {
      window.uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
      audioManager?.playSound("error");
      return;
    }

    gameState.updateMoney(-partPrice);
    part.condition = 100;
    gameState.addExperience(100);
    window.uiManager?.showNotification(
      `🛒 Comprou ${PART_TRANSLATIONS[partName].display} nova!`,
      "success",
    );
    dailyChallenges?.onInventoryBuy();
  }

  audioManager?.playSound("money");
  careerMode?.onMoneySpent(partPrice);

  if (window.scene3D) {
    const pos = PART_POSITIONS[partName];
    if (pos) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.scene3D.createRepairEffect(
            new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]),
          );
        }, i * 150);
      }
    }
  }

  window.scene3D?.updatePartLabels(gameState.currentCar, gameState.currentJob);
  window.uiManager?.updatePartsList();
  window.uiManager?.updateJobInfo();
  window.uiManager?.checkJobCompletion();

  db.savePlayerData();
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

  setInterval(() => {
    db.savePlayerData();
    db.saveUpgrades();
    db.saveAchievements();
  }, 30000);
});
