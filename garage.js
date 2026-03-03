// garage.js - Sistema de garagem expansível

export const GARAGE_UPGRADES = {
    // Nível 1 - Inicial
    level1: {
        name: 'Garagem Simples',
        description: 'Espaço básico para 1 carro',
        carSlots: 1,
        toolRacks: 1,
        partsStorage: 50,
        diagnosticCapability: 'básico',
        price: 0,
        image: '🏚️',
        requiredLevel: 1
    },
    // Nível 2 - Pequena expansão
    level2: {
        name: 'Garagem Ampliada',
        description: 'Mais espaço e organização',
        carSlots: 2,
        toolRacks: 2,
        partsStorage: 100,
        diagnosticCapability: 'avançado',
        price: 5000,
        image: '🏠',
        requiredLevel: 3
    },
    // Nível 3 - Garagem profissional
    level3: {
        name: 'Oficina Profissional',
        description: 'Elevador hidráulico e mais ferramentas',
        carSlots: 3,
        toolRacks: 3,
        partsStorage: 200,
        diagnosticCapability: 'profissional',
        price: 15000,
        image: '🏢',
        requiredLevel: 5
    },
    // Nível 4 - Centro automotivo
    level4: {
        name: 'Centro Automotivo',
        description: 'Múltiplos elevadores e equipamentos especiais',
        carSlots: 4,
        toolRacks: 4,
        partsStorage: 350,
        diagnosticCapability: 'especializado',
        price: 30000,
        image: '🏬',
        requiredLevel: 8
    },
    // Nível 5 - Mega oficina
    level5: {
        name: 'Mega Oficina',
        description: 'Complexo completo com todas as facilidades',
        carSlots: 5,
        toolRacks: 5,
        partsStorage: 500,
        diagnosticCapability: 'total',
        price: 50000,
        image: '🏭',
        requiredLevel: 10
    }
};

export class GarageSystem {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = Object.keys(GARAGE_UPGRADES).length;
        this.carSlots = GARAGE_UPGRADES.level1.carSlots;
        this.toolRacks = GARAGE_UPGRADES.level1.toolRacks;
        this.partsStorage = GARAGE_UPGRADES.level1.partsStorage;
        this.diagnosticCapability = GARAGE_UPGRADES.level1.diagnosticCapability;
        this.parkedCars = [];
        this.unlockedFeatures = [];
    }

    // Comprar upgrade da garagem
    buyUpgrade() {
        if (this.currentLevel >= this.maxLevel) {
            return { success: false, message: '🏢 Garagem já está no nível máximo!' };
        }

        const nextLevel = this.currentLevel + 1;
        const upgradeData = GARAGE_UPGRADES[`level${nextLevel}`];
        
        // Verificar nível do jogador
        if (gameState.level < upgradeData.requiredLevel) {
            return { 
                success: false, 
                message: `⭐ Necessário nível ${upgradeData.requiredLevel} do mecânico!` 
            };
        }

        // Verificar dinheiro
        if (gameState.money < upgradeData.price) {
            return { success: false, message: '💰 Dinheiro insuficiente!' };
        }

        // Aplicar upgrade
        gameState.updateMoney(-upgradeData.price);
        
        this.currentLevel = nextLevel;
        this.carSlots = upgradeData.carSlots;
        this.toolRacks = upgradeData.toolRacks;
        this.partsStorage = upgradeData.partsStorage;
        this.diagnosticCapability = upgradeData.diagnosticCapability;

        // Desbloquear features especiais baseadas no nível
        this.unlockFeatures();

        return { 
            success: true, 
            message: `🏢 Garagem evoluída para ${upgradeData.name}!`,
            level: nextLevel
        };
    }

    // Desbloquear features especiais
    unlockFeatures() {
        this.unlockedFeatures = [];
        
        if (this.currentLevel >= 2) {
            this.unlockedFeatures.push('diagnóstico-avançado');
        }
        if (this.currentLevel >= 3) {
            this.unlockedFeatures.push('elevador-hidraulico');
            inventory.upgradeCapacity(5); // Bônus de estoque
        }
        if (this.currentLevel >= 4) {
            this.unlockedFeatures.push('pintura');
            this.unlockedFeatures.push('alinhamento');
        }
        if (this.currentLevel >= 5) {
            this.unlockedFeatures.push('turbo');
            this.unlockedFeatures.push('preparação');
        }
    }

    // Estacionar carro (para jobs futuros)
    parkCar(carData) {
        if (this.parkedCars.length < this.carSlots) {
            this.parkedCars.push({
                ...carData,
                parkedAt: Date.now()
            });
            return true;
        }
        return false;
    }

    // Remover carro do estacionamento
    removeCar(carId) {
        const index = this.parkedCars.findIndex(c => c.id === carId);
        if (index >= 0) {
            this.parkedCars.splice(index, 1);
            return true;
        }
        return false;
    }

    // Calcular bônus de diagnóstico
    getDiagnosticBonus() {
        const bonuses = {
            'básico': 0,
            'avançado': 10,
            'profissional': 20,
            'especializado': 30,
            'total': 50
        };
        return bonuses[this.diagnosticCapability] || 0;
    }

    // Calcular desconto em peças (por comprar em maior quantidade)
    getPartsDiscount() {
        return Math.min(20, this.currentLevel * 2); // 2% por nível, máx 20%
    }

    // Obter estatísticas da garagem
    getStats() {
        const nextLevel = this.currentLevel < this.maxLevel ? 
            GARAGE_UPGRADES[`level${this.currentLevel + 1}`] : null;

        return {
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            carSlots: this.carSlots,
            usedSlots: this.parkedCars.length,
            toolRacks: this.toolRacks,
            partsStorage: this.partsStorage,
            diagnosticBonus: this.getDiagnosticBonus(),
            partsDiscount: this.getPartsDiscount(),
            nextUpgrade: nextLevel ? {
                name: nextLevel.name,
                price: nextLevel.price,
                requiredLevel: nextLevel.requiredLevel
            } : null,
            unlockedFeatures: this.unlockedFeatures
        };
    }

    // Renderizar visualização 3D da garagem (chamado pelo Scene3D)
    getGarageAppearance() {
        const appearances = {
            1: { color: 0x666666, size: 1.0, hasSign: false },
            2: { color: 0x777777, size: 1.2, hasSign: true, signText: 'OFICINA' },
            3: { color: 0x888888, size: 1.5, hasSign: true, signText: 'AUTO MECÂNICA' },
            4: { color: 0x999999, size: 1.8, hasSign: true, signText: 'CENTRO AUTOMOTIVO' },
            5: { color: 0xaaaaaa, size: 2.0, hasSign: true, signText: 'MEGA OFICINA' }
        };
        return appearances[this.currentLevel] || appearances[1];
    }
}