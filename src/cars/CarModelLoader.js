// car-model-loader.js - Versão final simplificada

import * as THREE from 'three';

export class CarModelLoader {
    constructor() {
        console.log('🚗 Inicializando CarModelLoader (modo procedural)');
        this.modelCache = new Map();
    }

    async loadModel(modelType, color = 0x3366cc) {
        const cacheKey = `${modelType}_${color}`;
        
        if (this.modelCache.has(cacheKey)) {
            return this.modelCache.get(cacheKey).clone();
        }
        
        const model = this.createProceduralCar(modelType, color);
        this.modelCache.set(cacheKey, model.clone());
        
        return model;
    }

    createProceduralCar(type, color) {
        const group = new THREE.Group();
        const config = this.getCarConfig(type);
        
        // Carroceria
        const bodyGeo = new THREE.BoxGeometry(config.width, config.height, config.length);
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = config.bodyY;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabine
        const cabinGeo = new THREE.BoxGeometry(config.cabinWidth, config.cabinHeight, config.cabinLength);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, config.cabinY, config.cabinZ);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Rodas
        this.addWheels(group, config);
        
        return group;
    }

    addWheels(group, config) {
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const positions = [
            [-config.width/2, config.wheelY, config.length/3],
            [config.width/2, config.wheelY, config.length/3],
            [-config.width/2, config.wheelY, -config.length/3],
            [config.width/2, config.wheelY, -config.length/3]
        ];
        
        positions.forEach(pos => {
            const wheelGeo = new THREE.CylinderGeometry(config.wheelSize, config.wheelSize, 0.3, 16);
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            group.add(wheel);
        });
    }

    getCarConfig(type) {
        const configs = {
            sedan: { width: 2.2, height: 0.6, length: 4.8, cabinWidth: 1.8, cabinHeight: 0.5, cabinLength: 1.8, cabinY: 1.0, cabinZ: -0.5, bodyY: 0.6, wheelY: 0.3, wheelSize: 0.5 },
            hatch: { width: 2.0, height: 0.7, length: 4.2, cabinWidth: 1.8, cabinHeight: 0.6, cabinLength: 2.0, cabinY: 1.0, cabinZ: -0.2, bodyY: 0.6, wheelY: 0.3, wheelSize: 0.5 },
            suv: { width: 2.3, height: 0.9, length: 5.0, cabinWidth: 2.1, cabinHeight: 0.7, cabinLength: 2.2, cabinY: 1.2, cabinZ: -0.5, bodyY: 0.7, wheelY: 0.4, wheelSize: 0.6 },
            pickup: { width: 2.1, height: 0.8, length: 5.2, cabinWidth: 2.0, cabinHeight: 0.8, cabinLength: 2.0, cabinY: 1.0, cabinZ: 0.8, bodyY: 0.7, wheelY: 0.4, wheelSize: 0.65 },
            sports: { width: 2.4, height: 0.5, length: 4.8, cabinWidth: 1.8, cabinHeight: 0.4, cabinLength: 1.6, cabinY: 0.8, cabinZ: -0.4, bodyY: 0.4, wheelY: 0.25, wheelSize: 0.55 },
            classic: { width: 2.1, height: 0.7, length: 4.6, cabinWidth: 1.9, cabinHeight: 0.6, cabinLength: 1.9, cabinY: 1.0, cabinZ: -0.3, bodyY: 0.6, wheelY: 0.35, wheelSize: 0.55 }
        };
        return configs[type] || configs.sedan;
    }

    async preloadAllModels(onProgress) {
        const types = ['sedan', 'hatch', 'suv', 'pickup', 'sports', 'classic'];
        for (let i = 0; i < types.length; i++) {
            await this.loadModel(types[i]);
            if (onProgress) onProgress((i + 1) / types.length);
        }
        console.log('✅ Modelos procedurais carregados');
    }

    getCacheStats() {
        return { size: this.modelCache.size, models: Array.from(this.modelCache.keys()) };
    }
}