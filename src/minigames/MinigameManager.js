// src/minigames/MinigameManager.js - Gerenciador de minigames

import { WheelBalancerGame } from './WheelBalancerGame.js';
import { OilDrainGame } from './OilDrainGame.js';

export class MinigameManager {
    constructor() {
        this.currentGame = null;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.isRunning = false;
        this.rewards = {
            money: 0,
            experience: 0,
            parts: []
        };
    }

    startGame(gameType, difficulty = 1) {
        // Criar canvas se não existir
        if (!this.canvas) {
            this.createCanvas();
        }

        // Criar instância do minigame
        switch(gameType) {
            case 'wheelBalancer':
                this.currentGame = new WheelBalancerGame(difficulty);
                break;
            case 'oilDrain':
                this.currentGame = new OilDrainGame(difficulty);
                break;
            default:
                console.error('Minigame não encontrado:', gameType);
                return;
        }

        this.currentGame.start();
        this.isRunning = true;
        this.setupControls();
        this.animate();

        // Mostrar canvas
        this.canvas.style.display = 'block';
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minigame-canvas';
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ff6b00;
            border-radius: 10px;
            z-index: 10000;
            display: none;
            cursor: pointer;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    setupControls() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.endGame(false);
            }
        });
    }

    onMouseDown(e) {
        if (!this.currentGame || !this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Diferentes ações baseadas no jogo atual
        if (this.currentGame instanceof WheelBalancerGame) {
            // Adicionar peso na posição clicada
            const angle = this.getAngleFromPosition(x, y);
            if (angle !== null) {
                this.currentGame.addWeight(angle);
            }
        } else if (this.currentGame instanceof OilDrainGame) {
            // Começar a drenar
            this.drainInterval = setInterval(() => {
                if (this.currentGame && this.isRunning) {
                    this.currentGame.drain();
                }
            }, 100);
        }
    }

    onMouseUp() {
        if (this.drainInterval) {
            clearInterval(this.drainInterval);
            this.drainInterval = null;
        }
        if (this.currentGame instanceof OilDrainGame) {
            this.currentGame.stabilize();
        }
    }

    onMouseMove(e) {
        // Para jogos que precisam de posição do mouse
    }

    onKeyDown(e) {
        if (!this.currentGame || !this.isRunning) return;

        if (e.key === 'r' || e.key === 'R') {
            if (this.currentGame instanceof WheelBalancerGame) {
                // Remover último peso
                const weights = this.currentGame.weights;
                if (weights.length > 0) {
                    this.currentGame.removeWeight(weights.length - 1);
                }
            }
        }
    }

    getAngleFromPosition(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const dx = x - centerX;
        const dy = y - centerY;
        
        // Calcular ângulo em graus
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle = (angle + 360) % 360;
        
        return angle;
    }

    animate() {
        if (!this.isRunning || !this.currentGame) return;

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Renderizar jogo atual
        this.currentGame.render(this.ctx, this.canvas.width, this.canvas.height);

        // Verificar tempo
        const timeLeft = this.currentGame.getTimeRemaining();
        if (timeLeft <= 0) {
            this.endGame(false);
            return;
        }

        // Continuar animação
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    endGame(success) {
        if (!this.currentGame) return;

        const result = success ? this.currentGame.end(true) : this.currentGame.end(false);
        
        // Calcular recompensas
        this.rewards = {
            money: Math.floor(result.score * 10 + result.bonus),
            experience: Math.floor(result.score / 2 + result.bonus / 10),
            parts: this.generatePartReward(result.score)
        };

        // Aplicar recompensas
        if (window.gameState) {
            window.gameState.money += this.rewards.money;
            window.gameState.addExperience(this.rewards.experience);
            
            if (this.rewards.parts.length > 0 && window.inventory) {
                this.rewards.parts.forEach(part => {
                    window.inventory.addPart(part);
                });
            }
        }

        // Mostrar resultados
        this.showResults();

        // Limpar
        this.isRunning = false;
        this.currentGame = null;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.canvas.style.display = 'none';

        // Notificar
        window.uiManager?.showNotification(
            `🎮 Minigame ${success ? 'concluído' : 'falhou'}! Recompensa: R$ ${this.rewards.money}`,
            success ? 'success' : 'error'
        );
    }

    generatePartReward(score) {
        const parts = [];
        if (score >= 80 && Math.random() < 0.3) {
            const possibleParts = ['motor', 'transmissao', 'freios', 'suspensao'];
            parts.push(possibleParts[Math.floor(Math.random() * possibleParts.length)]);
        }
        return parts;
    }

    showResults() {
        console.log('📊 Resultado do minigame:', this.rewards);
    }
}