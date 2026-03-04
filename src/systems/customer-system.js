// customer-system.js - NOVO ARQUIVO
export class CustomerSystem {
    constructor() {
        this.customers = [];
        this.relationships = {};
    }

    addCustomer(customerName) {
        if (!this.relationships[customerName]) {
            this.relationships[customerName] = {
                visits: 1,
                satisfaction: 100,
                discount: 0
            };
        } else {
            this.relationships[customerName].visits++;
        }
    }

    getCustomerBonus(customerName) {
        const customer = this.relationships[customerName];
        if (!customer) return 1.0;
        
        // Clientes recorrentes dão bônus de até 20%
        const bonus = Math.min(0.2, customer.visits * 0.02);
        return 1.0 + bonus;
    }
}