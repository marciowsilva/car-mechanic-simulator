// src/cars/Job.js - VERSÃO MÍNIMA

export class Job {
    constructor(customer = 'Cliente', car = 'Carro') {
        console.log('📋 Job (mínimo) criado');
        this.id = Date.now();
        this.customer = customer;
        this.car = car;
        this.status = 'active';
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.Job = Job;
    console.log('🌐 Job disponível globalmente');
}
