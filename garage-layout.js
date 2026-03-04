// garage-layout.js - Configuração do layout 3D da garagem

export const GARAGE_CONFIG = {
    // Tamanho e proporções
    dimensions: {
        width: 20,
        length: 25,
        height: 8
    },
    
    // Posições dos elevadores
    lifts: [
        { id: 1, position: [-5, 0, -2], rotation: 0, occupied: false },
        { id: 2, position: [5, 0, -2], rotation: 0, occupied: false },
        { id: 3, position: [-5, 0, 5], rotation: 0, occupied: false },
        { id: 4, position: [5, 0, 5], rotation: 0, occupied: false }
    ],
    
    // Posições das bancadas
    workbenches: [
        { id: 1, position: [-8, 0.8, -8], rotation: 0, type: 'main' },
        { id: 2, position: [8, 0.8, -8], rotation: 0, type: 'secondary' },
        { id: 3, position: [-8, 0.8, 8], rotation: Math.PI, type: 'secondary' },
        { id: 4, position: [8, 0.8, 8], rotation: Math.PI, type: 'main' }
    ],
    
    // Prateleiras de peças
    shelves: [
        { id: 1, position: [-9, 0, -3], rotation: 0, size: 'large' },
        { id: 2, position: [-9, 0, 3], rotation: 0, size: 'large' },
        { id: 3, position: [9, 0, -3], rotation: Math.PI, size: 'large' },
        { id: 4, position: [9, 0, 3], rotation: Math.PI, size: 'large' }
    ],
    
    // Armários de ferramentas
    toolCabinets: [
        { id: 1, position: [-7, 0, -9], rotation: 0, color: 0xcc3333 },
        { id: 2, position: [7, 0, -9], rotation: 0, color: 0x3333cc },
        { id: 3, position: [-7, 0, 9], rotation: Math.PI, color: 0x33cc33 },
        { id: 4, position: [7, 0, 9], rotation: Math.PI, color: 0xcc33cc }
    ],
    
    // Máquinas especiais
    machines: [
        { id: 'tire', position: [-4, 0, -8], rotation: 0, type: 'tire-changer' },
        { id: 'alignment', position: [4, 0, -8], rotation: 0, type: 'alignment' },
        { id: 'diagnostic', position: [0, 0, -9], rotation: 0, type: 'diagnostic-computer' }
    ],
    
    // Iluminação
    lights: {
        ceiling: [
            { position: [-4, 7, -4], intensity: 0.8 },
            { position: [4, 7, -4], intensity: 0.8 },
            { position: [-4, 7, 4], intensity: 0.8 },
            { position: [4, 7, 4], intensity: 0.8 },
            { position: [0, 7, 0], intensity: 1.2 }
        ],
        wall: [
            { position: [-9, 3, -8], intensity: 0.5 },
            { position: [9, 3, -8], intensity: 0.5 },
            { position: [-9, 3, 8], intensity: 0.5 },
            { position: [9, 3, 8], intensity: 0.5 }
        ]
    },
    
    // Decoração
    decorations: [
        { type: 'poster', position: [-8, 3, -9], rotation: 0, texture: 'poster1' },
        { type: 'poster', position: [8, 3, -9], rotation: 0, texture: 'poster2' },
        { type: 'calendar', position: [0, 3, -9], rotation: 0, texture: 'calendar' },
        { type: 'clock', position: [-9, 5, 0], rotation: Math.PI/2, texture: 'clock' }
    ]
};