// testar-imports.js - Cole no console do navegador
console.clear();
async function testarImports() {
  console.log("=================================");
  console.log("🔍 TESTANDO IMPORTS DO JOGO");
  console.log("=================================");

  const tests = [
    { name: "Game", path: "../core/Game.js" },
    { name: "Database", path: "../core/Database.js" },
    { name: "Car", path: "../cars/Car.js" },
    { name: "CarModels", path: "../cars/CarModels.js" },
    { name: "CarParts", path: "../cars/CarParts.js" },
    { name: "Job", path: "../cars/Job.js" },
    { name: "CarModelLoader", path: "../cars/car-model-loader.js" },
    { name: "Garage", path: "../garage/Garage.js" },
    { name: "GarageLayout", path: "../garage/GarageLayout.js" },
    { name: "Scene3D", path: "../garage/Scene3D.js" },
    { name: "Inventory", path: "../systems/Inventory.js" },
    {
      name: "AchievementSystem",
      path: "../systems/achievements/AchievementSystem.js",
    },
    { name: "CustomerSystem", path: "../systems/customers/CustomerSystem.js" },
    {
      name: "DailyChallenges",
      path: "../systems/challenges/DailyChallenges.js",
    },
    { name: "UsedPartsMarket", path: "../systems/market/used-parts-market.js" },
    { name: "Specializations", path: "../systems/specializations.js" },
    { name: "UpgradeSystem", path: "../systems/upgrade-system.js" },
    { name: "Audio", path: "../systems/audio.js" },
    { name: "UIManager", path: "../ui/UIManager.js" },
    { name: "Constants", path: "../utils/constants.js" },
  ];

  let sucessos = 0;
  let falhas = 0;

  for (const test of tests) {
    try {
      const module = await import(test.path);
      console.log(`✅ ${test.name}: OK`);
      sucessos++;
    } catch (error) {
      console.log(`❌ ${test.name}: FALHOU - ${error.message}`);
      falhas++;
    }
  }

  console.log("=================================");
  console.log(`📊 RESULTADO: ${sucessos} sucessos, ${falhas} falhas`);
  console.log("=================================");
}

// Executar testes
testarImports();
