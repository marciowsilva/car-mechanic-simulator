// src/garage/RealisticGarageConfig.js - Configuração fotorrealista da garagem

export const RealisticGarageConfig = {
    // Dimensões precisas (em metros)
    dimensions: {
        width: 30,
        length: 40,
        height: 10,
        wallThickness: 0.3
    },

    // Cores e materiais realistas
    materials: {
        concrete: {
            color: 0x7a7a7a,
            roughness: 0.9,
            metalness: 0.1,
            emissive: 0x000000
        },
        metal: {
            color: 0x888888,
            roughness: 0.4,
            metalness: 0.9
        },
        wornMetal: {
            color: 0x6a6a6a,
            roughness: 0.7,
            metalness: 0.8
        },
        plastic: {
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.0
        },
        wood: {
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        },
        glass: {
            color: 0xaaccff,
            roughness: 0.1,
            metalness: 0.0,
            transparent: true,
            opacity: 0.3
        },
        rubber: {
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.0
        },
        oilStain: {
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x000000
        }
    },

    // Iluminação realista
    lighting: {
        ambient: {
            color: 0x404060,
            intensity: 0.4
        },
        main: {
            position: [10, 15, 10],
            color: 0xfff5e6,
            intensity: 1.5,
            shadowSize: 4096,
            castShadow: true
        },
        fill: {
            position: [-8, 5, 8],
            color: 0x4466ff,
            intensity: 0.5
        },
        back: {
            position: [5, 8, -10],
            color: 0xffaa66,
            intensity: 0.4
        },
        ceiling: [
            // Fluorescentes
            { position: [-8, 9, -12], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [0, 9, -12], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [8, 9, -12], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [-8, 9, -4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [0, 9, -4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [8, 9, -4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [-8, 9, 4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [0, 9, 4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 },
            { position: [8, 9, 4], intensity: 1.2, color: 0xfff5e6, angle: 0.8, penumbra: 0.5 }
        ],
        workLights: [
            { position: [-10, 3, -10], target: [-8, 1, -8], intensity: 0.8, color: 0xffaa88 },
            { position: [10, 3, -10], target: [8, 1, -8], intensity: 0.8, color: 0xffaa88 },
            { position: [-10, 3, 10], target: [-8, 1, 8], intensity: 0.8, color: 0xffaa88 },
            { position: [10, 3, 10], target: [8, 1, 8], intensity: 0.8, color: 0xffaa88 }
        ],
        neon: [
            { position: [-12, 4, -15], color: 0xff6b00, intensity: 0.5 },
            { position: [12, 4, -15], color: 0xff6b00, intensity: 0.5 }
        ]
    },

    // Texturas (caminhos para imagens)
    textures: {
        concrete: '/src/assets/textures/concrete.jpg',
        concreteNormal: '/src/assets/textures/concrete_normal.jpg',
        concreteRoughness: '/src/assets/textures/concrete_rough.jpg',
        metal: '/src/assets/textures/metal.jpg',
        metalNormal: '/src/assets/textures/metal_normal.jpg',
        metalRoughness: '/src/assets/textures/metal_rough.jpg',
        wood: '/src/assets/textures/wood.jpg',
        woodNormal: '/src/assets/textures/wood_normal.jpg',
        oil: '/src/assets/textures/oil.jpg',
        poster1: '/src/assets/textures/poster1.jpg',
        poster2: '/src/assets/textures/poster2.jpg',
        sign: '/src/assets/textures/sign.png'
    },

    // Posições detalhadas dos equipamentos
    equipment: {
        // Elevadores (4 no total)
        lifts: [
            { id: 1, position: [-7, 0, -8], rotation: 0, width: 3.0, length: 5.0 },
            { id: 2, position: [7, 0, -8], rotation: 0, width: 3.0, length: 5.0 },
            { id: 3, position: [-7, 0, 8], rotation: 0, width: 3.0, length: 5.0 },
            { id: 4, position: [7, 0, 8], rotation: 0, width: 3.0, length: 5.0 }
        ],

        // Máquinas de rodas
        tireChanger: { position: [-11, 0, -12], rotation: 0 },
        wheelBalancer: { position: [-9, 0, -12], rotation: 0 },

        // Suspensão
        springPuller: { position: [-7, 0, -12], rotation: 0 },

        // Dreno de óleo
        oilDrain: { position: [-5, 0, -12], rotation: 0 },

        // Máquinas de motor
        engineCrane: { position: [-3, 0, -12], rotation: 0, railLength: 8 },
        engineStand: { position: [-1, 0, -12], rotation: 0 },

        // Carregador de bateria
        batteryCharger: { position: [1, 0, -12], rotation: 0 },

        // Solda
        weldingMachine: { position: [3, 0, -12], rotation: 0 },

        // Pintura
        paintShop: { position: [5, 0, -12], rotation: 0 },
        paintBooth: { position: [7, 0, -12], rotation: 0, width: 4, height: 3, depth: 4 },

        // Estacionamento
        parking: {
            spots: [
                { position: [-14, 0, -4], rotation: 0, occupied: false },
                { position: [-14, 0, 0], rotation: 0, occupied: false },
                { position: [-14, 0, 4], rotation: 0, occupied: false },
                { position: [14, 0, -4], rotation: Math.PI, occupied: false },
                { position: [14, 0, 0], rotation: Math.PI, occupied: false },
                { position: [14, 0, 4], rotation: Math.PI, occupied: false }
            ]
        },

        // Depósito
        warehouse: {
            shelves: [
                { position: [-13, 0, -8], rotation: 0, levels: 4 },
                { position: [-13, 0, -4], rotation: 0, levels: 4 },
                { position: [-13, 0, 0], rotation: 0, levels: 4 },
                { position: [-13, 0, 4], rotation: 0, levels: 4 },
                { position: [13, 0, -8], rotation: Math.PI, levels: 4 },
                { position: [13, 0, -4], rotation: Math.PI, levels: 4 },
                { position: [13, 0, 0], rotation: Math.PI, levels: 4 },
                { position: [13, 0, 4], rotation: Math.PI, levels: 4 }
            ]
        },

        // Área de testes
        testArea: {
            start: [-10, 0, 14],
            end: [10, 0, 14],
            rollers: [
                { position: [-5, 0.2, 14], rotation: 0 },
                { position: [0, 0.2, 14], rotation: 0 },
                { position: [5, 0.2, 14], rotation: 0 }
            ]
        },

        // Conforto
        radio: { position: [-12, 2, -14], rotation: 0 },
        computer: { position: [-10, 1, -14], rotation: 0 },
        sofa: { position: [-8, 0, -14], rotation: 0 },
        coffeeMachine: { position: [-6, 0, -14], rotation: 0 },
        vendingMachine: { position: [-4, 0, -14], rotation: 0 },

        // Decoração
        posters: [
            { position: [-14, 2.5, -6], rotation: 0, texture: 'poster1' },
            { position: [-14, 2.5, -2], rotation: 0, texture: 'poster2' },
            { position: [-14, 2.5, 2], rotation: 0, texture: 'poster1' },
            { position: [-14, 2.5, 6], rotation: 0, texture: 'poster2' },
            { position: [14, 2.5, -6], rotation: Math.PI, texture: 'poster1' },
            { position: [14, 2.5, -2], rotation: Math.PI, texture: 'poster2' },
            { position: [14, 2.5, 2], rotation: Math.PI, texture: 'poster1' },
            { position: [14, 2.5, 6], rotation: Math.PI, texture: 'poster2' }
        ],
        
        signs: [
            { position: [0, 4, -16], text: "CAR MECHANIC SIMULATOR", color: 0xff6b00, size: 2 },
            { position: [-8, 3, -16], text: "ELEVADORES", color: 0xffffff, size: 1 },
            { position: [8, 3, -16], text: "OFICINA", color: 0xffffff, size: 1 }
        ],

        tires: [
            { position: [-12, 0.3, 10], rotation: 0, count: 4 },
            { position: [12, 0.3, 10], rotation: 0, count: 3 },
            { position: [-5, 0.3, 12], rotation: 0, count: 2 },
            { position: [5, 0.3, 12], rotation: 0, count: 2 }
        ],

        tools: [
            { position: [-11.5, 1.2, -13], type: 'wrench' },
            { position: [-11, 1.2, -13], type: 'hammer' },
            { position: [-10.5, 1.2, -13], type: 'screwdriver' },
            { position: [11.5, 1.2, -13], type: 'pliers' },
            { position: [11, 1.2, -13], type: 'drill' }
        ],

        // Sujeira e manchas (para realismo)
        stains: [
            { position: [-5, 0.02, -5], size: 1.5, intensity: 0.7 },
            { position: [3, 0.02, 2], size: 1.2, intensity: 0.5 },
            { position: [-2, 0.02, 7], size: 2.0, intensity: 0.8 },
            { position: [6, 0.02, -3], size: 1.0, intensity: 0.4 },
            { position: [-7, 0.02, 4], size: 1.8, intensity: 0.6 }
        ],

        // Marcas de pneu
        tireMarks: [
            { start: [-8, 0.01, -6], end: [-4, 0.01, -2] },
            { start: [5, 0.01, 3], end: [8, 0.01, 6] },
            { start: [-3, 0.01, 8], end: [-6, 0.01, 5] }
        ]
    }
};