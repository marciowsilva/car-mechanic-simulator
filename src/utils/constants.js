// constants.js - VERSÃO CORRIGIDA SEM EXPORTAÇÕES DUPLICADAS

// ===== CONSTANTES DO JOGO =====

export const TOOL_BASE_STATS = {
  wrench: { baseRepair: 10, baseCost: 50, name: "Chave Inglesa", icon: "🔧" },
  screwdriver: {
    baseRepair: 5,
    baseCost: 25,
    name: "Chave de Fenda",
    icon: "🪛",
  },
  hammer: { baseRepair: 15, baseCost: 75, name: "Martelo", icon: "🔨" },
  welder: { baseRepair: 25, baseCost: 150, name: "Maçarico", icon: "⚡" },
  diagnostic: { baseRepair: 0, baseCost: 0, name: "Diagnóstico", icon: "📊" },
};

export const PART_TRANSLATIONS = {
  motor: { display: "Motor", basePrice: 800, icon: "⚙️" },
  transmissao: { display: "Transmissão", basePrice: 600, icon: "⚙️" },
  freios: { display: "Freios", basePrice: 300, icon: "🛑" },
  suspensao: { display: "Suspensão", basePrice: 400, icon: "🔧" },
  bateria: { display: "Bateria", basePrice: 150, icon: "🔋" },
  alternador: { display: "Alternador", basePrice: 250, icon: "⚡" },
  radiador: { display: "Radiador", basePrice: 200, icon: "💧" },
  escapamento: { display: "Escapamento", basePrice: 180, icon: "💨" },
};

export const PART_POSITIONS = {
  motor: [0, 1.3, 1.2],
  transmissao: [0, 1.0, 0.5],
  freios: [0, 0.5, 1.8],
  suspensao: [0, 0.3, 1.2],
  bateria: [0.5, 1.0, 1.2],
  alternador: [-0.5, 1.0, 1.2],
  radiador: [0, 1.0, 1.8],
  escapamento: [0, 0.3, -1.5],
};

export const CAR_MODELS = [
  // Compactos
  {
    brand: "Fiat",
    model: "Uno",
    type: "compact",
    year: "2015",
    engineSize: "1.0",
  },
  {
    brand: "VW",
    model: "Gol",
    type: "compact",
    year: "2016",
    engineSize: "1.0",
  },
  {
    brand: "Chevrolet",
    model: "Onix",
    type: "compact",
    year: "2017",
    engineSize: "1.0",
  },
  {
    brand: "Ford",
    model: "Ka",
    type: "compact",
    year: "2015",
    engineSize: "1.0",
  },
  {
    brand: "Renault",
    model: "Sandero",
    type: "compact",
    year: "2016",
    engineSize: "1.0",
  },

  // Sedans
  {
    brand: "Toyota",
    model: "Corolla",
    type: "sedan",
    year: "2018",
    engineSize: "2.0",
  },
  {
    brand: "Honda",
    model: "Civic",
    type: "sedan",
    year: "2017",
    engineSize: "2.0",
  },
  {
    brand: "Chevrolet",
    model: "Cruze",
    type: "sedan",
    year: "2018",
    engineSize: "1.8",
  },
  {
    brand: "VW",
    model: "Jetta",
    type: "sedan",
    year: "2017",
    engineSize: "2.0",
  },
  {
    brand: "Hyundai",
    model: "Elantra",
    type: "sedan",
    year: "2016",
    engineSize: "1.8",
  },

  // SUVs
  {
    brand: "Jeep",
    model: "Renegade",
    type: "suv",
    year: "2017",
    engineSize: "1.8",
  },
  {
    brand: "Honda",
    model: "HR-V",
    type: "suv",
    year: "2016",
    engineSize: "1.8",
  },
  {
    brand: "Toyota",
    model: "RAV4",
    type: "suv",
    year: "2017",
    engineSize: "2.0",
  },
  {
    brand: "Chevrolet",
    model: "Tracker",
    type: "suv",
    year: "2018",
    engineSize: "1.4",
  },
  {
    brand: "Nissan",
    model: "Kicks",
    type: "suv",
    year: "2017",
    engineSize: "1.6",
  },

  // Pickups
  {
    brand: "Fiat",
    model: "Strada",
    type: "pickup",
    year: "2015",
    engineSize: "1.4",
  },
  {
    brand: "Chevrolet",
    model: "S10",
    type: "pickup",
    year: "2016",
    engineSize: "2.8",
  },
  {
    brand: "Ford",
    model: "Ranger",
    type: "pickup",
    year: "2017",
    engineSize: "3.2",
  },
  {
    brand: "Toyota",
    model: "Hilux",
    type: "pickup",
    year: "2018",
    engineSize: "2.8",
  },
  {
    brand: "Mitsubishi",
    model: "L200",
    type: "pickup",
    year: "2016",
    engineSize: "2.5",
  },

  // Esportivos
  {
    brand: "Ford",
    model: "Mustang",
    type: "sports",
    year: "2018",
    engineSize: "5.0",
  },
  {
    brand: "Chevrolet",
    model: "Camaro",
    type: "sports",
    year: "2017",
    engineSize: "6.2",
  },
  {
    brand: "Porsche",
    model: "911",
    type: "sports",
    year: "2018",
    engineSize: "3.0",
  },
  {
    brand: "Audi",
    model: "R8",
    type: "sports",
    year: "2017",
    engineSize: "5.2",
  },
  {
    brand: "BMW",
    model: "M4",
    type: "sports",
    year: "2016",
    engineSize: "3.0",
  },

  // Luxo
  {
    brand: "Mercedes",
    model: "Classe C",
    type: "luxury",
    year: "2017",
    engineSize: "2.0",
  },
  {
    brand: "BMW",
    model: "Série 3",
    type: "luxury",
    year: "2016",
    engineSize: "2.0",
  },
  {
    brand: "Audi",
    model: "A4",
    type: "luxury",
    year: "2017",
    engineSize: "2.0",
  },
  {
    brand: "Volvo",
    model: "S60",
    type: "luxury",
    year: "2016",
    engineSize: "2.0",
  },
  {
    brand: "Lexus",
    model: "IS",
    type: "luxury",
    year: "2017",
    engineSize: "2.5",
  },
];

export const CAR_COLORS = [
  0x3366cc, // Azul
  0xcc3333, // Vermelho
  0x33cc33, // Verde
  0xcccc33, // Amarelo
  0xcc33cc, // Roxo
  0xff9933, // Laranja
  0x666666, // Prata
  0x333333, // Preto
  0xffffff, // Branco
  0x996633, // Marrom
];
