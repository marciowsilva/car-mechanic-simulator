// job.js - VERSÃO MODIFICADA COM CLIENTES RECORRENTES

import { PART_TRANSLATIONS } from './constants.js';
import { CAR_MODELS } from './constants.js';
import { upgradeSystem } from './game.js';
import { customerSystem } from './game.js'; // <-- NOVA IMPORTAÇÃO

export class Job {
    constructor(customerType = 'random') {
        this.id = Date.now();
        
        // Selecionar cliente baseado no tipo
        let customer;
        switch(customerType) {
            case 'regular':
                customer = customerSystem.getRegularCustomer();
                break;
            case 'vip':
                customer = customerSystem.getVIPCustomer();
                break;
            default:
                customer = customerSystem.getRandomCustomer();
        }
        
        this.customerData = customer;
        this.customerName = customer.name;
        this.customerStatus = customer.status || 'new';
        
        this.carData = this.generateCarData();
        this.carModel = this.formatCarModel();
        this.difficulty = this.generateDifficulty();
        this.targetConditions = this.generateTargetConditions();
        this.basePayment = this.calculateBasePayment();
        
        // Aplicar bônus de cliente recorrente
        this.payment = customerSystem.calculatePaymentBonus(this.customerName, this.basePayment);
        this.timeLimit = customerSystem.calculateTimeBonus(this.customerName, this.generateTimeLimit());
        
        this.startTime = Date.now();
        this.status = 'active';
        
        // Registrar visita
        customerSystem.recordVisit(this.customerName);
    }

    // ... resto dos métodos existentes ...

    completeJob(quality, timeSpent) {
        // Atualizar satisfação do cliente
        customerSystem.updateSatisfaction(
            this.customerName, 
            quality, 
            timeSpent, 
            this.payment
        );
        
        this.status = 'completed';
        return this.payment;
    }
}