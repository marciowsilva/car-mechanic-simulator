// inventory.js - SISTEMA DE ESTOQUE OTIMIZADO

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
        this.maxCapacity = 5;
        this.totalValue = 0;
    }

    addPart(partName, quantity = 1) {
        if (!this.parts.hasOwnProperty(partName)) return false;
        
        const newTotal = this.parts[partName] + quantity;
        if (newTotal <= this.maxCapacity) {
            this.parts[partName] = newTotal;
            this.calculateTotalValue();
            return true;
        }
        return false;
    }

    usePart(partName) {
        if (!this.parts.hasOwnProperty(partName)) return false;
        
        if (this.parts[partName] > 0) {
            this.parts[partName]--;
            this.calculateTotalValue();
            return true;
        }
        return false;
    }

    getPartCount(partName) {
        return this.parts[partName] || 0;
    }

    hasPart(partName, quantity = 1) {
        return this.parts[partName] >= quantity;
    }

    calculateTotalValue() {
        const partValues = {
            motor: 800, transmissao: 600, freios: 300, suspensao: 400,
            bateria: 150, alternador: 250, radiador: 200, escapamento: 180
        };

        this.totalValue = Object.entries(this.parts).reduce((total, [partName, quantity]) => {
            return total + (quantity * (partValues[partName] || 0));
        }, 0);
        
        return this.totalValue;
    }

    upgradeCapacity(amount = 2) {
        this.maxCapacity += amount;
        return this.maxCapacity;
    }

    getStats() {
        const totalParts = Object.values(this.parts).reduce((a, b) => a + b, 0);
        const maxTotal = this.maxCapacity * Object.keys(this.parts).length;

        return {
            totalParts,
            usedCapacity: totalParts,
            freeCapacity: maxTotal - totalParts,
            maxCapacity: maxTotal,
            totalValue: this.totalValue
        };
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.Inventory = Inventory;
}
