// src/core/Exports.js - Versão final com múltiplas camadas de proteção

console.log("📦 Carregando módulos e expondo globalmente...");

// Função para carregar e expor módulos
async function loadAndExpose(modulePath, exportName) {
  try {
    const module = await import(modulePath);
    const exposed = module[exportName] || module.default;
    window[exportName] = exposed;
    console.log(`   ✅ ${exportName} carregado de ${modulePath}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Erro ao carregar ${exportName}: ${err.message}`);
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
  // { path: "/src/garage/RealisticGarage.js", name: "RealisticGarage" },
  { path: "/src/garage/OptimizedGarage.js", name: "OptimizedGarage" },
  { path: "/src/ui/UIManager.js", name: "UIManager" },
];

// Carregar todos os módulos
async function loadAllModules() {
  console.log("=================================");
  console.log("📦 CARREGANDO MÓDULOS GLOBAIS");
  console.log("=================================\n");

  let success = 0;
  for (const mod of modules) {
    const result = await loadAndExpose(mod.path, mod.name);
    if (result) success++;
  }

  console.log("\n=================================");
  console.log(`📊 RESULTADO: ${success}/${modules.length} módulos carregados`);
  console.log("=================================");

  // Tentar inicializar o jogo
  if (success > 0) {
    console.log("\n🎮 Tentando inicializar o jogo...");
    initializeGame();
  }
}

// Função para inicializar o jogo com múltiplas camadas de proteção
function initializeGame() {
  const container = document.getElementById("game-container");
  if (!container) {
    console.log("❌ Container não encontrado");
    return;
  }

  // === CAMADA 1: Criar gameState com fallback ===
  if (!window.gameState) {
    // Tentar usar a classe GameState primeiro
    if (window.GameState) {
      try {
        window.gameState = new window.GameState();
        console.log("✅ GameState criado a partir da classe");
      } catch (err) {
        console.log("❌ Erro ao criar GameState:", err);
        // Fallback: objeto simples
        window.gameState = {
          money: 5000,
          level: 1,
          reputation: 3,
          jobsCompleted: 0,
          experience: 0,
          updateMoney: function (amount) {
            this.money += amount;
            console.log("💰 Dinheiro atualizado (fallback):", this.money);
          },
          addExperience: function (amount) {
            this.experience += amount;
            console.log(
              "✨ Experiência atualizada (fallback):",
              this.experience,
            );
          },
          updateReputation: function (change) {
            this.reputation = Math.max(
              1,
              Math.min(5, this.reputation + change),
            );
            console.log("⭐ Reputação atualizada (fallback):", this.reputation);
          },
        };
        console.log("⚠️ Fallback: gameState criado como objeto simples");
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
          console.log("💰 Dinheiro atualizado (fallback):", this.money);
        },
        addExperience: function (amount) {
          this.experience += amount;
          console.log("✨ Experiência atualizada (fallback):", this.experience);
        },
        updateReputation: function (change) {
          this.reputation = Math.max(1, Math.min(5, this.reputation + change));
          console.log("⭐ Reputação atualizada (fallback):", this.reputation);
        },
      };
      console.log("⚠️ Fallback: gameState criado sem classe");
    }
  }

  // === CAMADA 2: Scene3D ===
  if (!window.scene3D) {
    try {
      if (window.OptimizedGarage) {
        window.scene3D = new window.OptimizedGarage(container);
        console.log("✅ Garagem otimizada criada");
      } else if (window.RealisticGarage) {
        window.scene3D = new window.RealisticGarage(container);
        console.log("✅ Garagem realista criada");
      } else if (window.Scene3D) {
        window.scene3D = new window.Scene3D(container);
        console.log("✅ Scene3D normal criado");
      }
    } catch (err) {
      console.log("❌ Erro ao criar cena 3D:", err);
    }
  }

  // === CAMADA 3: UIManager ===
  if (window.UIManager && !window.uiManager) {
    try {
      window.uiManager = new window.UIManager();
      console.log("✅ UIManager criado");
    } catch (err) {
      console.log("❌ Erro UIManager:", err);
    }
  }

  console.log("\n📊 STATUS FINAL:");
  console.log("   gameState:", window.gameState ? "✅" : "❌");
  console.log("   scene3D:", window.scene3D ? "✅" : "❌");
  console.log("   uiManager:", window.uiManager ? "✅" : "❌");

  if (window.gameState) {
    console.log("   Dinheiro:", window.gameState.money);
    console.log("   Nível:", window.gameState.level);
    console.log("   Reputação:", window.gameState.reputation);
    console.log("   Tipo:", window.gameState.constructor.name);
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
    console.log("⚠️ GameState não exposto, corrigindo...");
    window.GameState = window.gameState.constructor;
    console.log("✅ GameState restaurado a partir da instância existente");
  }

  // Verificação 2: GameState existe mas gameState não
  if (window.GameState && !window.gameState) {
    console.log("⚠️ gameState não criado, criando agora tardiamente...");
    try {
      window.gameState = new window.GameState();
      console.log("✅ gameState criado tardiamente");
    } catch (err) {
      console.log("❌ Erro na criação tardia:", err);
    }
  }

  // Verificação 3: Nem GameState nem gameState existem
  if (!window.GameState && !window.gameState) {
    console.log("⚠️ Nenhum estado encontrado, criando fallback de emergência");
    window.gameState = {
      money: 5000,
      level: 1,
      reputation: 3,
      jobsCompleted: 0,
      experience: 0,
      updateMoney: function (amount) {
        this.money += amount;
        console.log("💰 Dinheiro atualizado (emergência):", this.money);
      },
    };
    console.log("✅ gameState de emergência criado");
  }

  // Log final de verificação
  console.log("\n🔍 VERIFICAÇÃO FINAL:");
  console.log("   GameState (classe):", window.GameState ? "✅" : "❌");
  console.log("   gameState (instância):", window.gameState ? "✅" : "❌");
}, 500);

// Exportar funções para uso externo
window.loadAllModules = loadAllModules;
window.initializeGame = initializeGame;

console.log("✅ Exports.js carregado completamente");
