// car-models.js - Modelos 3D de carros realistas

import * as THREE from 'three';

export class CarModels {
    constructor() {
        this.models = {};
        this.textures = {};
    }

    // Criar textura padrão para carros
    createCarTexture(color, metallic = 0.7, roughness = 0.3) {
        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: metallic,
            roughness: roughness,
            emissive: 0x000000
        });
    }

    // Modelo de Sedan (mais comum)
    createSedan(color = 0x3366cc) {
        const group = new THREE.Group();
        
        // Carroceria principal
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.6, 4.8);
        const bodyMat = this.createCarTexture(color);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabine
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 1.8);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Capô
        const hoodGeo = new THREE.BoxGeometry(2.0, 0.3, 1.4);
        const hoodMat = this.createCarTexture(color);
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.set(0, 0.95, 1.2);
        hood.castShadow = true;
        hood.receiveShadow = true;
        group.add(hood);
        
        // Porta-malas
        const trunkGeo = new THREE.BoxGeometry(2.0, 0.4, 1.2);
        const trunkMat = this.createCarTexture(color);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(0, 0.9, -1.6);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        
        // Para-choque dianteiro
        const bumperFrontGeo = new THREE.BoxGeometry(2.1, 0.3, 0.3);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const bumperFront = new THREE.Mesh(bumperFrontGeo, bumperMat);
        bumperFront.position.set(0, 0.4, 2.3);
        bumperFront.castShadow = true;
        group.add(bumperFront);
        
        // Para-choque traseiro
        const bumperRearGeo = new THREE.BoxGeometry(2.1, 0.3, 0.3);
        const bumperRear = new THREE.Mesh(bumperRearGeo, bumperMat);
        bumperRear.position.set(0, 0.4, -2.3);
        bumperRear.castShadow = true;
        group.add(bumperRear);
        
        // Faróis
        const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0x332200 });
        const headlightLeft = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16), headlightMat);
        headlightLeft.position.set(-0.8, 0.7, 2.3);
        headlightLeft.castShadow = true;
        group.add(headlightLeft);
        
        const headlightRight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16), headlightMat);
        headlightRight.position.set(0.8, 0.7, 2.3);
        headlightRight.castShadow = true;
        group.add(headlightRight);
        
        // Lanternas
        const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x330000 });
        const taillightLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16), taillightMat);
        taillightLeft.position.set(-0.8, 0.7, -2.3);
        taillightLeft.castShadow = true;
        group.add(taillightLeft);
        
        const taillightRight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16), taillightMat);
        taillightRight.position.set(0.8, 0.7, -2.3);
        taillightRight.castShadow = true;
        group.add(taillightRight);
        
        // Rodas
        this.addWheels(group, 0.5);
        
        return group;
    }

    // Modelo de Hatch
    createHatch(color = 0xcc3333) {
        const group = new THREE.Group();
        
        // Carroceria principal
        const bodyGeo = new THREE.BoxGeometry(2.0, 0.7, 4.2);
        const bodyMat = this.createCarTexture(color);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabine (maior proporção)
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.6, 2.0);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.2);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Capô curto
        const hoodGeo = new THREE.BoxGeometry(1.9, 0.3, 1.0);
        const hoodMat = this.createCarTexture(color);
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.set(0, 0.95, 1.2);
        hood.castShadow = true;
        hood.receiveShadow = true;
        group.add(hood);
        
        // Porta traseira integrada
        const rearGeo = new THREE.BoxGeometry(1.9, 0.5, 0.8);
        const rearMat = this.createCarTexture(color);
        const rear = new THREE.Mesh(rearGeo, rearMat);
        rear.position.set(0, 0.8, -1.6);
        rear.castShadow = true;
        rear.receiveShadow = true;
        group.add(rear);
        
        this.addWheels(group, 0.5);
        this.addLights(group, 2.1, -2.1);
        
        return group;
    }

    // Modelo de SUV
    createSUV(color = 0x33cc33) {
        const group = new THREE.Group();
        
        // Carroceria maior
        const bodyGeo = new THREE.BoxGeometry(2.3, 0.9, 5.0);
        const bodyMat = this.createCarTexture(color, 0.5, 0.5);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabine alta
        const cabinGeo = new THREE.BoxGeometry(2.1, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.2, -0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Capô robusto
        const hoodGeo = new THREE.BoxGeometry(2.2, 0.4, 1.4);
        const hoodMat = this.createCarTexture(color, 0.5, 0.5);
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.set(0, 1.1, 1.3);
        hood.castShadow = true;
        hood.receiveShadow = true;
        group.add(hood);
        
        // Rodas maiores
        this.addWheels(group, 0.6);
        this.addLights(group, 2.4, -2.4);
        
        // Rack de teto
        this.addRoofRack(group);
        
        return group;
    }

    // Modelo de Pickup
    createPickup(color = 0x996633) {
        const group = new THREE.Group();
        
        // Cabine
        const cabGeo = new THREE.BoxGeometry(2.0, 0.8, 2.0);
        const cabMat = this.createCarTexture(color, 0.3, 0.7);
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 0.8, 0.5);
        cab.castShadow = true;
        cab.receiveShadow = true;
        group.add(cab);
        
        // Caçamba
        const bedGeo = new THREE.BoxGeometry(2.1, 0.6, 2.5);
        const bedMat = this.createCarTexture(color, 0.3, 0.7);
        const bed = new THREE.Mesh(bedGeo, bedMat);
        bed.position.set(0, 0.7, -1.3);
        bed.castShadow = true;
        bed.receiveShadow = true;
        group.add(bed);
        
        // Capô
        const hoodGeo = new THREE.BoxGeometry(2.0, 0.4, 1.2);
        const hoodMat = this.createCarTexture(color, 0.3, 0.7);
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.set(0, 1.0, 1.5);
        hood.castShadow = true;
        hood.receiveShadow = true;
        group.add(hood);
        
        // Rodas grandes
        this.addWheels(group, 0.65);
        this.addLights(group, 2.2, -2.4);
        
        return group;
    }

    // Modelo Esportivo
    createSports(color = 0xff3333) {
        const group = new THREE.Group();
        
        // Carroceria baixa e larga
        const bodyGeo = new THREE.BoxGeometry(2.4, 0.5, 4.8);
        const bodyMat = this.createCarTexture(color, 0.9, 0.2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Cabine aerodinâmica
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.4, 1.6);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 0.8, -0.4);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Spoiler
        const spoilerGeo = new THREE.BoxGeometry(1.6, 0.1, 0.2);
        const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        spoiler.position.set(0, 0.9, -2.2);
        spoiler.castShadow = true;
        group.add(spoiler);
        
        // Rodas esportivas
        this.addWheels(group, 0.55);
        this.addLights(group, 2.3, -2.3);
        this.addSportDetails(group);
        
        return group;
    }

    // Utilitários para adicionar componentes
    addWheels(group, size) {
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        
        const positions = [
            [-1.0, 0.3, 1.4],
            [1.0, 0.3, 1.4],
            [-1.0, 0.3, -1.4],
            [1.0, 0.3, -1.4]
        ];
        
        positions.forEach(pos => {
            // Pneu
            const wheelGeo = new THREE.CylinderGeometry(size, size, 0.3, 24);
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            group.add(wheel);
            
            // Roda
            const rimGeo = new THREE.CylinderGeometry(size * 0.6, size * 0.6, 0.31, 8);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            rim.position.set(pos[0], pos[1], pos[2]);
            rim.castShadow = true;
            group.add(rim);
        });
    }

    addLights(group, frontZ, rearZ) {
        const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0x332200 });
        const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x330000 });
        
        // Faróis
        const headLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16), headlightMat);
        headLeft.position.set(-0.9, 0.5, frontZ);
        group.add(headLeft);
        
        const headRight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16), headlightMat);
        headRight.position.set(0.9, 0.5, frontZ);
        group.add(headRight);
        
        // Lanternas
        const tailLeft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16), taillightMat);
        tailLeft.position.set(-0.9, 0.5, rearZ);
        group.add(tailLeft);
        
        const tailRight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16), taillightMat);
        tailRight.position.set(0.9, 0.5, rearZ);
        group.add(tailRight);
    }

    addRoofRack(group) {
        const rackMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        
        for (let i = -1; i <= 1; i += 2) {
            const barGeo = new THREE.BoxGeometry(2.0, 0.05, 0.1);
            const bar = new THREE.Mesh(barGeo, rackMat);
            bar.position.set(0, 1.6, i * 1.0);
            bar.castShadow = true;
            group.add(bar);
        }
    }

    addSportDetails(group) {
        // Aerofólio traseiro
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const wingGeo = new THREE.BoxGeometry(1.8, 0.1, 0.3);
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(0, 0.95, -2.1);
        wing.castShadow = true;
        group.add(wing);
        
        // Saídas de ar laterais
        const ventMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const ventGeo = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        
        const ventLeft = new THREE.Mesh(ventGeo, ventMat);
        ventLeft.position.set(-1.2, 0.5, -0.5);
        group.add(ventLeft);
        
        const ventRight = new THREE.Mesh(ventGeo, ventMat);
        ventRight.position.set(1.2, 0.5, -0.5);
        group.add(ventRight);
    }

    // Método principal para criar carro baseado no tipo
    createCarByType(type, color) {
        switch(type) {
            case 'sedan':
                return this.createSedan(color);
            case 'hatch':
                return this.createHatch(color);
            case 'suv':
                return this.createSUV(color);
            case 'pickup':
                return this.createPickup(color);
            case 'sports':
                return this.createSports(color);
            default:
                return this.createSedan(color);
        }
    }
}