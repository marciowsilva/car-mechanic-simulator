// job.js

import { PART_TRANSLATIONS } from "./constants.js";
import { CAR_MODELS } from "./constants.js";
import { upgradeSystem } from "./game.js";

export class Job {
  constructor() {
    this.id = Date.now();
    this.customerName = this.generateCustomerName();
    this.carData = this.generateCarData(); // guardar dados completos do carro
    this.carModel = this.formatCarModel(); // formatar para exibição
    this.difficulty = this.generateDifficulty();
    this.targetConditions = this.generateTargetConditions();
    this.basePayment = this.calculateBasePayment();
    this.payment = upgradeSystem.calculatePayment(this.basePayment);
    this.timeLimit = this.generateTimeLimit();
    this.startTime = Date.now();
    this.status = "active";
  }

  generateCustomerName() {
    const firstNames = [
      "João",
      "Maria",
      "José",
      "Ana",
      "Carlos",
      "Juliana",
      "Pedro",
      "Fernanda",
      "Lucas",
      "Mariana",
      "Roberto",
      "Patrícia",
      "Marcos",
      "Carla",
      "Ricardo",
      "Amanda",
      "Paulo",
      "Camila",
      "André",
      "Beatriz",
    ];
    const lastNames = [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Rodrigues",
      "Ferreira",
      "Alves",
      "Pereira",
      "Lima",
      "Gomes",
      "Costa",
      "Martins",
      "Rocha",
      "Carvalho",
      "Mendes",
      "Nunes",
      "Cardoso",
      "Teixeira",
      "Cavalcanti",
      "Dias",
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  generateCarData() {
    // Verificar se CAR_MODELS está definido
    if (!CAR_MODELS || CAR_MODELS.length === 0) {
      console.error("❌ CAR_MODELS não está definido!");
      // Fallback para modelo padrão
      return {
        brand: "Fiat",
        model: "Uno",
        type: "compact",
        year: "2015",
        engineSize: "1.0",
      };
    }

    return CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
  }

  formatCarModel() {
    if (!this.carData) {
      return "Carro Desconhecido";
    }
    return `${this.carData.brand} ${this.carData.model} (${this.carData.year})`;
  }

  generateDifficulty() {
    const rand = Math.random();
    if (rand < 0.3) return "easy";
    if (rand < 0.7) return "medium";
    return "hard";
  }

  generateTargetConditions() {
    const targets = {};
    let minCondition, maxCondition;

    // Ajustar dificuldade baseada no tipo do carro
    let difficultyMultiplier = 1.0;
    if (this.carData && this.carData.type) {
      const multipliers = {
        compact: 0.8,
        sedan: 1.0,
        suv: 1.2,
        pickup: 1.3,
        sports: 1.5,
        luxury: 1.4,
      };
      difficultyMultiplier = multipliers[this.carData.type] || 1.0;
    }

    switch (this.difficulty) {
      case "easy":
        minCondition = 60;
        maxCondition = 75;
        break;
      case "medium":
        minCondition = 75;
        maxCondition = 85;
        break;
      case "hard":
        minCondition = 85;
        maxCondition = 95;
        break;
    }

    // Aplicar multiplicador de dificuldade
    minCondition = Math.min(
      95,
      Math.round(minCondition * difficultyMultiplier),
    );
    maxCondition = Math.min(
      98,
      Math.round(maxCondition * difficultyMultiplier),
    );

    Object.keys(PART_TRANSLATIONS).forEach((partName) => {
      const variation = Math.floor(Math.random() * 15) - 7;
      targets[partName] = Math.min(
        100,
        Math.max(minCondition, minCondition + variation),
      );
    });

    return targets;
  }

  calculateBasePayment() {
    const baseValues = { easy: 1500, medium: 2500, hard: 4000 };
    let payment = baseValues[this.difficulty];

    // Bônus por tipo de carro
    if (this.carData && this.carData.type) {
      const multipliers = {
        compact: 1.0,
        sedan: 1.2,
        suv: 1.5,
        pickup: 1.6,
        sports: 2.0,
        luxury: 1.8,
      };
      payment = Math.round(payment * (multipliers[this.carData.type] || 1.0));
    }

    return payment;
  }

  generateTimeLimit() {
    const timeLimits = { easy: 180000, medium: 240000, hard: 300000 };
    let timeLimit = timeLimits[this.difficulty];

    // Ajustar tempo baseado no tipo do carro
    if (this.carData && this.carData.type) {
      const multipliers = {
        compact: 0.8,
        sedan: 1.0,
        suv: 1.2,
        pickup: 1.3,
        sports: 1.4,
        luxury: 1.3,
      };
      timeLimit = Math.round(
        timeLimit * (multipliers[this.carData.type] || 1.0),
      );
    }

    return timeLimit;
  }

  getTimeRemaining() {
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.timeLimit - elapsed);
  }

  isExpired() {
    return this.getTimeRemaining() <= 0;
  }

  checkCompletion(carParts) {
    for (const [partName, targetCondition] of Object.entries(
      this.targetConditions,
    )) {
      if (carParts[partName].condition < targetCondition) {
        return false;
      }
    }
    return true;
  }

  getRemainingParts(carParts) {
    const remaining = [];
    for (const [partName, targetCondition] of Object.entries(
      this.targetConditions,
    )) {
      if (carParts[partName].condition < targetCondition) {
        remaining.push(partName);
      }
    }
    return remaining;
  }

  getProgress(carParts) {
    let total = 0;
    let count = 0;

    for (const [partName, targetCondition] of Object.entries(
      this.targetConditions,
    )) {
      const current = carParts[partName].condition;
      total += Math.min(100, (current / targetCondition) * 100);
      count++;
    }

    return Math.floor(total / count);
  }
}
