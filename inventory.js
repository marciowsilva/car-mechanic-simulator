// inventory.js - Sistema de estoque de peças

export class Inventory {
    constructor() {
        this.parts = {
            motor: 0,
            transmissao: 0,
            freios: 0,
            suspensao: 0,
            bateria: 0,
            alternador: 0,
            radiador: 0,
            escapamento: 0
        };
        this.maxCapacity = 5; // Limite inicial por peça
        this.totalValue = 0;
    }

    // Adicionar peças ao estoque
    addPart(partName, quantity = 1) {
        if (!this.parts.hasOwnProperty(partName)) {
            console.error(`Peça ${partName} não existe`);
            return false;
        }

        const newTotal = this.parts[partName] + quantity;
        if (newTotal <= this.maxCapacity) {
            this.parts[partName] = newTotal;
            this.calculateTotalValue();
            return true;
        }
        return false;
    }

    // Usar/remover peça do estoque
    usePart(partName) {
        if (!this.parts.hasOwnProperty(partName)) {
            console.error(`Peça ${partName} não existe`);
            return false;
        }

        if (this.parts[partName] > 0) {
            this.parts[partName]--;
            this.calculateTotalValue();
            return true;
        }
        return false;
    }

    // Verificar quantidade disponível
    getPartCount(partName) {
        return this.parts[partName] || 0;
    }

    // Verificar se tem estoque suficiente
    hasPart(partName, quantity = 1) {
        return this.parts[partName] >= quantity;
    }

    // Calcular valor total do estoque
    calculateTotalValue() {
        let total = 0;
        const partValues = {
            motor: 800,
            transmissao: 600,
            freios: 300,
            suspensao: 400,
            bateria: 150,
            alternador: 250,
            radiador: 200,
            escapamento: 180
        };

        Object.entries(this.parts).forEach(([partName, quantity]) => {
            total += quantity * partValues[partName];
        });

        this.totalValue = total;
        return total;
    }

    // Aumentar capacidade do estoque (upgrade)
    upgradeCapacity(amount = 2) {
        this.maxCapacity += amount;
        return this.maxCapacity;
    }

    // Comprar peça para estoque
    buyForInventory(partName) {
        const partPrice = 500; // Preço fixo para simplificar
        if (gameState.money >= partPrice && this.addPart(partName)) {
            gameState.updateMoney(-partPrice);
            return true;
        }
        return false;
    }

    // Usar peça do estoque no reparo
    useFromInventory(partName) {
        if (this.hasPart(partName)) {
            this.usePart(partName);
            return true;
        }
        return false;
    }

    // Obter estatísticas do estoque
    getStats() {
        const totalParts = Object.values(this.parts).reduce((a, b) => a + b, 0);
        const usedCapacity = totalParts;
        const freeCapacity = this.maxCapacity * Object.keys(this.parts).length - usedCapacity;

        return {
            totalParts,
            usedCapacity,
            freeCapacity,
            maxCapacity: this.maxCapacity * Object.keys(this.parts).length,
            totalValue: this.totalValue
        };
    }
}