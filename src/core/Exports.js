// src/core/Exports.js - Arquivo central de exportações

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

// Lista de todos os módulos que precisamos expor
const modules = [
  // Core
  { path: "/src/core/Game.js", name: "GameState" },
  { path: "/src/core/Database.js", name: "Database" },

  // Garage
  { path: "/src/garage/Scene3D.js", name: "Scene3D" },
  { path: "/src/garage/Garage.js", name: "GarageSystem" },
  { path: "/src/garage/GarageLayout.js", name: "GARAGE_CONFIG" },

  // UI
  { path: "/src/ui/UIManager.js", name: "UIManager" },

  // Systems
  { path: "/src/systems/Inventory.js", name: "Inventory" },
  { path: "/src/systems/audio.js", name: "AudioManager" },
  { path: "/src/systems/upgrade-system.js", name: "UpgradeSystem" },
  { path: "/src/systems/specializations.js", name: "SpecializationSystem" },
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

  // Cars
  { path: "/src/cars/Car.js", name: "CustomerCar" },
  { path: "/src/cars/Job.js", name: "Job" },
  { path: "/src/cars/CarModels.js", name: "CarModels" },
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

// Função para inicializar o jogo
function initializeGame() {
  const container = document.getElementById("game-container");
  if (!container) {
    console.log("❌ Container não encontrado");
    return;
  }

  // Criar instâncias
  if (window.Scene3D && !window.scene3D) {
    try {
      window.scene3D = new window.Scene3D(container);
      console.log("✅ Scene3D criado");
    } catch (err) {
      console.log("❌ Erro Scene3D:", err);
    }
  }

  if (window.UIManager && !window.uiManager) {
    try {
      window.uiManager = new window.UIManager();
      console.log("✅ UIManager criado");
    } catch (err) {
      console.log("❌ Erro UIManager:", err);
    }
  }

  if (window.GameState && !window.gameState) {
    try {
      window.gameState = new window.GameState();
      console.log("✅ GameState criado");
    } catch (err) {
      console.log("❌ Erro GameState:", err);
    }
  }

  console.log("\n📊 STATUS FINAL:");
  console.log("   gameState:", window.gameState ? "✅" : "❌");
  console.log("   scene3D:", window.scene3D ? "✅" : "❌");
  console.log("   uiManager:", window.uiManager ? "✅" : "❌");
}

// Iniciar carregamento
loadAllModules();

// Exportar função para uso posterior
window.loadAllModules = loadAllModules;
window.initializeGame = initializeGame;
