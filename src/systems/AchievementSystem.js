// src/systems/AchievementSystem.js - Sistema de conquistas completo

export const ACHIEVEMENTS = {
  // Conquistas de serviço
  firstJob: {
    id: "firstJob",
    name: "Primeiro Serviço",
    description: "Complete seu primeiro serviço",
    icon: "🔰",
    category: "service",
    requirement: { type: "jobs", value: 1 },
    reward: { money: 500, experience: 100 },
    hidden: false,
  },
  fiveJobs: {
    id: "fiveJobs",
    name: "Mecânico Iniciante",
    description: "Complete 5 serviços",
    icon: "🔧",
    category: "service",
    requirement: { type: "jobs", value: 5 },
    reward: { money: 1000, experience: 250 },
    hidden: false,
  },
  tenJobs: {
    id: "tenJobs",
    name: "Mecânico Experiente",
    description: "Complete 10 serviços",
    icon: "⚙️",
    category: "service",
    requirement: { type: "jobs", value: 10 },
    reward: { money: 2000, experience: 500 },
    hidden: false,
  },
  twentyFiveJobs: {
    id: "twentyFiveJobs",
    name: "Mecânico Profissional",
    description: "Complete 25 serviços",
    icon: "🔨",
    category: "service",
    requirement: { type: "jobs", value: 25 },
    reward: { money: 5000, experience: 1000 },
    hidden: false,
  },
  fiftyJobs: {
    id: "fiftyJobs",
    name: "Mestre Mecânico",
    description: "Complete 50 serviços",
    icon: "🏆",
    category: "service",
    requirement: { type: "jobs", value: 50 },
    reward: { money: 10000, experience: 2500 },
    hidden: false,
  },
  hundredJobs: {
    id: "hundredJobs",
    name: "Lendário",
    description: "Complete 100 serviços",
    icon: "👑",
    category: "service",
    requirement: { type: "jobs", value: 100 },
    reward: { money: 25000, experience: 5000 },
    hidden: false,
  },

  // Conquistas de dinheiro
  firstThousand: {
    id: "firstThousand",
    name: "Primeiro Milhar",
    description: "Ganhe R$ 1.000",
    icon: "💰",
    category: "money",
    requirement: { type: "money", value: 1000 },
    reward: { money: 200, experience: 50 },
    hidden: false,
  },
  tenThousand: {
    id: "tenThousand",
    name: "Acumulador",
    description: "Ganhe R$ 10.000",
    icon: "💵",
    category: "money",
    requirement: { type: "money", value: 10000 },
    reward: { money: 1000, experience: 200 },
    hidden: false,
  },
  fiftyThousand: {
    id: "fiftyThousand",
    name: "Empresário",
    description: "Ganhe R$ 50.000",
    icon: "💎",
    category: "money",
    requirement: { type: "money", value: 50000 },
    reward: { money: 5000, experience: 1000 },
    hidden: false,
  },
  hundredThousand: {
    id: "hundredThousand",
    name: "Magnata",
    description: "Ganhe R$ 100.000",
    icon: "👔",
    category: "money",
    requirement: { type: "money", value: 100000 },
    reward: { money: 10000, experience: 2500 },
    hidden: false,
  },

  // Conquistas de qualidade
  perfectJob: {
    id: "perfectJob",
    name: "Perfeição",
    description: "Complete um serviço com todas as peças em 100%",
    icon: "✨",
    category: "quality",
    requirement: { type: "perfect", value: 1 },
    reward: { money: 1000, experience: 300 },
    hidden: false,
  },
  fivePerfect: {
    id: "fivePerfect",
    name: "Perfeccionista",
    description: "Complete 5 serviços perfeitos",
    icon: "🌟",
    category: "quality",
    requirement: { type: "perfect", value: 5 },
    reward: { money: 5000, experience: 1500 },
    hidden: false,
  },
  tenPerfect: {
    id: "tenPerfect",
    name: "Artista",
    description: "Complete 10 serviços perfeitos",
    icon: "🎨",
    category: "quality",
    requirement: { type: "perfect", value: 10 },
    reward: { money: 10000, experience: 3000 },
    hidden: false,
  },

  // Conquistas de clientes
  firstVIP: {
    id: "firstVIP",
    name: "Primeiro VIP",
    description: "Atenda seu primeiro cliente VIP",
    icon: "👑",
    category: "customer",
    requirement: { type: "vip", value: 1 },
    reward: { money: 1000, experience: 200 },
    hidden: false,
  },
  fiveVIP: {
    id: "fiveVIP",
    name: "Clube VIP",
    description: "Atenda 5 clientes VIP",
    icon: "💎",
    category: "customer",
    requirement: { type: "vip", value: 5 },
    reward: { money: 5000, experience: 1000 },
    hidden: false,
  },
  tenVIP: {
    id: "tenVIP",
    name: "Alta Sociedade",
    description: "Atenda 10 clientes VIP",
    icon: "🏰",
    category: "customer",
    requirement: { type: "vip", value: 10 },
    reward: { money: 10000, experience: 2500 },
    hidden: false,
  },

  // Conquistas de ferramentas
  firstUpgrade: {
    id: "firstUpgrade",
    name: "Primeiro Upgrade",
    description: "Faça seu primeiro upgrade de ferramenta",
    icon: "⬆️",
    category: "tools",
    requirement: { type: "upgrades", value: 1 },
    reward: { money: 500, experience: 100 },
    hidden: false,
  },
  fiveUpgrades: {
    id: "fiveUpgrades",
    name: "Colecionador",
    description: "Faça 5 upgrades de ferramentas",
    icon: "🔧",
    category: "tools",
    requirement: { type: "upgrades", value: 5 },
    reward: { money: 2000, experience: 500 },
    hidden: false,
  },
  tenUpgrades: {
    id: "tenUpgrades",
    name: "Mestre das Ferramentas",
    description: "Faça 10 upgrades de ferramentas",
    icon: "⚒️",
    category: "tools",
    requirement: { type: "upgrades", value: 10 },
    reward: { money: 5000, experience: 1500 },
    hidden: false,
  },
  allToolsMax: {
    id: "allToolsMax",
    name: "Ferramenta Total",
    description: "Todas as ferramentas no nível máximo",
    icon: "🔨",
    category: "tools",
    requirement: { type: "allToolsMax", value: 1 },
    reward: { money: 20000, experience: 5000 },
    hidden: true,
    secret: "⭐ SUPER SECRETO ⭐",
  },

  // Conquistas de garagem
  garageLevel2: {
    id: "garageLevel2",
    name: "Garagem Ampliada",
    description: "Expanda a garagem para o nível 2",
    icon: "🏠",
    category: "garage",
    requirement: { type: "garageLevel", value: 2 },
    reward: { money: 2000, experience: 500 },
    hidden: false,
  },
  garageLevel3: {
    id: "garageLevel3",
    name: "Oficina Profissional",
    description: "Expanda a garagem para o nível 3",
    icon: "🏢",
    category: "garage",
    requirement: { type: "garageLevel", value: 3 },
    reward: { money: 5000, experience: 1000 },
    hidden: false,
  },
  garageLevel4: {
    id: "garageLevel4",
    name: "Centro Automotivo",
    description: "Expanda a garagem para o nível 4",
    icon: "🏬",
    category: "garage",
    requirement: { type: "garageLevel", value: 4 },
    reward: { money: 10000, experience: 2000 },
    hidden: false,
  },
  garageLevel5: {
    id: "garageLevel5",
    name: "Mega Oficina",
    description: "Expanda a garagem para o nível 5",
    icon: "🏭",
    category: "garage",
    requirement: { type: "garageLevel", value: 5 },
    reward: { money: 20000, experience: 5000 },
    hidden: false,
  },
};

export class AchievementSystem {
  constructor() {
    this.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS));
    this.unlockedAchievements = [];
    this.stats = {
      jobsCompleted: 0,
      totalEarned: 0,
      perfectJobs: 0,
      vipCustomers: 0,
      upgradesDone: 0,
      partsBought: 0,
      fastJobs: 0,
      totalRepairs: 0,
      garageLevel: 1,
    };
    this.loadProgress();
  }

  loadProgress() {
    const saved = localStorage.getItem("achievementProgress");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.unlockedAchievements = data.unlockedAchievements || [];
        this.stats = data.stats || this.stats;
      } catch (e) {
        console.error("❌ Erro ao carregar conquistas:", e);
      }
    }
  }

  saveProgress() {
    const data = {
      unlockedAchievements: this.unlockedAchievements,
      stats: this.stats,
    };
    localStorage.setItem("achievementProgress", JSON.stringify(data));
  }

  // ===== MÉTODO PRINCIPAL PARA VERIFICAR CONQUISTAS =====
  checkAchievement(achievementId, value = 1) {

    // Verificar por ID específico
    if (achievementId && this.achievements[achievementId]) {
      this.unlockAchievement(achievementId);
      return [this.achievements[achievementId]];
    }

    // Verificar por tipo (para compatibilidade com chamadas antigas)
    let unlocked = [];

    switch (achievementId) {
      case "jobCompleted":
        this.stats.jobsCompleted += value;
        unlocked = this.checkServiceAchievements();
        break;
      case "moneyEarned":
        this.stats.totalEarned += value;
        unlocked = this.checkMoneyAchievements();
        break;
      case "perfectJob":
        this.stats.perfectJobs += value;
        unlocked = this.checkQualityAchievements();
        break;
      case "vipCustomer":
        this.stats.vipCustomers += value;
        unlocked = this.checkCustomerAchievements();
        break;
      case "upgradeDone":
        this.stats.upgradesDone += value;
        unlocked = this.checkToolAchievements();
        break;
      case "partBought":
        this.stats.partsBought += value;
        unlocked = this.checkPartAchievements();
        break;
      case "fastJob":
        this.stats.fastJobs += value;
        unlocked = this.checkTimeAchievements();
        break;
      case "garageUpgraded":
        this.stats.garageLevel = value || this.stats.garageLevel + 1;
        unlocked = this.checkGarageAchievements();
        break;
    }

    if (unlocked.length > 0) {
      this.saveProgress();
    }

    return unlocked;
  }

  // ===== MÉTODOS DE VERIFICAÇÃO POR CATEGORIA =====

  checkServiceAchievements() {
    const unlocked = [];
    const serviceAchievements = [
      "firstJob",
      "fiveJobs",
      "tenJobs",
      "twentyFiveJobs",
      "fiftyJobs",
      "hundredJobs",
    ];

    serviceAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.jobsCompleted >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkMoneyAchievements() {
    const unlocked = [];
    const moneyAchievements = [
      "firstThousand",
      "tenThousand",
      "fiftyThousand",
      "hundredThousand",
    ];

    moneyAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.totalEarned >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkQualityAchievements() {
    const unlocked = [];
    const qualityAchievements = ["perfectJob", "fivePerfect", "tenPerfect"];

    qualityAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.perfectJobs >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkCustomerAchievements() {
    const unlocked = [];
    const customerAchievements = ["firstVIP", "fiveVIP", "tenVIP"];

    customerAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.vipCustomers >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkToolAchievements() {
    const unlocked = [];
    const toolAchievements = ["firstUpgrade", "fiveUpgrades", "tenUpgrades"];

    toolAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.upgradesDone >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    if (!this.isUnlocked("allToolsMax") && window.upgradeManager) {
      const allMax = Object.values(window.upgradeManager.toolLevels).every(
        (level) => level >= 5,
      );
      if (allMax) {
        this.unlockAchievement("allToolsMax");
        unlocked.push(this.achievements.allToolsMax);
      }
    }

    return unlocked;
  }

  checkPartAchievements() {
    const unlocked = [];
    const partAchievements = ["firstPart", "tenParts", "fiftyParts"];

    partAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.partsBought >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkTimeAchievements() {
    const unlocked = [];
    const timeAchievements = ["speedDemon", "fiveFastJobs"];

    timeAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.fastJobs >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  checkGarageAchievements() {
    const unlocked = [];
    const garageAchievements = [
      "garageLevel2",
      "garageLevel3",
      "garageLevel4",
      "garageLevel5",
    ];

    garageAchievements.forEach((id) => {
      const ach = this.achievements[id];
      if (ach && !this.isUnlocked(id)) {
        if (this.stats.garageLevel >= ach.requirement.value) {
          this.unlockAchievement(id);
          unlocked.push(ach);
        }
      }
    });

    return unlocked;
  }

  // ===== MÉTODO PARA DESBLOQUEAR CONQUISTA =====
  unlockAchievement(id) {
    const achievement = this.achievements[id];
    if (!achievement || this.unlockedAchievements.includes(id)) return false;

    this.unlockedAchievements.push(id);

    // Aplicar recompensas - SEM CHAMAR updateMoney diretamente
    if (achievement.reward) {
      if (achievement.reward.money && window.gameState) {
        // Usar flag para evitar loop
        window.gameState.isUpdatingFromAchievement = true;
        try {
          window.gameState.money += achievement.reward.money;
          window.gameState.updateMoney(); // Vai chamar, mas flag vai impedir loop
        } finally {
          window.gameState.isUpdatingFromAchievement = false;
        }
      }
      if (achievement.reward.experience && window.gameState) {
        window.gameState.isUpdatingFromAchievement = true;
        try {
          window.gameState.addExperience(achievement.reward.experience);
        } finally {
          window.gameState.isUpdatingFromAchievement = false;
        }
      }
    }


    // Mostrar notificação - SEM CHECAR CONQUISTAS NOVAMENTE
    if (window.uiManager) {
      window.uiManager.showAchievementNotification(achievement);
    }

    this.saveProgress();
    return true;
  }

  // ===== MÉTODOS DE UTILIDADE =====

  isUnlocked(id) {
    return this.unlockedAchievements.includes(id);
  }

  getProgress() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.unlockedAchievements.length;
    const percentage = total > 0 ? Math.floor((unlocked / total) * 100) : 0;

    return {
      total,
      unlocked,
      percentage,
      recentUnlocked: this.getRecentUnlocked(5),
    };
  }

  getRecentUnlocked(count) {
    return this.unlockedAchievements
      .slice(-count)
      .map((id) => this.achievements[id])
      .filter((a) => a);
  }

  getAchievementsByCategory(category) {
    return Object.values(this.achievements)
      .filter((ach) => ach.category === category)
      .map((ach) => ({
        ...ach,
        unlocked: this.isUnlocked(ach.id),
      }));
  }

  getAllAchievements() {
    return Object.values(this.achievements).map((ach) => ({
      ...ach,
      unlocked: this.isUnlocked(ach.id),
    }));
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.unlockedAchievements = [];
    this.stats = {
      jobsCompleted: 0,
      totalEarned: 0,
      perfectJobs: 0,
      vipCustomers: 0,
      upgradesDone: 0,
      partsBought: 0,
      fastJobs: 0,
      totalRepairs: 0,
      garageLevel: 1,
    };
    localStorage.removeItem("achievementProgress");
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.AchievementSystem = AchievementSystem;
  window.ACHIEVEMENTS = ACHIEVEMENTS;
}

// Garantir que o método checkAchievement existe (caso algo sobrescreva)
if (AchievementSystem.prototype.checkAchievement === undefined) {
  console.warn("⚠️ checkAchievement não encontrado, adicionando...");
  AchievementSystem.prototype.checkAchievement = function (
    achievementId,
    value = 1,
  ) {

    // Verificar por ID específico
    if (achievementId && this.achievements[achievementId]) {
      this.unlockAchievement(achievementId);
      return [this.achievements[achievementId]];
    }
    return [];
  };
}
