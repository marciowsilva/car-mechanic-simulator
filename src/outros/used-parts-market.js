// used-parts-market.js - Sistema de mercado de peças usadas

import { PART_TRANSLATIONS } from './constants.js';

export class UsedPartsMarket {
    constructor() {
        this.availableParts = [];
        this.refreshCooldown = 5 * 60 * 1000; // 5 minutos em ms
        this.lastRefresh = Date.now();
        this.maxOffers = 8;
        this.refreshMarket();
    }

    // Gerar uma peça usada aleatória
    generateUsedPart() {
        const partNames = Object.keys(PART_TRANSLATIONS);
        const partName = partNames[Math.floor(Math.random() * partNames.length)];
        const partData = PART_TRANSLATIONS[partName];
        
        // Condição entre 30% e 90%
        const condition = 30 + Math.floor(Math.random() * 60);
        
        // Preço base reduzido (40-70% do preço original)
        const priceMultiplier = 0.4 + (Math.random() * 0.3);
        const originalPrice = partData.basePrice;
        const price = Math.floor(originalPrice * priceMultiplier * (condition / 100));
        
        // Desconto em relação ao preço novo
        const discount = Math.round((1 - (price / originalPrice)) * 100);
        
        // Raridade (0-100, quanto maior mais raro)
        const rarity = Math.floor(Math.random() * 100);
        
        return {
            id: `used_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            partName,
            displayName: partData.display,
            icon: partData.icon,
            condition,
            price,
            originalPrice,
            discount,
            rarity,
            quality: this.getQualityLabel(condition),
            isPremium: rarity > 80, // Peças raras (top 20%)
            expiresIn: 30 * 60 * 1000 // 30 minutos
        };
    }

    // Obter rótulo de qualidade baseado na condição
    getQualityLabel(condition) {
        if (condition >= 80) return 'Excelente';
        if (condition >= 60) return 'Bom';
        if (condition >= 40) return 'Regular';
        return 'Desgastado';
    }

    // Atualizar o mercado
    refreshMarket() {
        const now = Date.now();
        
        // Verificar se pode atualizar
        if (now - this.lastRefresh < this.refreshCooldown && this.availableParts.length > 0) {
            return false;
        }
        
        // Remover peças expiradas
        this.availableParts = this.availableParts.filter(part => {
            return (now - part.createdAt || now) < part.expiresIn;
        });
        
        // Preencher até o máximo
        while (this.availableParts.length < this.maxOffers) {
            const newPart = this.generateUsedPart();
            newPart.createdAt = now;
            this.availableParts.push(newPart);
        }
        
        this.lastRefresh = now;
        return true;
    }

    // Forçar atualização (gastando dinheiro)
    forceRefresh() {
        const cost = 500;
        if (gameState.money >= cost) {
            gameState.updateMoney(-cost);
            this.availableParts = [];
            this.refreshMarket();
            return { success: true, message: '🔄 Mercado atualizado!' };
        }
        return { success: false, message: '💰 Dinheiro insuficiente!' };
    }

    // Comprar uma peça
    buyPart(partId) {
        const partIndex = this.availableParts.findIndex(p => p.id === partId);
        if (partIndex === -1) {
            return { success: false, message: '❌ Peça não disponível' };
        }
        
        const part = this.availableParts[partIndex];
        
        if (gameState.money < part.price) {
            return { success: false, message: '💰 Dinheiro insuficiente!' };
        }
        
        gameState.updateMoney(-part.price);
        
        // Adicionar ao estoque (condição reduzida)
        const inventory = window.inventory;
        if (inventory) {
            inventory.addPart(part.partName);
        }
        
        // Remover do mercado
        this.availableParts.splice(partIndex, 1);
        
        // Gerar uma nova peça para substituir
        if (this.availableParts.length < this.maxOffers) {
            const newPart = this.generateUsedPart();
            newPart.createdAt = Date.now();
            this.availableParts.push(newPart);
        }
        
        return { 
            success: true, 
            message: `✅ Comprou ${part.displayName} usada por R$ ${part.price}!`,
            part: part
        };
    }

    // Obter estatísticas do mercado
    getStats() {
        const now = Date.now();
        const timeUntilRefresh = Math.max(0, this.refreshCooldown - (now - this.lastRefresh));
        const minutesLeft = Math.floor(timeUntilRefresh / 60000);
        const secondsLeft = Math.floor((timeUntilRefresh % 60000) / 1000);
        
        const avgDiscount = this.availableParts.reduce((sum, p) => sum + p.discount, 0) / this.availableParts.length || 0;
        const avgCondition = this.availableParts.reduce((sum, p) => sum + p.condition, 0) / this.availableParts.length || 0;
        
        return {
            availableCount: this.availableParts.length,
            maxOffers: this.maxOffers,
            timeUntilRefresh,
            refreshTime: `${minutesLeft}m ${secondsLeft}s`,
            avgDiscount: Math.round(avgDiscount),
            avgCondition: Math.round(avgCondition),
            premiumCount: this.availableParts.filter(p => p.isPremium).length
        };
    }

    // Obter peças por categoria
    getPartsByQuality(quality) {
        return this.availableParts.filter(p => p.quality === quality);
    }

    getPremiumParts() {
        return this.availableParts.filter(p => p.isPremium);
    }

    getCheapestParts(limit = 3) {
        return [...this.availableParts].sort((a, b) => a.price - b.price).slice(0, limit);
    }

    getBestDeals(limit = 3) {
        return [...this.availableParts].sort((a, b) => b.discount - a.discount).slice(0, limit);
    }
}