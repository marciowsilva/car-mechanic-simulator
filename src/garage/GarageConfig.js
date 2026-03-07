// src/garage/GarageConfig.js - Configuração da garagem realista

export const GarageConfig = {
    // Dimensões da garagem
    dimensions: {
        width: 25,
        length: 30,
        height: 8,
        wallThickness: 0.3
    },

    // Cores e materiais
    materials: {
        floor: {
            color: 0x2a2a2a,
            roughness: 0.7,
            metalness: 0.1,
            emissive: 0x000000
        },
        walls: {
            color: 0x3a3a3a,
            roughness: 0.8,
            metalness: 0.1
        },
        pillars: {
            color: 0x555555,
            roughness: 0.6,
            metalness: 0.3
        },
        lifts: {
            primary: 0xcccccc,
            secondary: 0xff6b00,
            metalness: 0.8,
            roughness: 0.3
        },
        workbenches: {
            wood: 0x8B4513,
            metal: 0x666666,
            top: 0x2a2a2a
        }
    },

    // Posições dos elevadores
    lifts: [
        { id: 1, position: [-6, 0, -5], rotation: 0, width: 2.5, length: 4.5 },
        { id: 2, position: [6, 0, -5], rotation: 0, width: 2.5, length: 4.5 },
        { id: 3, position: [-6, 0, 5], rotation: 0, width: 2.5, length: 4.5 },
        { id: 4, position: [6, 0, 5], rotation: 0, width: 2.5, length: 4.5 }
    ],

    // Bancadas de trabalho
    workbenches: [
        { id: 1, position: [-9, 0, -11], rotation: 0, type: 'main' },
        { id: 2, position: [9, 0, -11], rotation: 0, type: 'secondary' },
        { id: 3, position: [-9, 0, 11], rotation: Math.PI, type: 'secondary' },
        { id: 4, position: [9, 0, 11], rotation: Math.PI, type: 'main' }
    ],

    // Prateleiras
    shelves: [
        { id: 1, position: [-11, 0, -3], rotation: 0, size: 'large' },
        { id: 2, position: [-11, 0, 3], rotation: 0, size: 'large' },
        { id: 3, position: [11, 0, -3], rotation: Math.PI, size: 'large' },
        { id: 4, position: [11, 0, 3], rotation: Math.PI, size: 'large' }
    ],

    // Armários de ferramentas
    toolCabinets: [
        { id: 1, position: [-8, 0, -13], rotation: 0, color: 0xcc3333 },
        { id: 2, position: [8, 0, -13], rotation: 0, color: 0x3333cc },
        { id: 3, position: [-8, 0, 13], rotation: Math.PI, color: 0x33cc33 },
        { id: 4, position: [8, 0, 13], rotation: Math.PI, color: 0xcc33cc }
    ],

    // Máquinas especiais
    machines: [
        { id: 'tire', position: [-4, 0, -12], rotation: 0, type: 'tire-changer' },
        { id: 'alignment', position: [4, 0, -12], rotation: 0, type: 'alignment' },
        { id: 'diagnostic', position: [0, 0, -13], rotation: 0, type: 'diagnostic-computer' },
        { id: 'compressor', position: [-8, 0, 12], rotation: 0, type: 'air-compressor' },
        { id: 'partsWasher', position: [8, 0, 12], rotation: 0, type: 'parts-washer' }
    ],

    // Iluminação
    lighting: {
        ambient: {
            color: 0x404060,
            intensity: 0.3
        },
        main: {
            position: [5, 10, 5],
            color: 0xffeedd,
            intensity: 1.2,
            shadowSize: 2048
        },
        ceiling: [
            { position: [-4, 7, -4], intensity: 0.8, color: 0xffeedd },
            { position: [4, 7, -4], intensity: 0.8, color: 0xffeedd },
            { position: [-4, 7, 4], intensity: 0.8, color: 0xffeedd },
            { position: [4, 7, 4], intensity: 0.8, color: 0xffeedd },
            { position: [0, 7, 0], intensity: 1.2, color: 0xffffff }
        ],
        wall: [
            { position: [-12, 3, -8], intensity: 0.5, color: 0x88aaff },
            { position: [12, 3, -8], intensity: 0.5, color: 0x88aaff },
            { position: [-12, 3, 8], intensity: 0.5, color: 0x88aaff },
            { position: [12, 3, 8], intensity: 0.5, color: 0x88aaff }
        ],
        workLights: [
            { position: [-9, 2, -11], intensity: 0.8, color: 0xffaa88 },
            { position: [9, 2, -11], intensity: 0.8, color: 0xffaa88 },
            { position: [-9, 2, 11], intensity: 0.8, color: 0xffaa88 },
            { position: [9, 2, 11], intensity: 0.8, color: 0xffaa88 }
        ]
    },

    // Decoração
    decorations: {
        posters: [
            { position: [-10, 2.5, -14], rotation: 0, scale: [2, 1.5, 0.1] },
            { position: [10, 2.5, -14], rotation: 0, scale: [2, 1.5, 0.1] },
            { position: [-10, 2.5, 14], rotation: 0, scale: [2, 1.5, 0.1] },
            { position: [10, 2.5, 14], rotation: 0, scale: [2, 1.5, 0.1] }
        ],
        signs: [
            { position: [-6, 4, -14], text: "OFICINA", color: 0xff6b00 },
            { position: [6, 4, -14], text: "MECÂNICA", color: 0xff6b00 },
            { position: [0, 5, -14], text: "🚗", color: 0xffffff }
        ],
        tires: [
            { position: [-10, 0.2, 8], count: 3 },
            { position: [10, 0.2, 8], count: 2 },
            { position: [-5, 0.2, 10], count: 4 }
        ],
        tools: [
            { position: [-8.5, 1.2, -12], type: 'wrench' },
            { position: [-7.5, 1.2, -12], type: 'hammer' },
            { position: [8.5, 1.2, -12], type: 'screwdriver' }
        ]
    }
};