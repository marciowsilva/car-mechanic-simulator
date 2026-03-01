// database.js - CORREÇÃO COMPLETA

export class Database {
  constructor() {
    this.dbName = "CarMechanicDB";
    this.dbVersion = 5;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error("Erro no banco de dados:", event.target.error);
        reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("jobs")) {
          const jobStore = db.createObjectStore("jobs", { keyPath: "id" });
          jobStore.createIndex("customer", "customerName", { unique: false });
          jobStore.createIndex("status", "status", { unique: false });
        }

        if (!db.objectStoreNames.contains("upgrades")) {
          db.createObjectStore("upgrades", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("achievements")) {
          db.createObjectStore("achievements", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("player")) {
          db.createObjectStore("player", { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("Banco de dados inicializado com sucesso");
        resolve();
      };
    });
  }

  loadPlayerData() {
    // Agora acessamos via window, já que as instâncias serão globais
    const gameState = window.gameState;
    if (!gameState) return;

    const transaction = this.db.transaction(["player"], "readonly");
    const store = transaction.objectStore("player");
    const request = store.get(1);

    request.onsuccess = (event) => {
      if (event.target.result) {
        const data = event.target.result;
        gameState.money = data.money || 5000;
        gameState.level = data.level || 1;
        gameState.experience = data.experience || 0;
        gameState.reputation = data.reputation || 3;
        gameState.jobsCompleted = data.jobsCompleted || 0;

        document.getElementById("money").textContent =
          `R$ ${gameState.money.toLocaleString()}`;
        document.getElementById("level").textContent = gameState.level;
        document.getElementById("jobs-completed").textContent =
          gameState.jobsCompleted;
        const stars =
          "★".repeat(gameState.reputation) +
          "☆".repeat(5 - gameState.reputation);
        document.getElementById("reputation").textContent = stars;
      }
    };
  }

  savePlayerData() {
    const gameState = window.gameState;
    if (!this.db || !gameState) return;

    const transaction = this.db.transaction(["player"], "readwrite");
    const store = transaction.objectStore("player");
    store.put({
      id: 1,
      money: gameState.money,
      level: gameState.level,
      experience: gameState.experience,
      reputation: gameState.reputation,
      jobsCompleted: gameState.jobsCompleted,
    });
  }

  loadUpgrades() {
    const upgradeSystem = window.upgradeSystem;
    if (!upgradeSystem) return;

    const transaction = this.db.transaction(["upgrades"], "readonly");
    const store = transaction.objectStore("upgrades");
    const request = store.get(1);

    request.onsuccess = (event) => {
      if (event.target.result) {
        const data = event.target.result;
        upgradeSystem.toolLevels = data.toolLevels || upgradeSystem.toolLevels;
        upgradeSystem.workshopUpgrades =
          data.workshopUpgrades || upgradeSystem.workshopUpgrades;
        upgradeSystem.skillUpgrades =
          data.skillUpgrades || upgradeSystem.skillUpgrades;
      }
    };
  }

  saveUpgrades() {
    const upgradeSystem = window.upgradeSystem;
    if (!this.db || !upgradeSystem) return;

    const transaction = this.db.transaction(["upgrades"], "readwrite");
    const store = transaction.objectStore("upgrades");
    store.put({
      id: 1,
      toolLevels: upgradeSystem.toolLevels,
      workshopUpgrades: upgradeSystem.workshopUpgrades,
      skillUpgrades: upgradeSystem.skillUpgrades,
    });
  }

  loadAchievements() {
    const achievementSystem = window.achievementSystem;
    if (!achievementSystem) return;

    const transaction = this.db.transaction(["achievements"], "readonly");
    const store = transaction.objectStore("achievements");
    const request = store.get(1);

    request.onsuccess = (event) => {
      if (event.target.result) {
        const data = event.target.result;
        achievementSystem.achievements =
          data.achievements || achievementSystem.achievements;
      }
    };
  }

  saveAchievements() {
    const achievementSystem = window.achievementSystem;
    if (!this.db || !achievementSystem) return;

    const transaction = this.db.transaction(["achievements"], "readwrite");
    const store = transaction.objectStore("achievements");
    store.put({
      id: 1,
      achievements: achievementSystem.achievements,
    });
  }

  saveJob(job) {
    const transaction = this.db.transaction(["jobs"], "readwrite");
    const store = transaction.objectStore("jobs");
    return store.add(job);
  }

  updateJob(job) {
    const transaction = this.db.transaction(["jobs"], "readwrite");
    const store = transaction.objectStore("jobs");
    return store.put(job);
  }
}
