// src/minigames/OilDrainGame.js - Minigame de troca de óleo

import { MinigameBase } from './MinigameBase.js';

export class OilDrainGame extends MinigameBase {
    constructor(difficulty = 1) {
        super('oilDrain', difficulty);
        this.oilLevel = 100;
        this.drainSpeed = 2 + difficulty;
        this.shakeIntensity = 0;
        this.spilled = false;
    }

    onStart() {
        this.oilLevel = 100;
        this.shakeIntensity = 0;
        this.spilled = false;
    }

    drain(amount = 1) {
        if (!this.isActive) return false;

        // Adicionar tremor baseado na pressa
        this.shakeIntensity += amount * 0.5;
        
        // Drenar óleo
        this.oilLevel = Math.max(0, this.oilLevel - amount * this.drainSpeed);
        
        // Chance de derramar baseado no tremor
        if (this.shakeIntensity > 20 && Math.random() < 0.1) {
            this.spilled = true;
            this.addMistake();
            this.shakeIntensity = 0;
        }

        // Verificar se completou
        if (this.oilLevel <= 0) {
            const result = this.end(!this.spilled);
            return result;
        }

        return true;
    }

    stabilize() {
        this.shakeIntensity = Math.max(0, this.shakeIntensity - 2);
    }

    onEnd(result) {
        if (result.success) {
            this.addScore(100 - this.mistakes * 20);
        }
    }

    render(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        // Desenjar container de óleo
        const containerWidth = width * 0.6;
        const containerHeight = height * 0.4;
        const containerX = (width - containerWidth) / 2;
        const containerY = height * 0.3;

        // Container vazio
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(containerX, containerY, containerWidth, containerHeight);

        // Óleo
        const oilHeight = (this.oilLevel / 100) * containerHeight;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(
            containerX,
            containerY + containerHeight - oilHeight,
            containerWidth,
            oilHeight
        );

        // Texto do nível
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Óleo: ${Math.round(this.oilLevel)}%`, width / 2, containerY - 10);

        // Indicador de tremor
        const shakePercent = (this.shakeIntensity / 30) * 100;
        ctx.fillStyle = shakePercent > 70 ? '#ff0000' : shakePercent > 30 ? '#ffaa00' : '#4CAF50';
        ctx.fillRect(containerX, containerY - 30, (containerWidth * shakePercent) / 100, 5);

        // Instruções
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText('Clique e segure para drenar | Solte para estabilizar', width / 2, height - 30);
        
        if (this.spilled) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('⚠️ ÓLEO DERRAMADO! ⚠️', width / 2, height / 2);
        }
    }
}