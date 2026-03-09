// src/garage/GarageEquipment.js - Equipamentos da garagem estilo Car Mechanic Simulator

export const GarageEquipment = {
  // Máquinas de rodas
  tireChanger: {
    id: "tireChanger",
    name: "Troca de Pneus",
    description: "Monte e desmonte pneus das rodas",
    icon: "⚙️",
    position: [-4, 0, -8],
    rotation: 0,
    unlockLevel: 1,
    price: 5000,
    minigame: true,
    skillBonus: "velocidade",
    category: "wheels",
  },
  wheelBalancer: {
    id: "wheelBalancer",
    name: "Balanceadora",
    description: "Balanceie as rodas para evitar vibrações",
    icon: "⚖️",
    position: [-2, 0, -8],
    rotation: 0,
    unlockLevel: 1,
    price: 4000,
    minigame: true,
    skillBonus: "precisao",
    category: "wheels",
  },

  // Suspensão
  springPuller: {
    id: "springPuller",
    name: "Extrator de Molas",
    description: "Repare conjuntos de suspensão com segurança",
    icon: "🔄",
    position: [2, 0, -8],
    rotation: 0,
    unlockLevel: 2,
    price: 6000,
    minigame: true,
    category: "suspension",
  },

  // Óleo e fluidos
  oilDrain: {
    id: "oilDrain",
    name: "Dreno de Óleo",
    description: "Descarte óleo velho (multa de $100 se derramar)",
    icon: "🛢️",
    position: [-6, 0, -4],
    rotation: 0,
    unlockLevel: 1,
    price: 2000,
    penalty: 100,
    category: "fluids",
  },

  // Motor
  engineCrane: {
    id: "engineCrane",
    name: "Guindaste de Motor",
    description: "Remova e instale motores completos",
    icon: "🏗️",
    position: [6, 0, -4],
    rotation: 0,
    unlockLevel: 3,
    price: 15000,
    requires: ["transmissao"],
    category: "engine",
  },
  engineStand: {
    id: "engineStand",
    name: "Suporte de Motor",
    description: "Repare motores com acesso facilitado",
    icon: "🔧",
    position: [8, 0, -4],
    rotation: 0,
    unlockLevel: 3,
    price: 8000,
    category: "engine",
  },

  // Bateria
  batteryCharger: {
    id: "batteryCharger",
    name: "Carregador de Bateria",
    description: "Recarregue baterias para 100%",
    icon: "🔋",
    position: [-8, 0, 4],
    rotation: 0,
    unlockLevel: 2,
    price: 3000,
    category: "electrical",
  },

  // Pintura e detalhes
  paintShop: {
    id: "paintShop",
    name: "Oficina de Pintura",
    description: "Pinte carros por R$ 1.000",
    icon: "🎨",
    position: [-6, 0, 8],
    rotation: 0,
    unlockLevel: 3,
    price: 20000,
    paintJobs: [
      "Vermelho",
      "Azul",
      "Preto",
      "Branco",
      "Prata",
      "Fosco",
      "Metálico",
    ],
    category: "cosmetic",
  },
  detailingToolkit: {
    id: "detailingToolkit",
    name: "Kit de Detalhamento",
    description: "Aumente o valor visual do carro",
    icon: "✨",
    position: [6, 0, 8],
    rotation: 0,
    unlockLevel: 2,
    price: 5000,
    visualBonus: 10, // +10% valor
    category: "cosmetic",
  },

  // Solda
  weldingMachine: {
    id: "weldingMachine",
    name: "Máquina de Solda",
    description: "Repare chassis e estruturas",
    icon: "⚡",
    position: [4, 0, 8],
    rotation: 0,
    unlockLevel: 3,
    price: 10000,
    repairCost: 800,
    category: "structural",
  },

  // Testes
  testPath: {
    id: "testPath",
    name: "Pista de Teste",
    description: "Teste suspensão, freios e alinhamento",
    icon: "🏁",
    position: [0, 0, 12],
    rotation: 0,
    unlockLevel: 2,
    price: 12000,
    duration: 30, // segundos
    category: "testing",
  },

  // Pátio e estoque
  parkingLot: {
    id: "parkingLot",
    name: "Estacionamento",
    description: "Armazene até 5 carros",
    icon: "🅿️",
    position: [-10, 0, -2],
    rotation: 0,
    unlockLevel: 2,
    price: 8000,
    capacity: 5,
    category: "storage",
  },
  partsWarehouse: {
    id: "partsWarehouse",
    name: "Depósito de Peças",
    description: "Armazene peças removidas",
    icon: "📦",
    position: [10, 0, -2],
    rotation: 0,
    unlockLevel: 2,
    price: 6000,
    category: "storage",
  },

  // Conforto
  radio: {
    id: "radio",
    name: "Rádio",
    description: "Escute música enquanto trabalha",
    icon: "📻",
    position: [0, 2, -10],
    rotation: 0,
    unlockLevel: 1,
    price: 500,
    stations: ["Rock", "Pop", "Eletrônica", "Clássica", "Jazz"],
    category: "comfort",
  },
  workComputer: {
    id: "workComputer",
    name: "Computador",
    description: "Compre peças online e gerencie serviços",
    icon: "💻",
    position: [-2, 1, -10],
    rotation: 0,
    unlockLevel: 1,
    price: 1000,
    category: "management",
  },
  tablet: {
    id: "tablet",
    name: "Tablet",
    description: "Compre de qualquer lugar (desbloqueado com XP)",
    icon: "📱",
    unlockLevel: 5,
    price: 2000,
    xpRequired: 5000,
    category: "management",
  },

  // Guincho
  carLift: {
    id: "carLift",
    name: "Elevador",
    description: "Eleve o carro para trabalhar na parte inferior",
    icon: "🚛",
    position: [-12, 0, 0],
    rotation: 0,
    unlockLevel: 1,
    price: 0,
    category: "utility",
  },
  workbench: {
    id: "workbench",
    name: "Bancada de Trabalho",
    description: "Repare peças individuais aqui",
    icon: "🔧",
    unlockLevel: 1,
    price: 0,
    category: "engine",
  },
};

// Categorias de equipamentos
export const EquipmentCategories = {
  wheels: { name: "Rodas", icon: "⚙️", color: "#4CAF50" },
  suspension: { name: "Suspensão", icon: "🔄", color: "#FF9800" },
  engine: { name: "Motor", icon: "🔧", color: "#f44336" },
  electrical: { name: "Elétrica", icon: "⚡", color: "#2196F3" },
  fluids: { name: "Fluidos", icon: "🛢️", color: "#795548" },
  cosmetic: { name: "Cosmético", icon: "🎨", color: "#E91E63" },
  structural: { name: "Estrutural", icon: "🔨", color: "#9C27B0" },
  testing: { name: "Testes", icon: "🏁", color: "#FFC107" },
  storage: { name: "Armazenamento", icon: "📦", color: "#607D8B" },
  comfort: { name: "Conforto", icon: "📻", color: "#00BCD4" },
  management: { name: "Gestão", icon: "💻", color: "#3F51B5" },
  utility: { name: "Utilitário", icon: "🚛", color: "#8BC34A" },
};

// Preços e custos de operação
export const OperatingCosts = {
  oilDrain: { spillPenalty: 100, disposalCost: 20 },
  paintShop: { baseCost: 1000, premiumCost: 2000 },
  weldingMachine: { perInchCost: 100 },
  testPath: { usageCost: 50 },
  detailingToolkit: { perUse: 100 },
};

// Funções utilitárias
export function getEquipmentById(id) {
  return GarageEquipment[id] || null;
}

export function getEquipmentByCategory(category) {
  return Object.values(GarageEquipment).filter(
    (eq) => eq.category === category,
  );
}

export function getUnlockedEquipment(garageLevel) {
  return Object.values(GarageEquipment).filter(
    (eq) => eq.unlockLevel <= garageLevel,
  );
}

export function calculateOperatingCost(equipmentId, params = {}) {
  const costs = OperatingCosts[equipmentId];
  if (!costs) return 0;

  let total = 0;
  if (equipmentId === "oilDrain" && params.spilled) {
    total += costs.spillPenalty;
  }
  if (equipmentId === "paintShop") {
    total += params.premium ? costs.premiumCost : costs.baseCost;
  }
  if (equipmentId === "weldingMachine") {
    total += (params.inches || 0) * costs.perInchCost;
  }
  if (equipmentId === "testPath") {
    total += costs.usageCost;
  }
  if (equipmentId === "detailingToolkit") {
    total += costs.perUse;
  }

  return total;
}
