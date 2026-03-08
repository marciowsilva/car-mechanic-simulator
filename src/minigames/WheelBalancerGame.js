// src/minigames/WheelBalancerGame.js - Minigame de balanceamento de rodas

import { MinigameBase } from './MinigameBase.js';

export class WheelBalancerGame extends MinigameBase {
    constructor(difficulty = 1) {
        super('wheelBalancer', difficulty);
        this.weights = [];
        this.targetPosition = 0;
        this.currentImbalance = 100;
        this.sensors = [];
    }

    onStart() {
        // Gerar posição aleatória do desbalanceamento (0-360 graus)
        this.targetPosition = Math.random() * 360;
        
        // Inicializar sensores
        for (let i = 0; i < 8; i++) {
            this.sensors.push({
                angle: i * 45,
                value: 0
            });
        }
        
        this.updateSensors();
    }

    updateSensors() {
        // Calcular leitura dos sensores baseado na posição do desbalanceamento
        this.sensors.forEach(sensor => {
            const angleDiff = Math.abs(sensor.angle - this.targetPosition);
            const normalizedDiff = Math.min(angleDiff, 360 - angleDiff) / 180;
            sensor.value = Math.max(0, 100 - (normalizedDiff * 200));
        });
    }

    addWeight(position, size = 1) {
        if (this.weights.length >= 5) {
            this.addMistake();
            return false;
        }

        this.weights.push({ position, size });
        this.calculateImbalance();
        
        // Se chegou perto o suficiente, ganha pontos
        if (this.currentImbalance < 5) {
            this.addScore(25);
        }
        
        return true;
    }

    removeWeight(index) {
        if (index >= 0 && index < this.weights.length) {
            this.weights.splice(index, 1);
            this.calculateImbalance();
            return true;
        }
        return false;
    }

    calculateImbalance() {
        // Calcular centro de massa dos pesos
        let totalWeight = 0;
        let weightedAngle = 0;
        
        this.weights.forEach(w => {
            totalWeight += w.size;
            weightedAngle += w.position * w.size;
        });

        const centerOfMass = totalWeight > 0 ? (weightedAngle / totalWeight) % 360 : 0;
        
        // Calcular diferença para a posição alvo
        let diff = Math.abs(centerOfMass - this.targetPosition);
        diff = Math.min(diff, 360 - diff);
        
        this.currentImbalance = Math.max(0, 100 - (diff * 100 / 180));
        
        // Verificar se completou
        if (this.currentImbalance >= 95) {
            this.addScore(50);
            setTimeout(() => this.end(true), 500);
        }
    }

    getImbalanceLevel() {
        if (this.currentImbalance < 30) return 'critical';
        if (this.currentImbalance < 60) return 'high';
        if (this.currentImbalance < 85) return 'medium';
        return 'low';
    }

    render(ctx, width, height) {
        // Desenhar círculo da roda
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        // Desenhar borda da roda
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Desenhar sensores
        this.sensors.forEach(sensor => {
            const angle = (sensor.angle * Math.PI) / 180;
            const x = centerX + Math.cos(angle) * radius * 0.8;
            const y = centerY + Math.sin(angle) * radius * 0.8;
            
            ctx.beginPath();
            ctx.arc(x, y, 5 + (sensor.value / 10), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${255 - sensor.value * 2}, 0, 0.8)`;
            ctx.fill();
        });

        // Desenhar pesos
        this.weights.forEach((weight, i) => {
            const angle = (weight.position * Math.PI) / 180;
            const x = centerX + Math.cos(angle) * radius * 0.6;
            const y = centerY + Math.sin(angle) * radius * 0.6;
            
            ctx.beginPath();
            ctx.arc(x, y, 10 * weight.size, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b00';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Número do peso
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i + 1, x, y);
        });

        // Desenhar indicador de desbalanceamento
        const imbalanceColor = {
            critical: '#ff0000',
            high: '#ff6600',
            medium: '#ffaa00',
            low: '#4CAF50'
        }[this.getImbalanceLevel()];

        ctx.fillStyle = imbalanceColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Desbalanceamento: ${Math.round(this.currentImbalance)}%`, centerX, 30);
        
        // Instruções
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Clique para adicionar pesos | R para remover último', centerX, height - 20);
    }
}