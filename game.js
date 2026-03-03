// game.js - ARQUIVO PRINCIPAL OTIMIZADO

import { TOOL_BASE_STATS, PART_TRANSLATIONS, PART_POSITIONS } from './constants.js';
import { Database } from './database.js';
import { UpgradeSystem } from './upgrade-system.js';
import { AchievementSystem } from './achievement-system.js';
import { AudioManager } from './audio.js';
import { Inventory } from './inventory.js';
import { SpecializationSystem } from './specializations.js';
import { Job } from './job.js';
import { CustomerCar } from './car.js';
import { Scene3D } from './scene3d.js';
import { UIManager } from './ui.js';

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
        this.selectedTool = 'wrench';
        this.selectedPart = null;
    }

    updateMoney(amount) {
        this.money += amount;
        document.getElementById('money').textContent = `R$ ${this.money.toLocaleString()}`;
        achievementSystem.checkAchievements();
    }

    addExperience(amount) {
        const bonusAmount = upgradeSystem.calculateExperience(amount);
        this.experience += bonusAmount;
        
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        document.getElementById('level').textContent = this.level;
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        uiManager?.showNotification(`🎉 Nível ${this.level} alcançado!`, 'success');
    }

    updateReputation(change) {
        this.reputation = Math.max(1, Math.min(5, this.reputation + change));
        const stars = '★'.repeat(this.reputation) + '☆'.repeat(5 - this.reputation);
        document.getElementById('reputation').textContent = stars;
    }

    canAfford(amount) {
        return this.money >= amount;
    }
}

// ===== CRIAÇÃO DAS INSTÂNCIAS =====
export const gameState = new GameState();
export const upgradeSystem = new UpgradeSystem();
export const achievementSystem = new AchievementSystem();
export const db = new Database();
export const audioManager = new AudioManager();
export const inventory = new Inventory();
export const specializationSystem = new SpecializationSystem();
export let scene3D;
export let uiManager;

// ===== EXPORTAÇÕES =====
export { scene3D, uiManager };

// ===== FUNÇÕES GLOBAIS =====

window.repairPart = (partName) => {
    if (!gameState.currentCar || !gameState.currentJob) return;
    
    const part = gameState.currentCar.parts[partName];
    const targetCondition = gameState.currentJob.targetConditions[partName];
    const toolStats = upgradeSystem.getToolStats(gameState.selectedTool);
    
    if (gameState.selectedTool === 'diagnostic') {
        uiManager?.showNotification(`🔍 Diagnóstico: ${PART_TRANSLATIONS[partName].display} está em ${Math.min(100, Math.round(part.condition))}%, necessário ${Math.min(100, Math.round(targetCondition))}%`, 'info');
        audioManager?.playSound('click');
        return;
    }
    
    if (part.condition >= targetCondition || part.condition >= 100) {
        uiManager?.showNotification('✅ Peça já atende aos requisitos!', 'info');
        audioManager?.playSound('error');
        return;
    }
    
    const baseEfficiency = upgradeSystem.calculateRepairEfficiency(toolStats.repair);
    const repairEfficiency = specializationSystem.calculateRepairEfficiency(baseEfficiency, partName);
    const repairCost = upgradeSystem.calculateRepairCost(toolStats.cost);
    
    if (gameState.money < repairCost) {
        uiManager?.showNotification('💰 Dinheiro insuficiente!', 'error');
        audioManager?.playSound('error');
        return;
    }
    
    audioManager?.playSound(gameState.selectedTool);
    
    if (scene3D) {
        const pos = PART_POSITIONS[partName];
        if (pos) scene3D.createRepairEffect(new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]));
    }
    
    const newCondition = Math.min(100, part.condition + repairEfficiency);
    part.condition = newCondition;
    
    gameState.updateMoney(-repairCost);
    gameState.addExperience(50);
    
    scene3D?.updatePartLabels(gameState.currentCar, gameState.currentJob);
    uiManager?.updatePartsList();
    uiManager?.updateJobInfo();
    uiManager?.checkJobCompletion();
    
    uiManager?.showNotification(`✅ Reparou ${PART_TRANSLATIONS[partName].display}!`, 'success');
    db.savePlayerData();
};

window.buyNewPart = (partName) => {
    if (!gameState.currentCar || !gameState.currentJob) return;
    
    const part = gameState.currentCar.parts[partName];
    const targetCondition = gameState.currentJob.targetConditions[partName];
    
    if (part.condition >= targetCondition || part.condition >= 100) {
        uiManager?.showNotification('✅ Peça já está ok!', 'info');
        audioManager?.playSound('error');
        return;
    }
    
    // Tentar usar do estoque primeiro
    if (inventory.hasPart(partName)) {
        inventory.usePart(partName);
        part.condition = 100;
        gameState.addExperience(50);
        uiManager?.showNotification(`📦 Usou ${PART_TRANSLATIONS[partName].display} do estoque!`, 'success');
    } else {
        const partPrice = upgradeSystem.calculatePartPrice(part.price);
        if (gameState.money < partPrice) {
            uiManager?.showNotification('💰 Dinheiro insuficiente!', 'error');
            audioManager?.playSound('error');
            return;
        }
        
        gameState.updateMoney(-partPrice);
        part.condition = 100;
        gameState.addExperience(100);
        uiManager?.showNotification(`🛒 Comprou ${PART_TRANSLATIONS[partName].display} nova!`, 'success');
    }
    
    audioManager?.playSound('money');
    
    if (scene3D) {
        const pos = PART_POSITIONS[partName];
        if (pos) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    scene3D.createRepairEffect(new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]));
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
        uiManager?.updateToolDisplay();
        uiManager?.updateUpgradeShop();
        uiManager?.showNotification(`🔧 Ferramenta upgraded!`, 'success');
        db.saveUpgrades();
    }
};

window.upgradeWorkshop = (upgradeId) => {
    if (upgradeSystem.upgradeWorkshop(upgradeId)) {
        uiManager?.updateUpgradeShop();
        uiManager?.showNotification('🏢 Upgrade da oficina!', 'success');
        db.saveUpgrades();
    }
};

window.upgradeSkill = (skillId) => {
    if (upgradeSystem.upgradeSkill(skillId)) {
        uiManager?.updateUpgradeShop();
        uiManager?.showNotification('👤 Habilidade melhorada!', 'success');
        db.saveUpgrades();
    }
};

// ===== EXPORTAÇÕES GLOBAIS =====
window.gameState = gameState;
window.upgradeSystem = upgradeSystem;
window.achievementSystem = achievementSystem;
window.db = db;
window.audioManager = audioManager;
window.inventory = inventory;
window.specializationSystem = specializationSystem;

Object.defineProperty(window, 'scene3D', {
    set: (value) => { window._scene3D = value; },
    get: () => window._scene3D
});

Object.defineProperty(window, 'uiManager', {
    set: (value) => { window._uiManager = value; },
    get: () => window._uiManager
});

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', async () => {
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        document.getElementById('loading-progress').textContent = progress + '%';
        if (progress >= 100) clearInterval(progressInterval);
    }, 200);

    await db.init();
    
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
    }, 2000);
    
    const container = document.getElementById('game-container');
    scene3D = new Scene3D(container);
    uiManager = new UIManager();
    
    window.scene3D = scene3D;
    window.uiManager = uiManager;
    
    scene3D.animate();
    db.loadPlayerData();
    db.loadUpgrades();
    db.loadAchievements();
    
    setInterval(() => {
        db.savePlayerData();
        db.saveUpgrades();
        db.saveAchievements();
    }, 30000);
});