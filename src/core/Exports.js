// src/core/Exports.js - Versão final com múltiplas camadas de proteção


// Função para carregar e expor módulos
async function loadAndExpose(modulePath, exportName) {
  try {
    const module = await import(modulePath);
    const exposed = module[exportName] || module.default;
    window[exportName] = exposed;
    return true;
  } catch (err) {
    return false;
  }
}

// Lista de módulos na ORDEM CORRETA de dependência
const modules = [
  // 1. Utilitários (sem dependências)
  { path: "/src/utils/constants.js", name: "CONSTANTS" },

  // 2. Core classes (Database não depende de outros)
  { path: "/src/core/Database.js", name: "Database" },

  // 3. Carros (precisam ser carregados antes de GameState)
  { path: "/src/cars/Car.js", name: "Car" },
  { path: "/src/cars/CarCatalog.js", name: "CarCatalog" },
  { path: "/src/cars/Job.js", name: "Job" },
  { path: "/src/cars/CarModels.js", name: "CarModels" },

  // 4. GameState (depende de Car)
  { path: "/src/core/Game.js", name: "GameState" },

  // 5. Sistemas que podem depender de GameState
  { path: "/src/systems/Inventory.js", name: "Inventory" },
  { path: "/src/systems/audio.js", name: "AudioManager" },
  { path: "/src/systems/upgrade-system.js", name: "UpgradeSystem" },
  { path: "/src/systems/specializations.js", name: "SpecializationSystem" },
  { path: "/src/systems/UpgradeManager.js", name: "UpgradeManager" },
  {
    path: "/src/systems/achievements/AchievementSystem.js",
    name: "AchievementSystem",
  },
  { path: "/src/systems/customers/CustomerSystem.js", name: "CustomerSystem" },
  {
    path: "/src/systems/challenges/DailyChallenges.js",
    name: "DailyChallenges",
  },
  { path: "/src/systems/market/used-parts-market.js", name: "UsedPartsMarket" },
  { path: "/src/systems/career-mode.js", name: "CareerMode" },

  // 6. Garage e UI (dependem de outros)
  { path: "/src/garage/SimpleScene3D.js", name: "SimpleScene3D" },
  { path: "/src/garage/Scene3D.js", name: "Scene3D" },
  { path: "/src/garage/Garage.js", name: "GarageSystem" },
  { path: "/src/garage/GarageLayout.js", name: "GARAGE_CONFIG" },
  { path: "/src/garage/RealisticGarage.js", name: "RealisticGarage" },
  { path: "/src/garage/UltraRealisticGarage.js", name: "UltraRealisticGarage" },
  { path: "/src/garage/OptimizedGarage.js", name: "OptimizedGarage" },
  { path: "/src/garage/ProfessionalGarage.js", name: "ProfessionalGarage" },
  { path: "/src/garage/StarterGarage.js", name: "StarterGarage" },
  { path: "/src/ui/UIManager.js", name: "UIManager" },
];

// Carregar todos os módulos
async function loadAllModules() {

  let success = 0;
  for (const mod of modules) {
    const result = await loadAndExpose(mod.path, mod.name);
    if (result) success++;
  }


  // Tentar inicializar o jogo
  if (success > 0) {
    initializeGame();
  }
}

// Função para inicializar o jogo com múltiplas camadas de proteção
function initializeGame() {
  const container = document.getElementById("game-container");
  if (!container) {
    return;
  }

  // === CAMADA 1: Criar gameState com fallback ===
  if (!window.gameState) {
    // Tentar usar a classe GameState primeiro
    if (window.GameState) {
      try {
        window.gameState = new window.GameState();
      } catch (err) {
        // Fallback: objeto simples
        window.gameState = {
          money: 5000,
          level: 1,
          reputation: 3,
          jobsCompleted: 0,
          experience: 0,
          updateMoney: function (amount) {
            this.money += amount;
          },
          addExperience: function (amount) {
            this.experience += amount;
          },
          updateReputation: function (change) {
            this.reputation = Math.max(
              1,
              Math.min(5, this.reputation + change),
            );
          },
        };
      }
    } else {
      // GameState não disponível, criar objeto simples
      window.gameState = {
        money: 5000,
        level: 1,
        reputation: 3,
        jobsCompleted: 0,
        experience: 0,
        updateMoney: function (amount) {
          this.money += amount;
        },
        addExperience: function (amount) {
          this.experience += amount;
        },
        updateReputation: function (change) {
          this.reputation = Math.max(1, Math.min(5, this.reputation + change));
        },
      };
    }
  }

  // === CAMADA 2: Scene3D ===
  if (!window.scene3D) {
    try {
      if (window.StarterGarage) {
        window.scene3D = new window.StarterGarage(container);
      } else if (window.ProfessionalGarage) {
        window.scene3D = new window.ProfessionalGarage(container);
      } else if (window.UltraRealisticGarage) {
        window.scene3D = new window.UltraRealisticGarage(container);
      } else if (window.OptimizedGarage) {
        window.scene3D = new window.OptimizedGarage(container);
      } else if (window.RealisticGarage) {
        window.scene3D = new window.RealisticGarage(container);
      } else if (window.Scene3D) {
        window.scene3D = new window.Scene3D(container);
      }
    } catch (err) {
    }
  }

  // === CAMADA 3: UIManager ===
  if (window.UIManager && !window.uiManager) {
    try {
      window.uiManager = new window.UIManager();
    } catch (err) {
    }
  }


  if (window.gameState) {
  }

  // Iniciar animação se tudo ok
  if (window.scene3D && window.scene3D.animate) {
    window.scene3D.animate();
  }
}

// Iniciar carregamento
loadAllModules();

// === CAMADA 4: Correção tardia (fallback final) ===
setTimeout(() => {
  // Verificação 1: gameState existe mas GameState não
  if (window.gameState && !window.GameState) {
    window.GameState = window.gameState.constructor;
  }

  // Verificação 2: GameState existe mas gameState não
  if (window.GameState && !window.gameState) {
    try {
      window.gameState = new window.GameState();
    } catch (err) {
    }
  }

  // Verificação 3: Nem GameState nem gameState existem
  if (!window.GameState && !window.gameState) {
    window.gameState = {
      money: 5000,
      level: 1,
      reputation: 3,
      jobsCompleted: 0,
      experience: 0,
      updateMoney: function (amount) {
        this.money += amount;
      },
    };
  }

  // Log final de verificação
}, 500);

// Exportar funções para uso externo
window.loadAllModules = loadAllModules;
window.initializeGame = initializeGame;

