// validar-repositorio.js - Versão ES Module

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=================================");
console.log("🔍 VALIDAÇÃO DA ESTRUTURA DO REPOSITÓRIO");
console.log("=================================\n");

// Configuração da estrutura esperada
const estruturaEsperada = {
  "src/core": ["Game.js", "Database.js", "Exports.js"],
  "src/cars": [
    "Car.js",
    "CarModels.js",
    "Job.js",
    "CarModelLoader.js",
    "car-model-loader.js",
    "CarParts.js",
  ],
  "src/garage": [
    "Scene3D.js",
    "Garage.js",
    "GarageLayout.js",
    "SimpleScene3D.js",
  ],
  "src/systems": [
    "Inventory.js",
    "audio.js",
    "upgrade-system.js",
    "specializations.js",
    "UpgradeManager.js",
    "career-mode.js",
  ],
  "src/systems/achievements": [
    "AchievementSystem.js",
    "achievements-advanced.js",
  ],
  "src/systems/customers": ["CustomerSystem.js", "CustomerManager.js"],
  "src/systems/challenges": ["DailyChallenges.js"],
  "src/systems/market": ["used-parts-market.js"],
  "src/ui": ["index.html", "style.css", "UIManager.js", "UpgradePanel.js"],
  "src/utils": ["constants.js"],
};

// Verificar arquivos duplicados
console.log("📁 VERIFICANDO ARQUIVOS DUPLICADOS...\n");

const todosArquivos = new Map(); // nome -> [caminhos]
const duplicatas = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (
      item.endsWith(".js") ||
      item.endsWith(".html") ||
      item.endsWith(".css") ||
      item.endsWith(".glb")
    ) {
      if (todosArquivos.has(item)) {
        const paths = todosArquivos.get(item);
        paths.push(dir);
        duplicatas.push(item);
      } else {
        todosArquivos.set(item, [dir]);
      }
    }
  });
}

// Verificar se src existe
if (!fs.existsSync("./src")) {
  console.log("❌ PASTA src NÃO ENCONTRADA!\n");
  process.exit(1);
}

scanDirectory("./src");

if (duplicatas.length > 0) {
  console.log("⚠️  ARQUIVOS DUPLICADOS ENCONTRADOS:");
  const duplicatasUnicas = [...new Set(duplicatas)];
  duplicatasUnicas.forEach((file) => {
    console.log(`   ❌ ${file}`);
    const locations = todosArquivos.get(file);
    locations.forEach((loc) => console.log(`      📍 ${loc}`));
  });
} else {
  console.log("✅ Nenhum arquivo duplicado encontrado!\n");
}

// Verificar estrutura de pastas
console.log("📁 VERIFICANDO ESTRUTURA DE PASTAS...\n");

Object.keys(estruturaEsperada).forEach((pasta) => {
  const pastaExiste = fs.existsSync(pasta);
  console.log(`${pastaExiste ? "✅" : "❌"} ${pasta}`);

  if (pastaExiste) {
    const arquivosEsperados = estruturaEsperada[pasta];
    const arquivosExistentes = fs
      .readdirSync(pasta)
      .filter(
        (f) => f.endsWith(".js") || f.endsWith(".html") || f.endsWith(".css"),
      );

    arquivosEsperados.forEach((arquivo) => {
      if (arquivosExistentes.includes(arquivo)) {
        console.log(`   ✅ ${arquivo}`);
      } else {
        console.log(`   ❌ ${arquivo} (faltando)`);
      }
    });

    // Verificar arquivos extras não esperados
    arquivosExistentes.forEach((arquivo) => {
      if (!arquivosEsperados.includes(arquivo)) {
        console.log(
          `   ⚠️  ${arquivo} (não listado - pode ser novo ou estar em lugar errado)`,
        );
      }
    });
  }
  console.log("");
});

// Verificação ESPECÍFICA para CustomerManager vs CustomerSystem
console.log("🔍 VERIFICAÇÃO ESPECÍFICA: SISTEMA DE CLIENTES");
console.log("==============================================\n");

if (fs.existsSync("src/systems/CustomerManager.js")) {
  console.log(
    "⚠️  CustomerManager.js encontrado em src/systems/ (local incorreto)",
  );
  console.log(
    "   ✅ Deveria estar em: src/systems/customers/CustomerManager.js",
  );
  console.log("   💡 Sugestão: mover o arquivo para a pasta customers/\n");
}

if (fs.existsSync("src/systems/customers/CustomerSystem.js")) {
  console.log("✅ CustomerSystem.js está no local correto");
}

if (fs.existsSync("src/systems/customers/CustomerManager.js")) {
  console.log("✅ CustomerManager.js está no local correto");
}

// Verificar se há duplicação de funcionalidades
console.log("\n📊 ANÁLISE DE FUNCIONALIDADES:");
console.log("===============================\n");

const sistemasEncontrados = [];

// Procurar por classes relacionadas a clientes
function encontrarClasses(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      encontrarClasses(full);
    } else if (file.endsWith(".js")) {
      try {
        const content = fs.readFileSync(full, "utf8");
        if (
          content.includes("class Customer") ||
          content.includes("export class Customer")
        ) {
          sistemasEncontrados.push({ arquivo: full, classe: "Customer" });
        }
        if (
          content.includes("class Client") ||
          content.includes("export class Client")
        ) {
          sistemasEncontrados.push({ arquivo: full, classe: "Client" });
        }
      } catch (err) {
        // Ignorar erros de leitura
      }
    }
  });
}

encontrarClasses("./src");

if (sistemasEncontrados.length > 1) {
  console.log("⚠️  MÚLTIPLOS SISTEMAS DE CLIENTES ENCONTRADOS:");
  sistemasEncontrados.forEach((s) => {
    console.log(`   📍 ${s.arquivo} (classe ${s.classe})`);
  });
  console.log(
    "\n   💡 Sugestão: Unificar em um único sistema em src/systems/customers/",
  );
} else if (sistemasEncontrados.length === 1) {
  console.log("✅ Apenas um sistema de clientes encontrado");
} else {
  console.log(
    "❓ Nenhum sistema de clientes encontrado (pode usar classes com outros nomes)",
  );
}

console.log("\n=================================");
console.log("✅ VALIDAÇÃO CONCLUÍDA");
console.log("=================================");
