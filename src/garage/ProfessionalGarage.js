// src/garage/ProfessionalGarage.js - Garagem leve e profissional

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ProfessionalGarage {
    constructor(container) {
        
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        this.setupRenderer(container);
        this.setupCamera();
        this.setupControls();
        this.setupLights();
        this.createGarage();
        
        this.currentCar = null;
        this.animate();
    }

    setupRenderer(container) {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 4, 15);
        this.camera.lookAt(0, 1, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
        this.controls.target.set(0, 1, 0);
        this.controls.rotateSpeed = 1.0;
    }

    setupLights() {
        // Luz ambiente (iluminação base)
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        // Luz principal (direcional)
        const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        this.scene.add(mainLight);

        // Luz de preenchimento
        const fillLight = new THREE.PointLight(0x4466ff, 0.5);
        fillLight.position.set(-3, 3, 5);
        this.scene.add(fillLight);

        // Luz traseira
        const backLight = new THREE.PointLight(0xffaa66, 0.4);
        backLight.position.set(2, 3, -5);
        this.scene.add(backLight);
    }

    createGarage() {
        // ===== CHÃO =====
        const floorGeo = new THREE.CircleGeometry(20, 32);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid (opcional, para orientação)
        const gridHelper = new THREE.GridHelper(20, 20, 0xff6b00, 0x444444);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // ===== PAREDES =====
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
        const wallHeight = 4;

        // Parede dos fundos
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(20, wallHeight, 0.3), 
            wallMat
        );
        backWall.position.set(0, wallHeight/2, -10);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);

        // Paredes laterais
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, wallHeight, 20), 
            wallMat
        );
        leftWall.position.set(-10, wallHeight/2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, wallHeight, 20), 
            wallMat
        );
        rightWall.position.set(10, wallHeight/2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);

        // ===== ELEVADORES (4 no total) =====
        const liftPositions = [
            [-5, 0, -4],
            [5, 0, -4],
            [-5, 0, 4],
            [5, 0, 4]
        ];

        liftPositions.forEach(pos => {
            this.createLift(pos);
        });

        // ===== BANCADAS =====
        const benchPositions = [
            [-7, 0, -8],
            [7, 0, -8],
            [-7, 0, 8],
            [7, 0, 8]
        ];

        benchPositions.forEach(pos => {
            this.createWorkbench(pos);
        });

        // ===== ARMÁRIOS =====
        const cabinetColors = [0xcc3333, 0x3333cc, 0x33cc33, 0xcc33cc];
        const cabinetPositions = [
            [-8, 0, -9],
            [8, 0, -9],
            [-8, 0, 9],
            [8, 0, 9]
        ];

        cabinetPositions.forEach((pos, i) => {
            this.createCabinet(pos, cabinetColors[i]);
        });

        // ===== MÁQUINA DE RODAS =====
        this.createTireMachine([-9, 0, -6]);

        // ===== COMPUTADOR =====
        this.createComputer([-9, 0, 6]);

        // ===== PNEUS EMPILHADOS =====
        this.createTireStack([6, 0, 6], 3);
        this.createTireStack([-6, 0, -6], 2);
    }

    createLift(position) {
        const group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.BoxGeometry(2.2, 0.2, 4.2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        // Colunas
        const columnGeo = new THREE.BoxGeometry(0.2, 2.5, 0.2);
        const columnMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        
        const colPositions = [
            [-1.0, 1.3, -1.9],
            [1.0, 1.3, -1.9],
            [-1.0, 1.3, 1.9],
            [1.0, 1.3, 1.9]
        ];

        colPositions.forEach(pos => {
            const column = new THREE.Mesh(columnGeo, columnMat);
            column.position.set(pos[0], pos[1], pos[2]);
            column.castShadow = true;
            column.receiveShadow = true;
            group.add(column);
        });

        // Braços
        const armGeo = new THREE.BoxGeometry(1.8, 0.1, 0.3);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });
        
        const armPositions = [
            [0, 0.5, -1.2],
            [0, 0.5, 1.2]
        ];

        armPositions.forEach(pos => {
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.position.set(pos[0], pos[1], pos[2]);
            arm.castShadow = true;
            group.add(arm);
        });

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createWorkbench(position) {
        const group = new THREE.Group();

        // Base
        const baseGeo = new THREE.BoxGeometry(2.0, 0.8, 1.0);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.4;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Tampo
        const topGeo = new THREE.BoxGeometry(2.2, 0.1, 1.1);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 0.85;
        top.castShadow = true;
        group.add(top);

        // Gavetas
        for (let i = 0; i < 3; i++) {
            const drawerGeo = new THREE.BoxGeometry(1.8, 0.2, 0.8);
            const drawerMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const drawer = new THREE.Mesh(drawerGeo, drawerMat);
            drawer.position.set(0, 0.2 + i * 0.2, 0);
            drawer.castShadow = true;
            group.add(drawer);
        }

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createCabinet(position, color) {
        const group = new THREE.Group();

        // Corpo
        const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Gavetas
        for (let i = 0; i < 4; i++) {
            const drawerGeo = new THREE.BoxGeometry(1.0, 0.3, 0.1);
            const drawerMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const drawer = new THREE.Mesh(drawerGeo, drawerMat);
            drawer.position.set(0, 0.3 + i * 0.4, 0.35);
            drawer.castShadow = true;
            group.add(drawer);
        }

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createTireMachine(position) {
        const group = new THREE.Group();

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Coluna
        const columnGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
        const columnMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.position.set(0.3, 0.7, 0);
        column.castShadow = true;
        group.add(column);

        // Braço
        const armGeo = new THREE.BoxGeometry(0.8, 0.1, 0.2);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(0.8, 1.2, 0);
        arm.castShadow = true;
        group.add(arm);

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createComputer(position) {
        const group = new THREE.Group();

        // Mesa
        const deskGeo = new THREE.BoxGeometry(1.0, 0.1, 0.6);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.y = 0.55;
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        // Monitor
        const monitorGeo = new THREE.BoxGeometry(0.6, 0.5, 0.1);
        const monitorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.set(0, 1.0, 0);
        monitor.castShadow = true;
        group.add(monitor);

        // Tela
        const screenGeo = new THREE.BoxGeometry(0.5, 0.4, 0.02);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.0, 0.06);
        group.add(screen);

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createTireStack(position, count) {
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        for (let i = 0; i < count; i++) {
            const tireGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.rotation.x = Math.PI / 2;
            tire.position.set(
                position[0] + (Math.random() - 0.5) * 0.2,
                position[1] + 0.2 + i * 0.25,
                position[2] + (Math.random() - 0.5) * 0.2
            );
            tire.castShadow = true;
            tire.receiveShadow = true;
            this.scene.add(tire);
        }
    }

    createCar(carData, job) {
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
        }

        // Carro simples para teste
        const carGroup = new THREE.Group();
        
        // Carroceria
        const bodyGeo = new THREE.BoxGeometry(2.0, 0.6, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);
        
        // Cabine
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 1.4);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.0, -0.4);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        carGroup.add(cabin);
        
        // Rodas
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            [-0.9, 0.3, 1.2], [0.9, 0.3, 1.2],
            [-0.9, 0.3, -1.3], [0.9, 0.3, -1.3]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);
        });

        // Posicionar no primeiro elevador
        carGroup.position.set(-5, 0.2, -4);
        
        this.currentCar = carGroup;
        this.scene.add(carGroup);
        
        return carGroup;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}