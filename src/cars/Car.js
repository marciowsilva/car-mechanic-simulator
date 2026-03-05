// car.js
import { PART_TRANSLATIONS } from "/src/utils/constants.js";

export class Car {
  constructor(job) {
    this.id = Date.now();
    this.model = job.carModel;
    this.parts = this.generateParts(job.difficulty);
    this.condition = this.calculateOverallCondition();
  }

  generateParts(difficulty) {
    const parts = {};
    const multipliers = { easy: 0.5, medium: 0.3, hard: 0.2 };
    const multiplier = multipliers[difficulty];

    Object.keys(PART_TRANSLATIONS).forEach((partName) => {
      parts[partName] = {
        condition: 20 + Math.random() * (50 * multiplier),
        maxCondition: 100,
        price: PART_TRANSLATIONS[partName].basePrice,
      };
    });
    return parts;
  }

  calculateOverallCondition() {
    const parts = Object.values(this.parts);
    const total = parts.reduce((sum, part) => sum + part.condition, 0);
    return total / parts.length;
  }

  getPartConditionClass(condition, targetCondition) {
    // Se a peça está em 100%, retornar classe 'condition-good' (verde)
    if (condition >= 100) return "condition-good";
    if (condition >= targetCondition) return "condition-good";
    if (condition >= targetCondition * 0.7) return "condition-medium";
    return "condition-bad";
  }
}

// Exportar também como CustomerCar para compatibilidade
export const CustomerCar = Car;

// Expor globalmente
if (typeof window !== "undefined") {
  window.Car = Car;
  window.CustomerCar = Car;
  console.log("🌐 Car e CustomerCar disponíveis globalmente");
}
