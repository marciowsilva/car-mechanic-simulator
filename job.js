// job.js
import { PART_TRANSLATIONS } from "./constants.js";
import { upgradeSystem } from "./game.js";

export class Job {
  constructor() {
    this.id = Date.now();
    this.customerName = this.generateCustomerName();
    this.carModel = this.generateCarModel();
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
    ];
    const lastNames = [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Rodrigues",
      "Ferreira",
      "Alves",
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  generateCarModel() {
    const carData = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
    this.carData = carData;
    return `${carData.brand} ${carData.model} (${carData.year})`;
  }

  generateDifficulty() {
    const rand = Math.random();
    if (rand < 0.3) return "easy";
    if (rand < 0.7) return "medium";
    return "hard";
  }

  // método para dificuldade baseada no tipo de carro
  calculateDifficultyByCarType() {
    const multipliers = {
      compact: 0.8,
      sedan: 1.0,
      suv: 1.2,
      pickup: 1.3,
      sports: 1.5,
      luxury: 1.4,
    };
    return multipliers[this.carData.type] || 1.0;
  }

  generateTargetConditions() {
    const targets = {};
    let minCondition, maxCondition;

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
    return baseValues[this.difficulty];
  }

  generateTimeLimit() {
    const timeLimits = { easy: 180000, medium: 240000, hard: 300000 };
    return timeLimits[this.difficulty];
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
