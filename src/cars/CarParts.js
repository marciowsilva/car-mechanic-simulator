// src/cars/CarParts.js
export class CarPart {
    constructor(type, condition = 100) {
        this.type = type;
        this.condition = condition;
        this.maxCondition = 100;
        this.isBroken = false;
    }

    damage(amount) {
        this.condition = Math.max(0, this.condition - amount);
        if (this.condition <= 0) this.isBroken = true;
    }

    repair(amount) {
        if (!this.isBroken) {
            this.condition = Math.min(this.maxCondition, this.condition + amount);
        }
    }

    replace() {
        this.condition = this.maxCondition;
        this.isBroken = false;
    }
}
