// src/systems/EconomySystem.js - Sistema de economia e loja

export class EconomySystem {
    constructor() {
        console.log('💰 Inicializando EconomySystem...');
        
        // Preços base das peças
        this.basePrices = {
            motor: 800,
            transmissao: 600,
            freios: 300,
            suspensao: 400,
            bateria: 150,
            alternador: 250,
            radiador: 200,
            escapamento: 180,
            turbo: 1200,
            diferencial: 500,
            embreagem: 350,
            sensor: 120,
            eletronica: 450
        };

        // Multiplicadores de raridade
        this.rarityMultipliers = {
            comum: 1.0,
            incomum: 1.3,
            raro: 1.8,
            epico: 2.5,
            lendario: 4.0
        };

        // Ofertas especiais
        this.specials = [];
        this.generateDailyOffers();

        // Histórico de transações
        this.transactionHistory = [];
        this.totalSpent = 0;
        this.totalEarned = 0;
    }

    // Gerar ofertas diárias
    generateDailyOffers() {
        this.specials = [];
        const partTypes = Object.keys(this.basePrices);
        const numberOfOffers = 3 + Math.floor(Math.random() * 3); // 3-5 ofertas
        
        for (let i = 0; i < numberOfOffers; i++) {
            const partType = partTypes[Math.floor(Math.random() * partTypes.length)];
            const discount = 20 + Math.floor(Math.random() * 30); // 20-50% de desconto
            const rarity = this.getRandomRarity();
            
            this.specials.push({
                id: `special_${Date.now()}_${i}`,
                partType: partType,
                partName: this.getPartDisplayName(partType),
                discount: discount,
                rarity: rarity,
                originalPrice: this.basePrices[partType],
                price: Math.floor(this.basePrices[partType] * (1 - discount/100) * this.rarityMultipliers[rarity]),
                expiresIn: 24 * 60 * 60 * 1000, // 24 horas
                createdAt: Date.now()
            });
        }
    }

    getRandomRarity() {
        const rarities = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
        const weights = [0.5, 0.25, 0.15, 0.07, 0.03]; // Probabilidades
        const rand = Math.random();
        let sum = 0;
        
        for (let i = 0; i < rarities.length; i++) {
            sum += weights[i];
            if (rand < sum) return rarities[i];
        }
        return 'comum';
    }

    getPartDisplayName(partName) {
        const names = {
            motor: 'Motor',
            transmissao: 'Transmissão',
            freios: 'Freios',
            suspensao: 'Suspensão',
            bateria: 'Bateria',
            alternador: 'Alternador',
            radiador: 'Radiador',
            escapamento: 'Escapamento',
            turbo: 'Turbo',
            diferencial: 'Diferencial',
            embreagem: 'Embreagem',
            sensor: 'Sensor',
            eletronica: 'Eletrônica'
        };
        return names[partName] || partName;
    }

    // Calcular preço de peça com todos os modificadores
    calculatePartPrice(partType, rarity = 'comum', quantity = 1) {
        const basePrice = this.basePrices[partType] || 500;
        const rarityMultiplier = this.rarityMultipliers[rarity] || 1.0;
        const quantityDiscount = quantity >= 5 ? 0.1 : quantity >= 3 ? 0.05 : 0; // 10% para 5+, 5% para 3+
        
        let price = basePrice * rarityMultiplier;
        price = price * (1 - quantityDiscount);
        
        // Verificar se há oferta especial
        const special = this.specials.find(s => s.partType === partType);
        if (special) {
            price = Math.min(price, special.price);
        }
        
        return Math.floor(price);
    }

    // Comprar peça
    buyPart(partType, quantity = 1, rarity = 'comum') {
        const price = this.calculatePartPrice(partType, rarity, quantity) * quantity;
        
        if (window.gameState && window.gameState.money >= price) {
            window.gameState.money -= price;
            this.totalSpent += price;
            
            this.transactionHistory.push({
                type: 'buy',
                partType: partType,
                quantity: quantity,
                price: price,
                rarity: rarity,
                timestamp: Date.now()
            });

            // Adicionar ao inventário (se disponível)
            if (window.inventory) {
                for (let i = 0; i < quantity; i++) {
                    window.inventory.addPart(partType);
                }
            }

            return {
                success: true,
                message: `✅ Comprou ${quantity}x ${this.getPartDisplayName(partType)} por R$ ${price}`,
                price: price
            };
        }

        return {
            success: false,
            message: '💰 Dinheiro insuficiente'
        };
    }

    // Vender peça (usada)
    sellPart(partType, condition) {
        const basePrice = this.basePrices[partType] || 500;
        const conditionMultiplier = condition / 100; // 0-1 baseado na condição
        const price = Math.floor(basePrice * conditionMultiplier * 0.5); // Metade do valor
        
        window.gameState.money += price;
        this.totalEarned += price;

        this.transactionHistory.push({
            type: 'sell',
            partType: partType,
            condition: condition,
            price: price,
            timestamp: Date.now()
        });

        return {
            success: true,
            message: `💰 Vendeu ${this.getPartDisplayName(partType)} (${condition}%) por R$ ${price}`,
            price: price
        };
    }

    // Calcular valor de serviço
    calculateServicePrice(basePrice, difficulty, customerMultiplier = 1.0) {
        const difficultyMultiplier = {
            'easy': 0.8,
            'medium': 1.0,
            'hard': 1.5,
            'extreme': 2.0
        }[difficulty] || 1.0;

        return Math.floor(basePrice * difficultyMultiplier * customerMultiplier);
    }

    // Obter estatísticas da economia
    getStats() {
        const totalTransactions = this.transactionHistory.length;
        const averageSpent = totalTransactions > 0 ? this.totalSpent / totalTransactions : 0;

        return {
            totalSpent: this.totalSpent,
            totalEarned: this.totalEarned,
            balance: this.totalEarned - this.totalSpent,
            totalTransactions: totalTransactions,
            averageSpent: Math.floor(averageSpent),
            specials: this.specials.length,
            currentOffers: this.specials.filter(s => Date.now() - s.createdAt < s.expiresIn).length
        };
    }

    // Obter ofertas especiais ativas
    getActiveSpecials() {
        const now = Date.now();
        return this.specials.filter(s => now - s.createdAt < s.expiresIn);
    }

    // Atualizar ofertas (chamar diariamente)
    refreshOffers() {
        this.specials = this.specials.filter(s => Date.now() - s.createdAt < s.expiresIn);
        
        // Gerar novas ofertas se necessário
        if (this.specials.length < 3) {
            this.generateDailyOffers();
        }
    }

    // Calcular inflação/deflação (eventos econômicos)
    applyEconomicEvent() {
        const events = [
            { name: 'Crise no setor', multiplier: 1.2, duration: 7 * 24 * 60 * 60 * 1000 },
            { name: 'Safra de peças', multiplier: 0.8, duration: 5 * 24 * 60 * 60 * 1000 },
            { name: 'Greve dos fornecedores', multiplier: 1.5, duration: 3 * 24 * 60 * 60 * 1000 },
            { name: 'Nova fábrica', multiplier: 0.7, duration: 10 * 24 * 60 * 60 * 1000 }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        
        return {
            name: event.name,
            multiplier: event.multiplier,
            duration: event.duration,
            startTime: Date.now()
        };
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.EconomySystem = EconomySystem;
}