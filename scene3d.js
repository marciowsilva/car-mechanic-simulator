// scene3d.js - VERSÃO ATUALIZADA COM GARAGEM REALISTA

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
        
        this.setupLights();
        this.setupEnvironment();
        this.createRealisticGarage();
        
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

        // Luzes de parede
        GARAGE_CONFIG.lights.wall.forEach(lightConfig => {
            const light = new THREE.PointLight(0x88aaff, lightConfig.intensity);
            light.position.set(lightConfig.position[0], lightConfig.position[1], lightConfig.position[2]);
            this.scene.add(light);
        });
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
            mark.position.set(Math.random() * 10 - 5, 0.01, Math.random() * 10 - 5);
            mark.rotation.z = Math.random() * Math.PI;
            this.scene.add(mark);
        }

        // Linhas de demarcação no chão
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff6b00 });
        
        // Vagas de estacionamento
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

    createRealisticGarage() {
        // Paredes
        this.createWalls();
        
        // Pilares de sustentação
        this.createPillars();
        
        // Portas e janelas
        this.createDoors();
        
        // Elevadores
        this.createLifts();
        
        // Bancadas de trabalho
        this.createWorkbenches();
        
        // Prateleiras
        this.createShelves();
        
        // Armários de ferramentas
        this.createToolCabinets();
        
        // Máquinas especiais
        this.createMachines();
        
        // Decoração
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
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
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
        
        // Posicionar no elevador ativo
        const activeLift = GARAGE_CONFIG.lifts.find(l => !l.occupied) || GARAGE_CONFIG.lifts[0];
        carGroup.position.set(activeLift.position[0], 0.3, activeLift.position[2]);
        carGroup.rotation.y = activeLift.rotation;
        
        activeLift.occupied = true;
        
        this.currentCar = carGroup;
        this.scene.add(carGroup);
        
        this.updatePartLabels(carData, job);
        
        return carGroup;
    }

    // ... manter os outros métodos (updatePartLabels, selectPart, etc)
}