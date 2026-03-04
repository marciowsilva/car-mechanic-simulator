// career-mode.js - Sistema de modo carreira

export const CAREER_LEVELS = {
    1: {
        name: 'Mecânico Aprendiz',
        description: 'Começando sua jornada na mecânica',
        reputationRequired: 0,
        jobsRequired: 0,
        moneyRequired: 0,
        rewards: {
            money: 1000,
            experience: 500,
            garageLevel: 1,
            unlocks: ['básico']
        },
        icon: '🔰',
        color: '#888'
    },
    2: {
        name: 'Mecânico Iniciante',
        description: 'Já realiza reparos básicos com confiança',
        reputationRequired: 10,
        jobsRequired: 5,
        moneyRequired: 5000,
        rewards: {
            money: 2000,
            experience: 1000,
            garageLevel: 1,
            unlocks: ['diagnóstico-avançado', 'peças-usadas']
        },
        icon: '🔧',
        color: '#4CAF50'
    },
    3: {
        name: 'Mecânico Profissional',
        description: 'Domina as técnicas fundamentais da mecânica',
        reputationRequired: 25,
        jobsRequired: 15,
        moneyRequired: 15000,
        rewards: {
            money: 4000,
            experience: 2000,
            garageLevel: 2,
            unlocks: ['elevador', 'especializações']
        },
        icon: '⚙️',
        color: '#2196F3'
    },
    4: {
        name: 'Mestre Mecânico',
        description: 'Conhecimento avançado em todas as áreas',
        reputationRequired: 50,
        jobsRequired: 30,
        moneyRequired: 30000,
        rewards: {
            money: 8000,
            experience: 4000,
            garageLevel: 2,
            unlocks: ['pintura', 'alinhamento']
        },
        icon: '🔨',
        color: '#9C27B0'
    },
    5: {
        name: 'Especialista Chefe',
        description: 'Referência na região em reparos complexos',
        reputationRequired: 100,
        jobsRequired: 50,
        moneyRequired: 50000,
        rewards: {
            money: 15000,
            experience: 8000,
            garageLevel: 3,
            unlocks: ['preparação-motor', 'turbo']
        },
        icon: '🏆',
        color: '#ff6b00'
    },
    6: {
        name: 'Lendário',
        description: 'Sua fama se espalha por todo o estado',
        reputationRequired: 200,
        jobsRequired: 100,
        moneyRequired: 100000,
        rewards: {
            money: 30000,
            experience: 15000,
            garageLevel: 4,
            unlocks: ['personalização', 'conversões']
        },
        icon: '👑',
        color: '#ffd700'
    }
};

export class CareerMode {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = Object.keys(CAREER_LEVELS).length;
        this.progress = {
            reputation: 0,
            jobsCompleted: 0,
            moneyEarned: 0,
            moneySpent: 0,
            perfectJobs: 0,
            vipCustomers: 0,
            partsUsed: 0,
            toolsUpgraded: 0
        };
        this.unlockedFeatures = ['básico'];
        this.achievements = [];
        this.tournaments = [];
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('careerProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentLevel = data.currentLevel || 1;
                this.progress = data.progress || this.progress;
                this.unlockedFeatures = data.unlockedFeatures || ['básico'];
            } catch (e) {
                console.error('Erro ao carregar progresso da carreira:', e);
            }
        }
        this.updateLevel();
    }

    saveProgress() {
        const data = {
            currentLevel: this.currentLevel,
            progress: this.progress,
            unlockedFeatures: this.unlockedFeatures
        };
        localStorage.setItem('careerProgress', JSON.stringify(data));
    }

    updateLevel() {
        // Verificar se atingiu os requisitos para próximo nível
        for (let level = this.currentLevel + 1; level <= this.maxLevel; level++) {
            const requirements = CAREER_LEVELS[level];
            if (!requirements) continue;

            if (this.progress.reputation >= requirements.reputationRequired &&
                this.progress.jobsCompleted >= requirements.jobsRequired &&
                this.progress.moneyEarned >= requirements.moneyRequired) {
                
                this.currentLevel = level;
                this.unlockFeatures(level);
                this.applyRewards(level);
                this.saveProgress();
                
                return {
                    leveledUp: true,
                    newLevel: level,
                    rewards: requirements.rewards
                };
            }
        }
        return { leveledUp: false };
    }

    unlockFeatures(level) {
        const features = CAREER_LEVELS[level]?.rewards.unlocks || [];
        features.forEach(feature => {
            if (!this.unlockedFeatures.includes(feature)) {
                this.unlockedFeatures.push(feature);
            }
        });
    }

    applyRewards(level) {
        const rewards = CAREER_LEVELS[level]?.rewards;
        if (!rewards) return;

        // Aplicar recompensas
        gameState.updateMoney(rewards.money);
        gameState.addExperience(rewards.experience);
        
        // Melhorar garagem se necessário
        if (rewards.garageLevel > 1 && window.garageSystem) {
            while (garageSystem.currentLevel < rewards.garageLevel) {
                garageSystem.buyUpgrade();
            }
        }

        window.uiManager?.showNotification(`🎉 Atingiu nível ${level}: ${CAREER_LEVELS[level].name}!`, 'success');
    }

    // Registrar eventos para progresso
    onJobCompleted(job) {
        this.progress.jobsCompleted++;
        this.progress.moneyEarned += job.payment;
        
        if (job.quality >= 95) {
            this.progress.perfectJobs++;
        }
        
        const result = this.updateLevel();
        this.saveProgress();
        return result;
    }

    onCustomerServed(customer) {
        this.progress.reputation += 5;
        if (customer.status === 'vip') {
            this.progress.vipCustomers++;
        }
        
        const result = this.updateLevel();
        this.saveProgress();
        return result;
    }

    onPartUsed(partName) {
        this.progress.partsUsed++;
        this.saveProgress();
    }

    onToolUpgraded(toolId) {
        this.progress.toolsUpgraded++;
        this.saveProgress();
    }

    onMoneySpent(amount) {
        this.progress.moneySpent += amount;
        this.saveProgress();
    }

    // Verificar se feature está desbloqueada
    isFeatureUnlocked(feature) {
        return this.unlockedFeatures.includes(feature);
    }

    // Obter progresso para o próximo nível
    getNextLevelProgress() {
        if (this.currentLevel >= this.maxLevel) {
            return {
                maxLevel: true,
                message: 'Nível máximo atingido!'
            };
        }

        const nextLevel = CAREER_LEVELS[this.currentLevel + 1];
        const progress = {
            level: this.currentLevel + 1,
            name: nextLevel.name,
            icon: nextLevel.icon,
            color: nextLevel.color,
            requirements: {
                reputation: {
                    current: this.progress.reputation,
                    required: nextLevel.reputationRequired,
                    percentage: Math.min(100, (this.progress.reputation / nextLevel.reputationRequired) * 100)
                },
                jobs: {
                    current: this.progress.jobsCompleted,
                    required: nextLevel.jobsRequired,
                    percentage: Math.min(100, (this.progress.jobsCompleted / nextLevel.jobsRequired) * 100)
                },
                money: {
                    current: this.progress.moneyEarned,
                    required: nextLevel.moneyRequired,
                    percentage: Math.min(100, (this.progress.moneyEarned / nextLevel.moneyRequired) * 100)
                }
            },
            rewards: nextLevel.rewards
        };

        return progress;
    }

    // Obter estatísticas da carreira
    getStats() {
        const currentLevelData = CAREER_LEVELS[this.currentLevel];
        
        return {
            currentLevel: this.currentLevel,
            levelName: currentLevelData.name,
            levelIcon: currentLevelData.icon,
            levelColor: currentLevelData.color,
            progress: this.progress,
            unlockedFeatures: this.unlockedFeatures,
            nextLevel: this.getNextLevelProgress()
        };
    }

    // Calcular bônus baseado no nível
    getCareerBonus() {
        return {
            reputation: this.progress.reputation * 0.1, // +10% por ponto de reputação
            jobs: this.progress.jobsCompleted * 0.05,    // +5% por job completado
            money: this.progress.moneyEarned * 0.001     // +0.1% por real ganho
        };
    }

    // Desbloquear conquista
    unlockAchievement(achievementId) {
        if (!this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            this.saveProgress();
            return true;
        }
        return false;
    }

    // Participar de torneio
    enterTournament(tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (tournament && !tournament.entered) {
            tournament.entered = true;
            this.saveProgress();
            return true;
        }
        return false;
    }
}