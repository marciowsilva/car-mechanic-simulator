// src/systems/GarageUpgradeSystem.js

export class GarageUpgradeSystem {
    constructor(garage) {
        this.garage = garage;
        this.upgradeLevel = 1;
        this.maxLevel = 5;
        
        this.upgradePrices = {
            1: 0,      // Nível inicial
            2: 5000,   // Segundo elevador
            3: 15000,  // Computador e máquina
            4: 30000,  // Quarto elevador e estante
            5: 50000   // Oficina de pintura e guincho
        };

        this.upgradeDescriptions = {
            2: "➕ Segundo elevador + Máquina de pneus",
            3: "➕ Terceiro elevador + Computador",
            4: "➕ Quarto elevador + Estante de peças",
            5: "➕ Oficina de pintura + Guincho de motor"
        };
    }

    getNextUpgrade() {
        if (this.upgradeLevel >= this.maxLevel) return null;
        
        return {
            level: this.upgradeLevel + 1,
            price: this.upgradePrices[this.upgradeLevel + 1],
            description: this.upgradeDescriptions[this.upgradeLevel + 1]
        };
    }

    canUpgrade() {
        if (this.upgradeLevel >= this.maxLevel) return false;
        const nextPrice = this.upgradePrices[this.upgradeLevel + 1];
        return window.gameState && window.gameState.money >= nextPrice;
    }

    upgrade() {
        if (!this.canUpgrade()) {
            return { 
                success: false, 
                message: "💰 Dinheiro insuficiente ou nível máximo" 
            };
        }

        const nextLevel = this.upgradeLevel + 1;
        const price = this.upgradePrices[nextLevel];

        // Aplicar upgrade
        window.gameState.money -= price;
        
        switch(nextLevel) {
            case 2:
                this.garage.upgradeToLevel2();
                break;
            case 3:
                this.garage.upgradeToLevel3();
                break;
            case 4:
                this.garage.upgradeToLevel4();
                break;
            case 5:
                this.garage.upgradeToLevel5();
                break;
        }

        this.upgradeLevel = nextLevel;

        return {
            success: true,
            message: `🏢 Garagem expandida para Nível ${nextLevel}!`,
            level: nextLevel,
            price: price
        };
    }

    getStats() {
        return {
            currentLevel: this.upgradeLevel,
            maxLevel: this.maxLevel,
            nextUpgrade: this.getNextUpgrade(),
            equipment: this.garage.getEquipment()
        };
    }
}