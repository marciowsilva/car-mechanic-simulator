// src/minigames/MinigameBase.js - Sistema base para todos os minigames

export class MinigameBase {
    constructor(equipmentId, difficulty = 1) {
        this.equipmentId = equipmentId;
        this.difficulty = difficulty;
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.score = 0;
        this.maxScore = 100;
        this.mistakes = 0;
        this.maxMistakes = 3;
    }

    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.score = 0;
        this.mistakes = 0;
        console.log(`🎮 Minigame iniciado: ${this.equipmentId}`);
        this.onStart();
    }

    end(success = true) {
        this.isActive = false;
        this.endTime = Date.now();
        const timeSpent = (this.endTime - this.startTime) / 1000;
        
        const result = {
            success: success,
            score: this.score,
            maxScore: this.maxScore,
            mistakes: this.mistakes,
            timeSpent: timeSpent,
            bonus: this.calculateBonus()
        };

        this.onEnd(result);
        return result;
    }

    calculateBonus() {
        let bonus = 0;
        
        // Bônus por tempo
        const timeSpent = (this.endTime - this.startTime) / 1000;
        const expectedTime = 30 - (this.difficulty * 5);
        if (timeSpent < expectedTime) {
            bonus += Math.floor((expectedTime - timeSpent) * 10);
        }

        // Bônus por pontuação
        if (this.score >= this.maxScore * 0.9) {
            bonus += 200;
        } else if (this.score >= this.maxScore * 0.7) {
            bonus += 100;
        }

        // Penalidade por erros
        bonus -= this.mistakes * 50;

        return Math.max(0, bonus);
    }

    addScore(points) {
        this.score = Math.min(this.maxScore, this.score + points);
    }

    addMistake() {
        this.mistakes++;
        if (this.mistakes >= this.maxMistakes) {
            this.end(false);
        }
    }

    onStart() {
        // Para sobrescrever nas subclasses
    }

    onEnd(result) {
        // Para sobrescrever nas subclasses
    }

    getProgress() {
        return (this.score / this.maxScore) * 100;
    }

    getTimeRemaining() {
        if (!this.isActive) return 0;
        const elapsed = (Date.now() - this.startTime) / 1000;
        return Math.max(0, 30 - elapsed);
    }
}