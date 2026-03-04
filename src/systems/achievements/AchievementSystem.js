// achievement-system.js
import { gameState } from './game.js';

export class AchievementSystem {
    constructor() {
        this.achievements = {
            firstJob: { earned: false, name: 'Primeiro Serviço', desc: 'Complete seu primeiro serviço', icon: '🔰' },
            fiveJobs: { earned: false, name: 'Mecânico Iniciante', desc: 'Complete 5 serviços', icon: '🔧' },
            tenJobs: { earned: false, name: 'Mecânico Experiente', desc: 'Complete 10 serviços', icon: '⚙️' },
            perfectJob: { earned: false, name: 'Perfeição', desc: 'Entregue um carro com todas as peças em 100%', icon: '✨' },
            richMechanic: { earned: false, name: 'Mecânico Rico', desc: 'Acumule R$ 20.000', icon: '💰' },
            toolMaster: { earned: false, name: 'Mestre das Ferramentas', desc: 'Upgrade todas ferramentas ao nível máximo', icon: '🔨' }
        };
    }
    
    checkAchievements() {
        if (gameState.jobsCompleted >= 1 && !this.achievements.firstJob.earned) {
            this.unlockAchievement('firstJob');
        }
        if (gameState.jobsCompleted >= 5 && !this.achievements.fiveJobs.earned) {
            this.unlockAchievement('fiveJobs');
        }
        if (gameState.jobsCompleted >= 10 && !this.achievements.tenJobs.earned) {
            this.unlockAchievement('tenJobs');
        }
        if (gameState.money >= 20000 && !this.achievements.richMechanic.earned) {
            this.unlockAchievement('richMechanic');
        }
    }
    
    unlockAchievement(id) {
        if (this.achievements[id] && !this.achievements[id].earned) {
            this.achievements[id].earned = true;
            this.showAchievementPopup(this.achievements[id]);
            gameState.updateMoney(500);
        }
    }
    
    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        document.getElementById('achievement-icon').textContent = achievement.icon;
        document.getElementById('achievement-title').textContent = achievement.name;
        document.getElementById('achievement-desc').textContent = achievement.desc;
        
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.classList.remove('show');
        }, 5000);
    }
}