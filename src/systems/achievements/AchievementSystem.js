// src/systems/achievements/AchievementSystem.js - VERSÃO MÍNIMA

export class AchievementSystem {
    constructor() {
        console.log('🏆 AchievementSystem (mínimo) inicializado');
        this.achievements = {};
    }
    
    checkAchievements() {}
    unlockAchievement(id) {}
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.AchievementSystem = AchievementSystem;
    console.log('🌐 AchievementSystem disponível globalmente');
}
