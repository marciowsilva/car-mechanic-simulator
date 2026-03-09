// src/systems/achievements/AchievementSystem.js - VERSÃO MÍNIMA

export class AchievementSystem {
    constructor() {
        this.achievements = {};
    }
    
    checkAchievements() {}
    unlockAchievement(id) {}
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.AchievementSystem = AchievementSystem;
}
