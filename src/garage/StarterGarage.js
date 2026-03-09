// src/garage/StarterGarage.js - Versão corrigida que funciona

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class StarterGarage {
    constructor(container) {
        
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupLights();
        this.createLevel1();
        
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 5, 12);
        this.camera.lookAt(0, 1, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 1, 0);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
    }

    createLevel1() {
        
        // Chão
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // 1 elevador
        this.createLift(0, 0, 0);
        
        // 1 bancada
        this.createWorkbench(-4, 0, -4);
        
        // 1 armário
        this.createCabinet(5, 0, -4, 0xcc3333);
        
    }

    createLift(x, y, z) {
        const group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.BoxGeometry(2.5, 0.2, 4.5);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Colunas
        const colGeo = new THREE.BoxGeometry(0.2, 2.0, 0.2);
        const colMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        
        const positions = [
            [-1.0, 1.0, -2.0],
            [1.0, 1.0, -2.0],
            [-1.0, 1.0, 2.0],
            [1.0, 1.0, 2.0]
        ];
        
        positions.forEach(pos => {
            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(pos[0], pos[1], pos[2]);
            col.castShadow = true;
            col.receiveShadow = true;
            group.add(col);
        });

        // Braços
        const armGeo = new THREE.BoxGeometry(2.1, 0.1, 0.3);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });
        
        const arm1 = new THREE.Mesh(armGeo, armMat);
        arm1.position.set(0, 0.5, -1.5);
        arm1.castShadow = true;
        group.add(arm1);
        
        const arm2 = new THREE.Mesh(armGeo, armMat);
        arm2.position.set(0, 0.5, 1.5);
        arm2.castShadow = true;
        group.add(arm2);

        group.position.set(x, y, z);
        this.scene.add(group);
    }

    createWorkbench(x, y, z) {
        const group = new THREE.Group();

        const baseGeo = new THREE.BoxGeometry(2.0, 0.8, 1.0);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.4;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const topGeo = new THREE.BoxGeometry(2.2, 0.1, 1.1);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 0.85;
        top.castShadow = true;
        group.add(top);

        group.position.set(x, y, z);
        this.scene.add(group);
    }

    createCabinet(x, y, z, color) {
        const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(x, y + 1.0, z);
        body.castShadow = true;
        body.receiveShadow = true;
        this.scene.add(body);
    }

    // Métodos de upgrade
    upgradeToLevel2() {
        this.createLift(4, 0, 2);        // Segundo elevador
        this.createWorkbench(4, 0, 4);   // Segunda bancada
    }

    upgradeToLevel3() {
        this.createLift(-3, 0, 3);       // Terceiro elevador
        this.createCabinet(-5, 0, -3, 0x33cc33); // Segundo armário
    }

    upgradeToLevel4() {
        this.createLift(3, 0, -2);       // Quarto elevador
    }

    upgradeToLevel5() {
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}