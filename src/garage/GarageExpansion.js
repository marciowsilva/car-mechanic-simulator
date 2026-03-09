// src/garage/GarageExpansion.js - Sistema de expansão da garagem

export class GarageExpansion {
    constructor() {
        
        // Níveis da garagem
        this.level = 1;
        this.maxLevel = 5;
        
        // Configurações por nível
        this.levels = {
            1: {
                name: 'Garagem Simples',
                price: 0,
                lifts: 1,
                workbenches: 1,
                storage: 50,
                decoration: 0,
                image: '🏚️',
                description: 'Espaço básico para começar'
            },
            2: {
                name: 'Garagem Ampliada',
                price: 10000,
                lifts: 2,
                workbenches: 2,
                storage: 100,
                decoration: 1,
                image: '🏠',
                description: 'Mais espaço e organização'
            },
            3: {
                name: 'Oficina Profissional',
                price: 25000,
                lifts: 3,
                workbenches: 3,
                storage: 200,
                decoration: 2,
                image: '🏢',
                description: 'Equipamentos profissionais'
            },
            4: {
                name: 'Centro Automotivo',
                price: 50000,
                lifts: 4,
                workbenches: 4,
                storage: 350,
                decoration: 3,
                image: '🏬',
                description: 'Múltiplos elevadores e máquinas'
            },
            5: {
                name: 'Mega Oficina',
                price: 100000,
                lifts: 5,
                workbenches: 5,
                storage: 500,
                decoration: 4,
                image: '🏭',
                description: 'O máximo em espaço e eficiência'
            }
        };

        // Decorações disponíveis
        this.decorations = {
            1: {
                name: 'Posters',
                items: ['poster1', 'poster2', 'poster3'],
                positions: []
            },
            2: {
                name: 'Plantas',
                items: ['planta1', 'planta2'],
                positions: []
            },
            3: {
                name: 'Troféus',
                items: ['trofeu1', 'trofeu2', 'trofeu3'],
                positions: []
            },
            4: {
                name: 'Letreiro',
                items: ['letreiro'],
                positions: []
            }
        };

        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('garageProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.level = data.level || 1;
                this.decorationsPlaced = data.decorationsPlaced || [];
            } catch (e) {
                console.error('❌ Erro ao carregar garagem:', e);
            }
        } else {
            this.decorationsPlaced = [];
        }
    }

    saveProgress() {
        const data = {
            level: this.level,
            decorationsPlaced: this.decorationsPlaced
        };
        localStorage.setItem('garageProgress', JSON.stringify(data));
    }

    // Expansão da garagem
    expand() {
        if (this.level >= this.maxLevel) {
            return {
                success: false,
                message: '❌ Nível máximo já atingido!'
            };
        }

        const nextLevel = this.level + 1;
        const cost = this.levels[nextLevel].price;

        if (window.gameState && window.gameState.money >= cost) {
            window.gameState.money -= cost;
            this.level = nextLevel;
            this.saveProgress();

            // Registrar conquista
            if (window.achievementSystem) {
                window.achievementSystem.checkAchievement('garageUpgraded');
            }

            return {
                success: true,
                message: `🏢 Garagem expandida para ${this.levels[nextLevel].name}!`,
                newLevel: nextLevel,
                cost: cost
            };
        }

        return {
            success: false,
            message: '💰 Dinheiro insuficiente para expansão'
        };
    }

    // Adicionar decoração
    addDecoration(decorationType, position) {
        if (this.level < 2) {
            return {
                success: false,
                message: '❌ Expanda a garagem primeiro!'
            };
        }

        const decoration = this.decorations[decorationType];
        if (!decoration) {
            return {
                success: false,
                message: '❌ Decoração inválida'
            };
        }

        const cost = 1000 * decorationType; // Custo base por nível de decoração

        if (window.gameState && window.gameState.money >= cost) {
            window.gameState.money -= cost;
            this.decorationsPlaced.push({
                type: decorationType,
                position: position,
                item: decoration.items[Math.floor(Math.random() * decoration.items.length)]
            });
            this.saveProgress();

            return {
                success: true,
                message: `✨ Decoração adicionada!`,
                cost: cost
            };
        }

        return {
            success: false,
            message: '💰 Dinheiro insuficiente'
        };
    }

    // Remover decoração
    removeDecoration(index) {
        if (index >= 0 && index < this.decorationsPlaced.length) {
            this.decorationsPlaced.splice(index, 1);
            this.saveProgress();
            return {
                success: true,
                message: '🗑️ Decoração removida'
            };
        }
        return {
            success: false,
            message: '❌ Decoração não encontrada'
        };
    }

    // Obter benefícios do nível atual
    getBenefits() {
        const level = this.levels[this.level];
        return {
            lifts: level.lifts,
            workbenches: level.workbenches,
            storage: level.storage,
            decorationSlots: level.decoration,
            repairSpeedBonus: this.level * 10, // +10% por nível
            partDiscount: this.level * 2, // +2% de desconto por nível
            experienceBonus: this.level * 5 // +5% XP por nível
        };
    }

    // Obter estatísticas
    getStats() {
        const current = this.levels[this.level];
        const next = this.level < this.maxLevel ? this.levels[this.level + 1] : null;
        const benefits = this.getBenefits();

        return {
            level: this.level,
            maxLevel: this.maxLevel,
            currentName: current.name,
            currentImage: current.image,
            currentDescription: current.description,
            nextLevel: next ? {
                name: next.name,
                price: next.price,
                image: next.image
            } : null,
            benefits: benefits,
            decorations: this.decorationsPlaced,
            decorationSlotsUsed: this.decorationsPlaced.length,
            decorationSlotsTotal: current.decoration,
            progress: (this.level / this.maxLevel) * 100
        };
    }

    // Calcular bônus de reparo
    getRepairBonus() {
        return this.level * 10;
    }

    // Calcular desconto em peças
    getDiscountBonus() {
        return this.level * 2;
    }

    // Calcular bônus de experiência
    getExpBonus() {
        return this.level * 5;
    }
}