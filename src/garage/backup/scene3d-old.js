// scene3d.js - VERSÃO COMPLETA COM GARAGEM REALISTA E MODELOS 3D

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PART_TRANSLATIONS, PART_POSITIONS, CAR_COLORS } from './constants.js';
import { GARAGE_CONFIG } from './garage-layout.js';
import { CarModels } from './car-models.js';
import { gameState } from './game.js';

export class Scene3D {
    constructor(container) {
        console.log('🎮 Inicializando Scene3D com garagem realista...');
        
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        this.scene.fog = new THREE.Fog(0x111122, 20, 50);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 5, 15);
        this.camera.lookAt(0, 1, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.bias = 0.0001;
        container.appendChild(this.renderer.domElement);
        
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.left = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.5;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
        this.controls.target.set(0, 1, 0);
        
        this.carModels = new CarModels();
        this.currentCar = null;
        this.partLabels = [];
        this.partObjects = [];
        this.normalLabels = [];
        this.highlightRing = null;
        
        this.setupLights();
        this.setupEnvironment();
        this.createRealisticGarage();
        
        // Raycaster para detecção de clique
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        console.log('✅ Scene3D inicializada');
    }

    setupLights() {
        // Luz ambiente suave
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        // Luz principal do teto
        const mainLight = new THREE.DirectionalLight(0xffeedd, 1);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.receiveShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        // Luzes de teto (spots)
        if (GARAGE_CONFIG.lights && GARAGE_CONFIG.lights.ceiling) {
            GARAGE_CONFIG.lights.ceiling.forEach(lightConfig => {
                const light = new THREE.PointLight(0xffeedd, lightConfig.intensity);
                light.position.set(lightConfig.position[0], lightConfig.position[1], lightConfig.position[2]);
                light.castShadow = true;
                light.shadow.mapSize.width = 1024;
                light.shadow.mapSize.height = 1024;
                this.scene.add(light);

                // Adicionar emissor visível
                const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0x442200 });
                const bulbGeo = new THREE.SphereGeometry(0.2, 16);
                const bulb = new THREE.Mesh(bulbGeo, bulbMat);
                bulb.position.copy(light.position);
                this.scene.add(bulb);
            });
        }

        // Luzes de parede
        if (GARAGE_CONFIG.lights && GARAGE_CONFIG.lights.wall) {
            GARAGE_CONFIG.lights.wall.forEach(lightConfig => {
                const light = new THREE.PointLight(0x88aaff, lightConfig.intensity);
                light.position.set(lightConfig.position[0], lightConfig.position[1], lightConfig.position[2]);
                this.scene.add(light);
            });
        }
    }

    setupEnvironment() {
        // Chão de concreto
        const floorGeo = new THREE.PlaneGeometry(30, 30);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.1,
            emissive: 0x000000
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Marcas de pneu no chão (decals)
        for (let i = 0; i < 10; i++) {
            const markGeo = new THREE.PlaneGeometry(0.5, 1);
            const markMat = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a1a,
                transparent: true,
                opacity: 0.3
            });
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.rotation.x = -Math.PI / 2;
            mark.position.set((Math.random() * 20) - 10, 0.01, (Math.random() * 20) - 10);
            mark.rotation.z = Math.random() * Math.PI;
            this.scene.add(mark);
        }

        // Linhas de demarcação no chão
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff6b00 });
        
        // Vagas de estacionamento
        if (GARAGE_CONFIG.lifts) {
            GARAGE_CONFIG.lifts.forEach(lift => {
                const points = [];
                points.push(new THREE.Vector3(lift.position[0] - 1.5, 0.02, lift.position[2] - 2.5));
                points.push(new THREE.Vector3(lift.position[0] - 1.5, 0.02, lift.position[2] + 2.5));
                points.push(new THREE.Vector3(lift.position[0] + 1.5, 0.02, lift.position[2] + 2.5));
                points.push(new THREE.Vector3(lift.position[0] + 1.5, 0.02, lift.position[2] - 2.5));
                points.push(new THREE.Vector3(lift.position[0] - 1.5, 0.02, lift.position[2] - 2.5));
                
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeo, lineMat);
                this.scene.add(line);
            });
        }
    }

    createRealisticGarage() {
        this.createWalls();
        this.createPillars();
        this.createDoors();
        this.createLifts();
        this.createWorkbenches();
        this.createShelves();
        this.createToolCabinets();
        this.createMachines();
        this.createDecorations();
    }

    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 });
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x112233 });
        
        const { width, length, height } = GARAGE_CONFIG.dimensions;
        const halfW = width / 2;
        const halfL = length / 2;

        // Parede dos fundos
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), wallMat);
        backWall.position.set(0, height/2, -halfL);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);

        // Parede frontal (com portas)
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(width/2 - 2, height, 0.3), wallMat);
        frontWallLeft.position.set(-(width/4 + 1), height/2, halfL);
        frontWallLeft.receiveShadow = true;
        frontWallLeft.castShadow = true;
        this.scene.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(width/2 - 2, height, 0.3), wallMat);
        frontWallRight.position.set(width/4 + 1, height/2, halfL);
        frontWallRight.receiveShadow = true;
        frontWallRight.castShadow = true;
        this.scene.add(frontWallRight);

        // Parede esquerda
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, length), wallMat);
        leftWall.position.set(-halfW, height/2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);

        // Parede direita (com janelas)
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, length), wallMat);
        rightWall.position.set(halfW, height/2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);

        // Janelas
        for (let i = -2; i <= 2; i+=2) {
            const windowGeo = new THREE.BoxGeometry(0.4, 2, 3);
            const windowMesh = new THREE.Mesh(windowGeo, windowMat);
            windowMesh.position.set(halfW, 3, i * 2);
            windowMesh.receiveShadow = true;
            this.scene.add(windowMesh);
        }

        // Teto (vigas)
        for (let i = -halfW + 2; i < halfW; i += 3) {
            const beamGeo = new THREE.BoxGeometry(0.3, 0.3, length - 2);
            const beamMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(i, height - 0.2, 0);
            beam.castShadow = true;
            beam.receiveShadow = true;
            this.scene.add(beam);
        }
    }

    createPillars() {
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const positions = [
            [-8, 0, -10], [8, 0, -10],
            [-8, 0, 10], [8, 0, 10]
        ];

        positions.forEach(pos => {
            const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], 4, pos[2]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });
    }

    createDoors() {
        // Portas de entrada (seccionais)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        
        for (let i = -3; i <= 3; i+= 6) {
            const doorGeo = new THREE.BoxGeometry(4, 4, 0.2);
            const door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(i, 2, 12.5);
            door.castShadow = true;
            door.receiveShadow = true;
            this.scene.add(door);

            // Moldura
            const frameGeo = new THREE.BoxGeometry(4.2, 4.2, 0.1);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(i, 2, 12.3);
            this.scene.add(frame);
        }
    }

    createLifts() {
        const liftMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });

        GARAGE_CONFIG.lifts.forEach(lift => {
            // Base do elevador
            const baseGeo = new THREE.BoxGeometry(2.5, 0.2, 4.5);
            const base = new THREE.Mesh(baseGeo, liftMat);
            base.position.set(lift.position[0], 0.1, lift.position[2]);
            base.receiveShadow = true;
            base.castShadow = true;
            this.scene.add(base);

            // Colunas
            const columnGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
            
            [-1.2, 1.2].forEach(xOffset => {
                const column = new THREE.Mesh(columnGeo, liftMat);
                column.position.set(lift.position[0] + xOffset, 1.5, lift.position[2] - 1.8);
                column.castShadow = true;
                column.receiveShadow = true;
                this.scene.add(column);
            });

            // Braços do elevador
            const armGeo = new THREE.BoxGeometry(2.0, 0.1, 0.3);
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.position.set(lift.position[0], 0.5, lift.position[2]);
            arm.castShadow = true;
            this.scene.add(arm);
        });
    }

    createWorkbenches() {
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const topMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

        GARAGE_CONFIG.workbenches.forEach(bench => {
            // Base da bancada
            const baseGeo = new THREE.BoxGeometry(2, 0.8, 1);
            const base = new THREE.Mesh(baseGeo, benchMat);
            base.position.set(bench.position[0], 0.4, bench.position[2]);
            base.castShadow = true;
            base.receiveShadow = true;
            this.scene.add(base);

            // Tampo
            const topGeo = new THREE.BoxGeometry(2.2, 0.1, 1.1);
            const top = new THREE.Mesh(topGeo, topMat);
            top.position.set(bench.position[0], 0.85, bench.position[2]);
            top.castShadow = true;
            top.receiveShadow = true;
            this.scene.add(top);

            // Gavetas (simplificadas)
            for (let i = 0; i < 3; i++) {
                const drawerGeo = new THREE.BoxGeometry(1.8, 0.15, 0.8);
                const drawerMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
                const drawer = new THREE.Mesh(drawerGeo, drawerMat);
                drawer.position.set(bench.position[0], 0.2 + i * 0.15, bench.position[2]);
                drawer.castShadow = true;
                this.scene.add(drawer);
            }
        });
    }

    createShelves() {
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

        GARAGE_CONFIG.shelves.forEach(shelf => {
            for (let level = 0; level < 4; level++) {
                // Prateleira horizontal
                const shelfGeo = new THREE.BoxGeometry(2.5, 0.1, 1.5);
                const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
                shelfMesh.position.set(shelf.position[0], 0.5 + level * 1.2, shelf.position[2]);
                shelfMesh.castShadow = true;
                shelfMesh.receiveShadow = true;
                this.scene.add(shelfMesh);

                // Colunas verticais
                if (level === 0) {
                    const columnGeo = new THREE.BoxGeometry(0.1, 4.8, 0.1);
                    [-1.2, 1.2].forEach(xOffset => {
                        const column = new THREE.Mesh(columnGeo, shelfMat);
                        column.position.set(shelf.position[0] + xOffset, 2.5, shelf.position[2]);
                        column.castShadow = true;
                        this.scene.add(column);
                    });
                }

                // Caixas nas prateleiras (decoração)
                if (Math.random() > 0.5) {
                    const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
                    const boxMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
                    const box = new THREE.Mesh(boxGeo, boxMat);
                    box.position.set(
                        shelf.position[0] + (Math.random() - 0.5) * 1.5,
                        0.5 + level * 1.2 + 0.3,
                        shelf.position[2] + (Math.random() - 0.5) * 0.8
                    );
                    box.castShadow = true;
                    box.receiveShadow = true;
                    this.scene.add(box);
                }
            }
        });
    }

    createToolCabinets() {
        GARAGE_CONFIG.toolCabinets.forEach(cabinet => {
            // Corpo do armário
            const bodyGeo = new THREE.BoxGeometry(1.5, 2, 0.8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cabinet.color });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.set(cabinet.position[0], 1, cabinet.position[2]);
            body.castShadow = true;
            body.receiveShadow = true;
            this.scene.add(body);

            // Gavetas
            for (let i = 0; i < 4; i++) {
                const drawerGeo = new THREE.BoxGeometry(1.3, 0.3, 0.1);
                const drawerMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const drawer = new THREE.Mesh(drawerGeo, drawerMat);
                drawer.position.set(cabinet.position[0], 0.3 + i * 0.4, cabinet.position[2] + 0.35);
                drawer.castShadow = true;
                this.scene.add(drawer);

                // Puxador
                const handleGeo = new THREE.BoxGeometry(0.2, 0.05, 0.05);
                const handleMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.position.set(cabinet.position[0], 0.3 + i * 0.4, cabinet.position[2] + 0.45);
                handle.castShadow = true;
                this.scene.add(handle);
            }
        });
    }

    createMachines() {
        GARAGE_CONFIG.machines.forEach(machine => {
            switch(machine.type) {
                case 'tire-changer':
                    this.createTireChanger(machine.position);
                    break;
                case 'alignment':
                    this.createAlignmentMachine(machine.position);
                    break;
                case 'diagnostic-computer':
                    this.createDiagnosticComputer(machine.position);
                    break;
            }
        });
    }

    createTireChanger(position) {
        const group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Coluna
        const columnGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2);
        const columnMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.position.y = 0.8;
        column.castShadow = true;
        group.add(column);

        // Braço
        const armGeo = new THREE.BoxGeometry(1.0, 0.1, 0.3);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(0.6, 1.2, 0);
        arm.castShadow = true;
        group.add(arm);

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createAlignmentMachine(position) {
        const group = new THREE.Group();
        
        // Ecrã
        const screenGeo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x112233 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.y = 1.2;
        screen.castShadow = true;
        group.add(screen);

        // Suporte
        const standGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.y = 0.6;
        stand.castShadow = true;
        group.add(stand);

        // Base
        const baseGeo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createDiagnosticComputer(position) {
        const group = new THREE.Group();
        
        // Monitor
        const monitorGeo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
        const monitorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.y = 1.2;
        monitor.castShadow = true;
        group.add(monitor);

        // Tela (emissiva)
        const screenGeo = new THREE.BoxGeometry(0.7, 0.5, 0.02);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.2, 0.06);
        group.add(screen);

        // Torre CPU
        const cpuGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        const cpuMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const cpu = new THREE.Mesh(cpuGeo, cpuMat);
        cpu.position.set(-0.5, 0.25, 0);
        cpu.castShadow = true;
        group.add(cpu);

        // Mesa
        const deskGeo = new THREE.BoxGeometry(1.2, 0.1, 0.8);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.y = 0.55;
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        // Pernas da mesa
        for (let i = -0.5; i <= 0.5; i+=1.0) {
            const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(i, 0.25, 0.3);
            leg.castShadow = true;
            group.add(leg);
        }

        group.position.set(position[0], position[1], position[2]);
        this.scene.add(group);
    }

    createDecorations() {
        // Posteres nas paredes
        const posterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        
        const poster1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.1), posterMat);
        poster1.position.set(-8, 2.5, -11);
        this.scene.add(poster1);

        const poster2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.1), posterMat);
        poster2.position.set(8, 2.5, -11);
        this.scene.add(poster2);

        // Relógio
        const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffaa });
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), clockMat);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(-9, 4, -5);
        this.scene.add(clock);

        // Extintores de incêndio
        const extMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        for (let i = -2; i <= 2; i+=4) {
            const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6), extMat);
            ext.position.set(i * 4, 0.3, -11);
            ext.castShadow = true;
            this.scene.add(ext);
        }

        // Pneus empilhados
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        for (let i = 0; i < 3; i++) {
            const tire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 16, 32), tireMat);
            tire.rotation.x = Math.PI / 2;
            tire.position.set(-6, 0.2 + i * 0.3, 8);
            tire.castShadow = true;
            this.scene.add(tire);
        }
    }

    createCar(carData, job) {
        console.log('🚗 Criando carro com modelo 3D realista...');
        
        this.clearAllLabels();
        this.clearHighlight();
        
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
            this.currentCar = null;
        }
        
        // Determinar tipo de carro baseado no modelo
        let carType = 'sedan';
        if (job?.carData?.type) {
            carType = job.carData.type;
        }
        
        // Escolher cor
        let carColor = 0x3366cc;
        if (job?.carData?.type) {
            const typeColors = {
                sports: 0xff3333,
                luxury: 0x000000,
                suv: 0x666666,
                pickup: 0x996633,
                compact: 0x33cc33,
                sedan: 0x3366cc
            };
            carColor = typeColors[job.carData.type] || CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
        }
        
        // Criar carro usando o modelo apropriado
        const carGroup = this.carModels.createCarByType(carType, carColor);
        
        // Posicionar no primeiro elevador disponível
        if (GARAGE_CONFIG.lifts && GARAGE_CONFIG.lifts.length > 0) {
            const activeLift = GARAGE_CONFIG.lifts.find(l => !l.occupied) || GARAGE_CONFIG.lifts[0];
            carGroup.position.set(activeLift.position[0], 0.3, activeLift.position[2]);
            carGroup.rotation.y = activeLift.rotation;
            activeLift.occupied = true;
        } else {
            carGroup.position.set(0, 0.3, 0);
        }
        
        this.currentCar = carGroup;
        this.scene.add(carGroup);
        
        this.updatePartLabels(carData, job);
        
        console.log('✅ Carro criado com sucesso');
        return carGroup;
    }

    updatePartLabels(carData, job) {
        console.log('🏷️ Atualizando labels...');
        
        this.clearAllLabels();

        if (!this.currentCar || !carData || !job) {
            console.log('❌ Sem dados para criar labels');
            return;
        }

        this.partObjects = [];
        this.normalLabels = [];

        Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
            if (carData.parts[partName]) {
                const condition = Math.min(100, Math.round(carData.parts[partName].condition));
                const targetCondition = Math.min(100, Math.round(job.targetConditions[partName]));
                const displayName = PART_TRANSLATIONS[partName].display;
                
                // Determinar cor
                let bgColor = '';
                let borderColor = '#ff6b00';
                let textColor = 'white';
                
                if (condition === 100) {
                    bgColor = '#4CAF50';
                    borderColor = 'gold';
                } else if (condition >= targetCondition) {
                    bgColor = '#00aa00';
                } else if (condition >= targetCondition * 0.7) {
                    bgColor = '#ffaa00';
                    textColor = 'black';
                } else {
                    bgColor = '#ff0000';
                }
                
                // Texto
                let displayText = condition === 100 
                    ? `${displayName}: 100% ✨` 
                    : `${displayName}: ${condition}% / ${targetCondition}%`;
                
                // Label normal
                const normalDiv = document.createElement('div');
                normalDiv.className = 'part-label part-label-normal';
                normalDiv.textContent = displayText;
                normalDiv.style.backgroundColor = bgColor;
                normalDiv.style.color = textColor;
                normalDiv.style.border = `2px solid ${borderColor}`;
                normalDiv.style.padding = '4px 8px';
                normalDiv.style.borderRadius = '12px';
                normalDiv.style.fontSize = '12px';
                normalDiv.style.fontWeight = 'bold';
                normalDiv.style.whiteSpace = 'nowrap';
                normalDiv.style.cursor = 'pointer';
                normalDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
                normalDiv.style.pointerEvents = 'auto';
                
                normalDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectPart(partName);
                });
                
                // Label selecionado
                const selectedDiv = document.createElement('div');
                selectedDiv.className = 'part-label part-label-selected';
                selectedDiv.textContent = displayText;
                selectedDiv.style.backgroundColor = bgColor;
                selectedDiv.style.color = textColor;
                selectedDiv.style.border = `4px solid white`;
                selectedDiv.style.padding = '6px 10px';
                selectedDiv.style.borderRadius = '14px';
                selectedDiv.style.fontSize = '14px';
                selectedDiv.style.fontWeight = 'bold';
                selectedDiv.style.whiteSpace = 'nowrap';
                selectedDiv.style.cursor = 'pointer';
                selectedDiv.style.boxShadow = '0 0 30px currentColor, 0 0 60px currentColor';
                selectedDiv.style.opacity = '0';
                selectedDiv.style.pointerEvents = 'none';
                selectedDiv.style.zIndex = '1000';
                
                try {
                    if (typeof CSS2DObject === 'undefined') {
                        throw new Error('CSS2DObject não está disponível');
                    }
                    
                    const baseY = pos[1] + 0.5;
                    
                    const normalLabel = new CSS2DObject(normalDiv);
                    normalLabel.position.set(pos[0], baseY, pos[2]);
                    normalLabel.userData = { 
                        partName, 
                        type: 'normal',
                        baseY,
                        pos: { x: pos[0], y: baseY, z: pos[2] }
                    };
                    
                    const selectedLabel = new CSS2DObject(selectedDiv);
                    selectedLabel.position.set(pos[0], baseY, pos[2]);
                    selectedLabel.userData = { 
                        partName, 
                        type: 'selected',
                        baseY,
                        pos: { x: pos[0], y: baseY, z: pos[2] }
                    };
                    
                    this.currentCar.add(normalLabel);
                    this.currentCar.add(selectedLabel);
                    
                    this.normalLabels.push({
                        partName,
                        normal: normalLabel,
                        selected: selectedLabel,
                        baseY
                    });
                    
                    // Objeto 3D para highlight
                    const partGeometry = new THREE.SphereGeometry(0.25, 8);
                    const partMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0xffaa00,
                        transparent: true,
                        opacity: 0.0
                    });
                    const partObject = new THREE.Mesh(partGeometry, partMaterial);
                    partObject.position.set(pos[0], baseY, pos[2]);
                    partObject.userData = { partName };
                    
                    this.currentCar.add(partObject);
                    this.partObjects.push(partObject);
                    
                } catch (error) {
                    console.error(`❌ Erro ao criar label para ${partName}:`, error);
                }
            }
        });
        
        // Restaurar seleção se houver
        setTimeout(() => {
            if (gameState?.selectedPart) {
                this.selectPart(gameState.selectedPart);
            }
        }, 100);
    }

    selectPart(partName) {
        if (!gameState || !this.normalLabels) return;
        
        console.log('🎯 Selecionando peça:', partName);
        gameState.selectedPart = partName;
        
        // Resetar todos os labels
        this.normalLabels.forEach(item => {
            if (item.normal && item.normal.element) {
                item.normal.element.style.opacity = '1';
                item.normal.element.style.pointerEvents = 'auto';
                item.normal.element.style.zIndex = 'auto';
            }
            if (item.selected && item.selected.element) {
                item.selected.element.style.opacity = '0';
                item.selected.element.style.pointerEvents = 'none';
                item.selected.element.style.zIndex = 'auto';
            }
        });
        
        // Destacar o selecionado
        const selectedItem = this.normalLabels.find(item => item.partName === partName);
        
        if (selectedItem) {
            if (selectedItem.normal && selectedItem.normal.element) {
                selectedItem.normal.element.style.opacity = '0';
                selectedItem.normal.element.style.pointerEvents = 'none';
            }
            
            if (selectedItem.selected && selectedItem.selected.element) {
                selectedItem.selected.element.style.opacity = '1';
                selectedItem.selected.element.style.pointerEvents = 'auto';
                selectedItem.selected.element.style.zIndex = '1000';
            }
            
            // Reordenar na cena
            if (this.currentCar && selectedItem.selected) {
                const pos = selectedItem.selected.position.clone();
                this.currentCar.remove(selectedItem.selected);
                this.currentCar.add(selectedItem.selected);
                selectedItem.selected.position.copy(pos);
            }
            
            // Destacar objeto 3D
            this.partObjects.forEach(obj => {
                if (obj.userData?.partName === partName) {
                    obj.material.opacity = 0.3;
                    obj.scale.set(1.8, 1.8, 1.8);
                    
                    if (this.currentCar) {
                        const pos = obj.position.clone();
                        this.currentCar.remove(obj);
                        this.currentCar.add(obj);
                        obj.position.copy(pos);
                    }
                } else {
                    obj.material.opacity = 0.0;
                    obj.scale.set(1, 1, 1);
                }
            });
            
            // Criar anel de destaque
            this.createHighlightRing(partName);
        }
        
        // Atualizar UI
        if (gameState.currentCar && gameState.currentJob) {
            const condition = gameState.currentCar.parts[partName]?.condition;
            const target = gameState.currentJob.targetConditions[partName];
            if (condition && target) {
                const info = document.getElementById('interaction-info');
                if (info) {
                    info.textContent = `🔧 ${PART_TRANSLATIONS[partName].display}: ${Math.round(condition)}% / Meta: ${Math.round(target)}%`;
                }
            }
        }
    }

    createHighlightRing(partName) {
        const pos = PART_POSITIONS[partName];
        if (!pos || !this.currentCar) return;
        
        this.clearHighlight();
        
        const ringGeometry = new THREE.TorusGeometry(0.4, 0.03, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00,
            emissive: 0x442200,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        ring.position.set(pos[0], pos[1] + 0.7, pos[2]);
        ring.rotation.x = Math.PI / 2;
        
        this.currentCar.add(ring);
        this.highlightRing = ring;
        
        this.animateRing(ring);
    }

    animateRing(ring) {
        if (!ring) return;
        
        let time = 0;
        const animate = () => {
            if (!ring.parent || !this.highlightRing) return;
            
            time += 0.05;
            ring.scale.setScalar(1 + Math.sin(time) * 0.1);
            ring.material.opacity = 0.4 + Math.sin(time) * 0.2;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    clearHighlight() {
        if (this.highlightRing && this.currentCar) {
            this.currentCar.remove(this.highlightRing);
            this.highlightRing = null;
        }
    }

    clearAllLabels() {
        if (this.normalLabels) {
            this.normalLabels.forEach(item => {
                if (item.normal && item.normal.parent) {
                    item.normal.parent.remove(item.normal);
                }
                if (item.selected && item.selected.parent) {
                    item.selected.parent.remove(item.selected);
                }
            });
            this.normalLabels = [];
        }
        
        if (this.partObjects) {
            this.partObjects.forEach(obj => {
                if (obj.parent) {
                    obj.parent.remove(obj);
                }
            });
            this.partObjects = [];
        }
        
        this.clearHighlight();
    }

    onMouseClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (!this.currentCar) return;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObject(this.currentCar, true);
        
        if (intersects.length > 0) {
            const clickPoint = intersects[0].point;
            
            let closestPart = null;
            let minDistance = 0.8;
            
            Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
                const partPos = new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]);
                const distance = clickPoint.distanceTo(partPos);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPart = partName;
                }
            });
            
            if (closestPart) {
                this.selectPart(closestPart);
                this.createClickEffect(clickPoint);
            }
        }
    }

    createClickEffect(position) {
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 4);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0x442200
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.2;
            particle.position.y += (Math.random() - 0.5) * 0.2;
            particle.position.z += (Math.random() - 0.5) * 0.2;
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05,
                    Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.05
                ),
                life: 0.5
            };
            
            this.scene.add(particle);
            
            const animate = () => {
                particle.userData.life -= 0.02;
                
                if (particle.userData.life > 0) {
                    particle.position.x += particle.userData.velocity.x;
                    particle.position.y += particle.userData.velocity.y;
                    particle.position.z += particle.userData.velocity.z;
                    particle.scale.setScalar(particle.userData.life);
                    
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(particle);
                }
            };
            
            animate();
        }
    }

    createRepairEffect(position) {
        if (!position) return;
        
        const particleCount = 15;
        const particles = [];
        const colors = [0xffaa00, 0xff6b00, 0xff4400];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4);
            const material = new THREE.MeshStandardMaterial({ 
                color: colors[Math.floor(Math.random() * colors.length)],
                emissive: 0x331100
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.3;
            particle.position.y += (Math.random() - 0.5) * 0.3;
            particle.position.z += (Math.random() - 0.5) * 0.3;
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.08,
                    Math.random() * 0.1,
                    (Math.random() - 0.5) * 0.08
                ),
                life: 0.8 + Math.random() * 0.4
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        const animateParticles = () => {
            let alive = false;
            
            particles.forEach(particle => {
                particle.userData.life -= 0.015;
                
                if (particle.userData.life > 0) {
                    alive = true;
                    
                    particle.position.x += particle.userData.velocity.x;
                    particle.position.y += particle.userData.velocity.y;
                    particle.position.z += particle.userData.velocity.z;
                    
                    particle.userData.velocity.x *= 0.98;
                    particle.userData.velocity.y *= 0.98;
                    particle.userData.velocity.z *= 0.98;
                    
                    particle.scale.setScalar(particle.userData.life);
                    
                    if (particle.material) {
                        particle.material.opacity = particle.userData.life;
                        particle.material.transparent = true;
                    }
                } else {
                    if (particle.parent) {
                        this.scene.remove(particle);
                    }
                }
            });
            
            if (alive) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }

    updateGarageAppearance(appearance) {
        console.log('🏢 Atualizando aparência da garagem:', appearance);
        // Implementar mudanças visuais baseadas no nível da garagem
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }
}