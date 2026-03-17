// src/core/Game.js - CORRIGIDO: sem dupla inicialização, sem conflito de save

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
import { OptimizedGarage as Scene3D } from "/src/garage/OptimizedGarage.js";
import { UIManager } from "/src/ui/UIManager.js";
import { UsedPartsMarket } from "/src/systems/market/used-parts-market.js";
import { CareerMode } from "/src/systems/career-mode.js";

// ===== ESTADO GLOBAL DO JOGO =====
class GameState {
  constructor() {
    this.money = 500000;
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = 1000;
    this.reputation = 1;
    this.jobsCompleted = 0;
    this.garageLevel = 1;
    this.currentJob = null;
    this.currentCar = null;
    this.selectedTool = "wrench";
    this.selectedPart = null;
    this.startTime = Date.now();
    this.isUpdatingFromAchievement = false;
  }

  updateMoney(amount) {
    const validAmount = Number(amount) || 0;
    this.money += validAmount;
    if (isNaN(this.money)) this.money = 5000;
    const moneyEl = document.getElementById("money");
    if (moneyEl) moneyEl.textContent = `R$ ${this.money.toLocaleString()}`;
    if (!this.isUpdatingFromAchievement && window.achievementSystem) {
      this.isUpdatingFromAchievement = true;
      try { window.achievementSystem.checkAchievements?.(); } catch(e) {}
      finally { this.isUpdatingFromAchievement = false; }
    }
  }

  addExperience(amount) {
    const validAmount = Number(amount) || 0;
    let bonusAmount = validAmount;
    if (window.upgradeSystem?.calculateExperience) {
      bonusAmount = window.upgradeSystem.calculateExperience(validAmount);
    }
    this.experience += bonusAmount;
    while (this.experience >= this.experienceToNextLevel) this.levelUp();
    const levelEl = document.getElementById("level");
    if (levelEl) levelEl.textContent = this.level;
  }

  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    window.uiManager?.showNotification(`🎉 Nível ${this.level} alcançado!`, "success");
  }

  updateReputation(change) {
    const validChange = Number(change) || 0;
    this.reputation = Math.max(1, Math.min(5, this.reputation + validChange));
    const stars = "★".repeat(this.reputation) + "☆".repeat(5 - this.reputation);
    const repEl = document.getElementById("reputation");
    if (repEl) repEl.textContent = stars;
  }

  canAfford(amount) { return this.money >= (Number(amount) || 0); }

  getToolEfficiency(toolType) {
    const tools = {
      wrench:      { repair: 10, cost: 5,  name: "Chave Inglesa" },
      screwdriver: { repair: 5,  cost: 3,  name: "Chave de Fenda" },
      hammer:      { repair: 15, cost: 8,  name: "Martelo" },
      welder:      { repair: 25, cost: 12, name: "Maçarico" },
      diagnostic:  { repair: 0,  cost: 0,  name: "Diagnóstico" },
    };
    return tools[toolType] || tools.wrench;
  }

  checkCarReady() {
    if (!this.currentCar?.parts) return { ready:false, averageCondition:0, perfectCount:0, totalParts:0 };
    const allParts = Object.values(this.currentCar.parts);
    if (!allParts.length) return { ready:false, averageCondition:0, perfectCount:0, totalParts:0 };
    const totalCondition = allParts.reduce((s, p) => s + (p.condition||0), 0);
    const averageCondition = totalCondition / allParts.length;
    return {
      ready: averageCondition >= 90,
      averageCondition: Math.round(averageCondition),
      perfectCount: allParts.filter(p => (p.condition||0) >= 100).length,
      totalParts: allParts.length,
    };
  }

  repairPart(partName) {
    if (!this.currentCar?.parts[partName]) return { success:false, message:"❌ Peça não encontrada" };
    const part = this.currentCar.parts[partName];
    const tool = this.getToolEfficiency(this.selectedTool);
    if (part.condition >= 100) return { success:false, message:"✅ Peça já está em perfeito estado" };
    if (this.money < tool.cost) return { success:false, message:"💰 Dinheiro insuficiente" };
    const oldCondition = part.condition;
    part.condition = Math.min(100, part.condition + tool.repair);
    this.money -= tool.cost;
    this.addExperience(5);
    this.updateMoney(0);
    return { success:true, message:`🔧 Reparou ${Math.round(part.condition - oldCondition)}% com ${tool.name}`, repairedAmount:Math.round(part.condition - oldCondition), partName, newCondition:part.condition };
  }

  buyNewPart(partName) {
    if (!this.currentCar?.parts[partName]) return { success:false, message:"❌ Peça não encontrada" };
    const part = this.currentCar.parts[partName];
    if (this.money < 500) return { success:false, message:"💰 Dinheiro insuficiente" };
    part.condition = 100;
    this.money -= 500;
    this.addExperience(20);
    this.updateMoney(0);
    return { success:true, message:"🛒 Peça nova instalada!", partName, newCondition:100 };
  }

  initializeDisplay() { this.updateMoney(0); }
}

// ===== INSTÂNCIAS =====
const gameState         = new GameState();
const upgradeSystem     = new UpgradeSystem();
const achievementSystem = new AchievementSystem();
const db                = new Database();
const audioManager      = new AudioManager();
const inventory         = new Inventory();
const specializationSystem = new SpecializationSystem();
const garageSystem      = new GarageSystem();
const customerSystem    = new CustomerSystem();
const dailyChallenges   = new DailyChallenges();
const usedPartsMarket   = new UsedPartsMarket();
const careerMode        = new CareerMode();
let scene3D, uiManager;

Object.defineProperty(window, "scene3D",   { set: v => { scene3D  = v; window._scene3D  = v; }, get: () => window._scene3D  || scene3D });
Object.defineProperty(window, "uiManager", { set: v => { uiManager = v; window._uiManager = v; }, get: () => window._uiManager || uiManager });

// ===== FUNÇÕES GLOBAIS =====

window.repairPart = (partName) => {
  if (!window.gameState) { window.uiManager?.showNotification("❌ Jogo não inicializado","error"); return; }
  const result = window.gameState.repairPart(partName);
  if (result.success) {
    window.uiManager?.showNotification(result.message,"success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();
    window.createRepairEffect?.(partName);
    if (window.gameState.checkCarReady().ready) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification("🎉 Carro pronto para entrega!","success");
    }
  } else { window.uiManager?.showNotification(result.message,"error"); }
};

window.buyNewPart = (partName) => {
  if (!window.gameState) { window.uiManager?.showNotification("❌ Jogo não inicializado","error"); return; }
  const result = window.gameState.buyNewPart(partName);
  if (result.success) {
    window.uiManager?.showNotification(result.message,"success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();
    for (let i=0; i<3; i++) setTimeout(()=>window.createRepairEffect?.(partName), i*200);
    if (window.gameState.checkCarReady().ready) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification("🎉 Carro pronto para entrega!","success");
    }
  } else { window.uiManager?.showNotification(result.message,"error"); }
};

window.selectPart = (partName) => {
  if (window.gameState) {
    window.gameState.selectedPart = partName;
    window.uiManager?.updatePartsList();
    window.uiManager?.showNotification(`🔧 Peça selecionada: ${partName}`,"info");
  }
};

window.createRepairEffect = (partName) => {
  if (window.scene3D?.createRepairEffect) window.scene3D.createRepairEffect(partName);
};

window.upgradeTool = (toolId) => {
  if (!window.uiManager?.upgradeManager) { window.uiManager?.showNotification("❌ Sistema de upgrades não disponível","error"); return; }
  const result = window.uiManager.upgradeManager.upgradeTool(toolId);
  if (result.success) { window.uiManager.showNotification(result.message,"success"); window.uiManager.upgradePanel?.update(); window.gameState?.updateMoney(); }
  else { window.uiManager.showNotification(result.message,"error"); }
};

window.upgradeGarage = (upgradeId) => {
  if (!window.uiManager?.upgradeManager) { window.uiManager?.showNotification("❌ Sistema de upgrades não disponível","error"); return; }
  const result = window.uiManager.upgradeManager.upgradeGarage(upgradeId);
  if (result.success) { window.uiManager.showNotification(result.message,"success"); window.uiManager.upgradePanel?.update(); window.gameState?.updateMoney(); }
  else { window.uiManager.showNotification(result.message,"error"); }
};

window.buyPart = (partType, quantity=1, rarity="comum") => {
  if (!window.uiManager?.economySystem) { window.uiManager?.showNotification("❌ Sistema econômico não disponível","error"); return; }
  const result = window.uiManager.economySystem.buyPart(partType, quantity, rarity);
  if (result.success) { window.uiManager.showNotification(result.message,"success"); window.uiManager.updateMoney(); window.uiManager.shopPanel?.update(); }
  else { window.uiManager.showNotification(result.message,"error"); }
};

window.sellPart = (partType) => {
  if (!window.uiManager?.economySystem || !window.inventory) { window.uiManager?.showNotification("❌ Sistema não disponível","error"); return; }
  const result = window.uiManager.economySystem.sellPart(partType, 50);
  if (result.success) { window.inventory.usePart(partType); window.uiManager.showNotification(result.message,"success"); window.uiManager.updateMoney(); window.uiManager.shopPanel?.update(); }
};

// ===== INICIALIZAÇÃO — UMA SÓ VEZ =====
let _gameInitialized = false;

window.addEventListener("load", async () => {
  // CORREÇÃO 1: Flag para evitar dupla inicialização
  if (_gameInitialized) return;
  _gameInitialized = true;

  let progress = 0;
  const progressInterval = setInterval(() => {
    progress = Math.min(100, progress + 10);
    const el = document.getElementById("loading-progress");
    if (el) el.textContent = progress + "%";
    if (progress >= 100) clearInterval(progressInterval);
  }, 200);

  // IndexedDB (apenas jobs/upgrades/achievements — não player data)
  try { await db.init(); } catch(e) {}

  setTimeout(() => {
    const ls = document.getElementById("loading-screen");
    if (ls) { ls.style.opacity = "0"; setTimeout(()=>{ ls.style.display="none"; }, 500); }
  }, 2000);

  const container = document.getElementById("game-container");
  const newScene3D   = new Scene3D(container);
  const newUIManager = new UIManager();

  scene3D   = newScene3D;
  uiManager = newUIManager;
  window.scene3D    = newScene3D;
  window.uiManager  = newUIManager;
  window._scene3D   = newScene3D;
  window._uiManager = newUIManager;

  gameState.initializeDisplay();
  newScene3D.animate();

  // CORREÇÃO 2: NÃO chamar db.loadPlayerData() — player data é gerenciado
  // pelo UIManager._loadProgress() via localStorage (cms_save_*) para
  // suportar múltiplos perfis. IndexedDB apenas para upgrades/achievements.
  db.loadUpgrades();
  db.loadAchievements();

  scene3D.preloadCarModels?.();

  // Auto-save IndexedDB a cada 30s (upgrades e achievements)
  setInterval(() => {
    db.saveUpgrades();
    db.saveAchievements();
  }, 30000);
});

// ===== EXPORTAÇÕES =====
export { gameState, upgradeSystem, achievementSystem, db, audioManager, inventory, specializationSystem, garageSystem, customerSystem, dailyChallenges, usedPartsMarket, careerMode, scene3D, uiManager };

window.gameState          = gameState;
window.upgradeSystem      = upgradeSystem;
window.achievementSystem  = achievementSystem;
window.db                 = db;
window.audioManager       = audioManager;
window.inventory          = inventory;
window.specializationSystem = specializationSystem;
window.garageSystem       = garageSystem;
window.customerSystem     = customerSystem;
window.dailyChallenges    = dailyChallenges;
window.usedPartsMarket    = usedPartsMarket;
window.careerMode         = careerMode;
window.GameState          = GameState;
window.Database           = Database;
window.UpgradeSystem      = UpgradeSystem;
window.AchievementSystem  = AchievementSystem;
window.AudioManager       = AudioManager;
window.Inventory          = Inventory;
window.SpecializationSystem = SpecializationSystem;
window.GarageSystem       = GarageSystem;
window.CustomerSystem     = CustomerSystem;
window.DailyChallenges    = DailyChallenges;
window.UsedPartsMarket    = UsedPartsMarket;
window.CareerMode         = CareerMode;
window.Job                = Job;
window.CustomerCar        = CustomerCar;
window.Scene3D            = Scene3D;
window.UIManager          = UIManager;
