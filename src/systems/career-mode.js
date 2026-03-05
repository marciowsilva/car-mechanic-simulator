// src/systems/career-mode.js

export const CAREER_LEVELS = {
    1: { name: 'Mecânico Aprendiz', reputationRequired: 0 },
    2: { name: 'Mecânico Iniciante', reputationRequired: 10 },
    3: { name: 'Mecânico Profissional', reputationRequired: 25 },
    4: { name: 'Mestre Mecânico', reputationRequired: 50 },
    5: { name: 'Especialista Chefe', reputationRequired: 100 },
    6: { name: 'Lendário', reputationRequired: 200 }
};

export class CareerMode {
    constructor() {
        this.currentLevel = 1;
        this.progress = {
            reputation: 0,
            jobsCompleted: 0
        };
    }

    getStats() {
        return {
            currentLevel: this.currentLevel,
            progress: this.progress,
            nextLevel: this.getNextLevelProgress()
        };
    }

    getNextLevelProgress() {
        if (this.currentLevel >= 6) return { maxLevel: true };
        const nextLevel = CAREER_LEVELS[this.currentLevel + 1];
        return {
            name: nextLevel.name,
            requirements: {
                reputation: {
                    current: this.progress.reputation,
                    required: nextLevel.reputationRequired
                }
            }
        };
    }

    isFeatureUnlocked(feature) {
        return this.currentLevel >= 3; // Simplificado
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.CareerMode = CareerMode;
    console.log('🌐 CareerMode disponível globalmente');
}
