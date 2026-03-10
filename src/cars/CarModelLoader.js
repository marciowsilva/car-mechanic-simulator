// src/cars/CarModelLoader.js - Loader integrado com CarModels detalhados

import * as THREE from 'three';
import { CarModels } from '/src/cars/CarModels.js';

// Paleta de cores por tipo de carro
const CAR_COLORS = {
    sedan:   [0x2255aa, 0x1a3a6a, 0xaa2222, 0x228844, 0x888888, 0xccaa00, 0x442288],
    hatch:   [0xcc2222, 0xee6600, 0x2266cc, 0x228833, 0xdddddd, 0x772299, 0x333333],
    suv:     [0x226622, 0x334455, 0x884422, 0x555555, 0xcc8800, 0x1a4a7a, 0x222222],
    pickup:  [0x884422, 0x333333, 0x1a3a6a, 0x226622, 0x555555, 0xcc6600, 0x442222],
    sports:  [0xdd1111, 0xff6600, 0x111111, 0x1155cc, 0xdddddd, 0xcc9900, 0x552299],
    classic: [0x225588, 0x883322, 0x224422, 0x888833, 0xcccccc, 0x884488, 0x334455],
};

// Mapeamento de nome de carro do Job → tipo 3D
const MODEL_MAP = {
    // Sedãs
    'Toyota Corolla': 'sedan', 'Honda Civic': 'sedan', 'Chevrolet Cruze': 'sedan',
    'Volkswagen Jetta': 'sedan', 'Ford Fusion': 'sedan', 'Nissan Sentra': 'sedan',
    'Hyundai Elantra': 'sedan', 'Fiat Linea': 'sedan',
    // Hatches
    'Volkswagen Gol': 'hatch', 'Fiat Palio': 'hatch', 'Chevrolet Onix': 'hatch',
    'Ford Ka': 'hatch', 'Renault Sandero': 'hatch', 'Hyundai HB20': 'hatch',
    'Peugeot 208': 'hatch', 'Citroën C3': 'hatch',
    // SUVs
    'Honda HR-V': 'suv', 'Toyota RAV4': 'suv', 'Jeep Compass': 'suv',
    'Volkswagen T-Cross': 'suv', 'Chevrolet Tracker': 'suv', 'Ford EcoSport': 'suv',
    'Mitsubishi Outlander': 'suv', 'Nissan Kicks': 'suv',
    // Pickups
    'Ford Ranger': 'pickup', 'Chevrolet S10': 'pickup', 'Toyota Hilux': 'pickup',
    'Fiat Toro': 'pickup', 'Volkswagen Amarok': 'pickup', 'Mitsubishi L200': 'pickup',
    // Esportivos
    'Chevrolet Camaro': 'sports', 'Ford Mustang': 'sports', 'Honda Civic Type-R': 'sports',
    'Volkswagen Golf GTI': 'sports', 'Subaru BRZ': 'sports', 'Mazda MX-5': 'sports',
    // Clássicos
    'Chevrolet Opala': 'classic', 'Volkswagen Fusca': 'classic', 'Ford Maverick': 'classic',
    'Ford Corcel': 'classic', 'Chevrolet Caravan': 'classic',
};

export class CarModelLoader {
    constructor() {
        this.carModels = new CarModels();
        this.modelCache = new Map();
    }

    // ─── Resolve o tipo 3D a partir do nome do modelo do job ─────────────────
    resolveType(modelName) {
        if (!modelName) return 'sedan';
        // Busca direta
        if (MODEL_MAP[modelName]) return MODEL_MAP[modelName];
        // Busca parcial (ex: "Toyota Corolla 2018" → "sedan")
        for (const [key, type] of Object.entries(MODEL_MAP)) {
            if (modelName.toLowerCase().includes(key.toLowerCase())) return type;
        }
        // Fallback por palavras-chave no nome
        const lc = modelName.toLowerCase();
        if (lc.includes('suv') || lc.includes('4x4') || lc.includes('jeep'))  return 'suv';
        if (lc.includes('pick') || lc.includes('truck') || lc.includes('hilux')) return 'pickup';
        if (lc.includes('sport') || lc.includes('gti') || lc.includes('turbo')) return 'sports';
        if (lc.includes('classic') || lc.includes('antigo') || lc.includes('opala')) return 'classic';
        if (lc.includes('hatch') || lc.includes('gol') || lc.includes('ka'))   return 'hatch';
        return 'sedan';
    }

    // ─── Cor aleatória consistente por nome do modelo ─────────────────────────
    resolveColor(modelName, type) {
        const palette = CAR_COLORS[type] || CAR_COLORS.sedan;
        // Hash simples do nome para sempre gerar a mesma cor para o mesmo modelo
        let hash = 0;
        for (let i = 0; i < (modelName || '').length; i++) {
            hash = (hash * 31 + modelName.charCodeAt(i)) & 0xffffff;
        }
        return palette[hash % palette.length];
    }

    // ─── Carrega (ou retorna do cache) um modelo 3D ───────────────────────────
    async loadModel(modelName, forceColor = null) {
        const type  = this.resolveType(modelName);
        const color = forceColor ?? this.resolveColor(modelName, type);
        const key   = `${type}_${color}`;

        if (this.modelCache.has(key)) {
            return this.modelCache.get(key).clone();
        }

        const model = this.carModels.createCarByType(type, color);
        this.modelCache.set(key, model);
        return model.clone();
    }

    // ─── Versão síncrona (sem await) para uso inline ──────────────────────────
    loadModelSync(modelName, forceColor = null) {
        const type  = this.resolveType(modelName);
        const color = forceColor ?? this.resolveColor(modelName, type);
        return this.carModels.createCarByType(type, color);
    }

    // ─── Pré-carrega todos os tipos ───────────────────────────────────────────
    async preloadAllModels(onProgress) {
        const types = ['sedan', 'hatch', 'suv', 'pickup', 'sports', 'classic'];
        for (let i = 0; i < types.length; i++) {
            const color = CAR_COLORS[types[i]][0];
            const key   = `${types[i]}_${color}`;
            if (!this.modelCache.has(key)) {
                const model = this.carModels.createCarByType(types[i], color);
                this.modelCache.set(key, model);
            }
            if (onProgress) onProgress((i + 1) / types.length);
        }
    }

    getCacheStats() {
        return { size: this.modelCache.size, models: Array.from(this.modelCache.keys()) };
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CarModelLoader = CarModelLoader;
}
