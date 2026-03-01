// constants.js
export const TOOL_BASE_STATS = {
    wrench: { baseRepair: 10, baseCost: 50, name: 'Chave Inglesa', icon: '🔧' },
    screwdriver: { baseRepair: 5, baseCost: 25, name: 'Chave de Fenda', icon: '🪛' },
    hammer: { baseRepair: 15, baseCost: 75, name: 'Martelo', icon: '🔨' },
    welder: { baseRepair: 25, baseCost: 150, name: 'Maçarico', icon: '⚡' },
    diagnostic: { baseRepair: 0, baseCost: 0, name: 'Diagnóstico', icon: '📊' }
};

export const PART_TRANSLATIONS = {
    motor: { display: 'Motor', basePrice: 800, icon: '⚙️' },
    transmissao: { display: 'Transmissão', basePrice: 600, icon: '⚙️' },
    freios: { display: 'Freios', basePrice: 300, icon: '🛑' },
    suspensao: { display: 'Suspensão', basePrice: 400, icon: '🔧' },
    bateria: { display: 'Bateria', basePrice: 150, icon: '🔋' },
    alternador: { display: 'Alternador', basePrice: 250, icon: '⚡' },
    radiador: { display: 'Radiador', basePrice: 200, icon: '💧' },
    escapamento: { display: 'Escapamento', basePrice: 180, icon: '💨' }
};

export const PART_POSITIONS = {
    motor: [0, 1.3, 1.2],
    transmissao: [0, 1.0, 0.5],
    freios: [0, 0.5, 1.8],
    suspensao: [0, 0.3, 1.2],
    bateria: [0.5, 1.0, 1.2],
    alternador: [-0.5, 1.0, 1.2],
    radiador: [0, 1.0, 1.8],
    escapamento: [0, 0.3, -1.5]
};