// game.js
import { TOOL_BASE_STATS, PART_TRANSLATIONS } from "./constants.js";
import { Database } from "./database.js";
import { UpgradeSystem } from "./upgrade-system.js";
import { AchievementSystem } from "./achievement-system.js";
import { Job } from "./job.js";
import { CustomerCar } from "./car.js";
import { Scene3D } from "./scene3d.js";
import { UIManager } from "./ui.js";
import { AudioManager } from "./audio.js";
import { Inventory } from "./inventory.js";

// Estado Global do Jogo
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
    achievementSystem.checkAchievements();
  }

  addExperience(amount) {
    const bonusAmount = upgradeSystem.calculateExperience(amount);
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
    uiManager.showNotification(`🎉 Nível ${this.level} alcançado!`, "success");
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

// Instâncias globais
export const gameState = new GameState();
export const upgradeSystem = new UpgradeSystem();
export const achievementSystem = new AchievementSystem();
export const db = new Database();
export const audioManager = new AudioManager();
export let scene3D;
export let uiManager;
export const inventory = new Inventory();

// Inicialização
window.addEventListener("load", async () => {
  // Loading progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    document.getElementById("loading-progress").textContent = progress + "%";
    if (progress >= 100) clearInterval(progressInterval);
  }, 200);

  // Aguardar banco de dados
  await db.init();

  setTimeout(() => {
    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loading-screen").style.display = "none";
    }, 500);
  }, 2000);

  // Inicializar cena 3D
  const container = document.getElementById("game-container");
  scene3D = new Scene3D(container);
  scene3D.animate();

  // Inicializar UI
  uiManager = new UIManager();

  // Carregar dados salvos
  db.loadPlayerData();
  db.loadUpgrades();
  db.loadAchievements();

  // Auto-save
  setInterval(() => {
    db.savePlayerData();
    db.saveUpgrades();
    db.saveAchievements();
  }, 30000);
});

// ===== FUNÇÕES GLOBAIS =====

window.repairPart = (partName) => {
  console.log(`🔧 Reparando ${partName}...`);

  if (!gameState.currentCar || !gameState.currentJob) {
    console.log("❌ Sem carro ou job ativo");
    return;
  }

  const part = gameState.currentCar.parts[partName];
  const targetCondition = gameState.currentJob.targetConditions[partName];
  const toolStats = upgradeSystem.getToolStats(gameState.selectedTool);
  const repairEfficiency = upgradeSystem.calculateRepairEfficiency(
    toolStats.repair,
  );
  const repairCost = upgradeSystem.calculateRepairCost(toolStats.cost);

  // DIAGNÓSTICO
  if (gameState.selectedTool === "diagnostic") {
    const message = `🔍 Diagnóstico: ${PART_TRANSLATIONS[partName].display} está em ${Math.min(100, Math.round(part.condition))}%, necessário ${Math.min(100, Math.round(targetCondition))}%`;
    uiManager?.showNotification(message, "info");

    // Som de diagnóstico
    if (window.audioManager) {
      audioManager.playSound("click");
    }
    return;
  }

  // Verificações
  if (part.condition >= targetCondition || part.condition >= 100) {
    uiManager?.showNotification("✅ Peça já atende aos requisitos!", "info");

    // Som de erro suave
    if (window.audioManager) {
      audioManager.playSound("error");
    }
    return;
  }

  if (gameState.money < repairCost) {
    uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");

    // Som de erro
    if (window.audioManager) {
      audioManager.playSound("error");
    }
    return;
  }

  // ===== SOM DA FERRAMENTA =====
  if (window.audioManager) {
    audioManager.playSound(gameState.selectedTool);
  }

  // ===== EFEITO VISUAL DE PARTÍCULAS =====
  if (window.scene3D) {
    const pos = PART_POSITIONS[partName];
    if (pos) {
      scene3D.createRepairEffect(
        new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]),
      );
    }
  }

  // Aplicar reparo
  const newCondition = Math.min(100, part.condition + repairEfficiency);
  part.condition = newCondition;

  gameState.updateMoney(-repairCost);
  gameState.addExperience(50);

  // Atualizar UI e labels
  scene3D?.updatePartLabels(gameState.currentCar, gameState.currentJob);
  uiManager?.updatePartsList();
  uiManager?.updateJobInfo();
  uiManager?.checkJobCompletion();

  const actualRepair = Math.min(
    repairEfficiency,
    100 - (part.condition - repairEfficiency),
  );
  uiManager?.showNotification(
    `✅ Reparou ${PART_TRANSLATIONS[partName].display} com ${toolStats.name}! +${actualRepair}%`,
    "success",
  );

  db.savePlayerData();
};

window.buyNewPart = (partName) => {
  console.log(`🛒 Comprando ${partName} nova...`);

  if (!gameState.currentCar || !gameState.currentJob) {
    console.log("❌ Sem carro ou job ativo");
    return;
  }

  const part = gameState.currentCar.parts[partName];
  const targetCondition = gameState.currentJob.targetConditions[partName];
  const partPrice = upgradeSystem.calculatePartPrice(part.price);

  // Verificar se tem no estoque primeiro
  if (inventory.hasPart(partName)) {
    // Usar do estoque
    inventory.usePart(partName);
    part.condition = 100;

    gameState.addExperience(50); // Menos experiência por usar estoque
    uiManager?.showNotification(
      `📦 Usou ${PART_TRANSLATIONS[partName].display} do estoque!`,
      "success",
    );
  } else if (gameState.money >= partPrice) {
    // Comprar novo
    gameState.updateMoney(-partPrice);
    part.condition = 100;
    gameState.addExperience(100);
    uiManager?.showNotification(
      `🛒 Comprou ${PART_TRANSLATIONS[partName].display} nova!`,
      "success",
    );
  } else {
    uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
    return;
  }

  // Efeitos visuais e sonoros
  if (window.audioManager) {
    audioManager.playSound("money");
  }

  if (window.scene3D) {
    const pos = PART_POSITIONS[partName];
    if (pos) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          scene3D.createRepairEffect(
            new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]),
          );
        }, i * 150);
      }
    }
  }

  scene3D?.updatePartLabels(gameState.currentCar, gameState.currentJob);
  uiManager?.updatePartsList();
  uiManager?.updateJobInfo();
  uiManager?.checkJobCompletion();

  db.savePlayerData();
};

window.upgradeTool = (toolId) => {
  if (upgradeSystem.upgradeTool(toolId)) {
    uiManager.updateToolDisplay();
    uiManager.updateUpgradeShop();
    uiManager.showNotification(
      `🔧 ${TOOL_BASE_STATS[toolId].name} upgraded!`,
      "success",
    );
    db.saveUpgrades();
  }
};

window.upgradeWorkshop = (upgradeId) => {
  if (upgradeSystem.upgradeWorkshop(upgradeId)) {
    uiManager.updateUpgradeShop();
    uiManager.showNotification("🏢 Upgrade da oficina concluído!", "success");
    db.saveUpgrades();
  }
};

window.upgradeSkill = (skillId) => {
  if (upgradeSystem.upgradeSkill(skillId)) {
    uiManager.updateUpgradeShop();
    uiManager.showNotification("👤 Habilidade melhorada!", "success");
    db.saveUpgrades();
  }
};

window.closeUpgradeShop = () => {
  uiManager.closeUpgradeShop();
};

// Expor globalmente para acesso via onclick e database.js
window.gameState = gameState;
window.upgradeSystem = upgradeSystem;
window.achievementSystem = achievementSystem;
window.db = db;
window.audioManager = audioManager;
window.scene3D = scene3D;
window.uiManager = uiManager;

// Aguardar UI ser inicializada antes de usar
window.addEventListener("load", () => {
  console.log("Game initialized with globals:", {
    gameState,
    upgradeSystem,
    achievementSystem,
    db,
  });
});
