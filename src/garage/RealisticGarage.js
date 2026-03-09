// src/garage/RealisticGarage.js - Garagem fotorrealista

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GarageConfig } from './GarageConfig.js';

export class RealisticGarage {
    constructor(container) {
        
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        this.scene.fog = new THREE.Fog(0x111122, 20, 50);
        
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        this.createEnvironment();
        this.createGarageStructure();
        this.createFurniture();
        this.createMachines();
        this.createDecorations();
        
        this.currentCar = null;
        this.particles = [];
        
        this.animate();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 5, 18);
        this.camera.lookAt(0, 1, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.bias = 0.0001;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        this.controls.target.set(0, 1, 0);
        this.controls.rotateSpeed = 0.8;
    }

    setupLights() {
        const cfg = GarageConfig.lighting;
        
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(cfg.ambient.color, cfg.ambient.intensity);
        this.scene.add(ambientLight);

        // Luz principal com sombras
        const mainLight = new THREE.DirectionalLight(cfg.main.color, cfg.main.intensity);
        mainLight.position.set(cfg.main.position[0], cfg.main.position[1], cfg.main.position[2]);
        mainLight.castShadow = true;
        mainLight.receiveShadow = true;
        mainLight.shadow.mapSize.width = cfg.main.shadowSize;
        mainLight.shadow.mapSize.height = cfg.main.shadowSize;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 40;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        // Luzes de teto
        cfg.ceiling.forEach(lightCfg => {
            const light = new THREE.PointLight(lightCfg.color, lightCfg.intensity);
            light.position.set(lightCfg.position[0], lightCfg.position[1], lightCfg.position[2]);
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            this.scene.add(light);

            // Bulbo visível
            const bulbMat = new THREE.MeshStandardMaterial({ 
                color: lightCfg.color, 
                emissive: 0x442200,
                emissiveIntensity: 0.5
            });
            const bulbGeo = new THREE.SphereGeometry(0.15, 16);
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.copy(light.position);
            this.scene.add(bulb);
        });

        // Luzes de parede
        cfg.wall.forEach(lightCfg => {
            const light = new THREE.PointLight(lightCfg.color, lightCfg.intensity);
            light.position.set(lightCfg.position[0], lightCfg.position[1], lightCfg.position[2]);
            this.scene.add(light);
        });

        // Luzes de trabalho nas bancadas
        cfg.workLights.forEach(lightCfg => {
            const light = new THREE.SpotLight(lightCfg.color, lightCfg.intensity);
            light.position.set(lightCfg.position[0], lightCfg.position[1], lightCfg.position[2]);
            light.angle = 0.5;
            light.penumbra = 0.3;
            light.decay = 1;
            light.distance = 10;
            light.castShadow = true;
            this.scene.add(light);
        });
    }

    createEnvironment() {
        const cfg = GarageConfig.materials;
        const dims = GarageConfig.dimensions;
        
        // Chão com textura procedural de concreto
        const floorGeo = new THREE.CircleGeometry(40, 64);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: cfg.floor.color,
            roughness: cfg.floor.roughness,
            metalness: cfg.floor.metalness,
            emissive: cfg.floor.emissive
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Manchas de óleo e marcas de pneu
        for (let i = 0; i < 15; i++) {
            const stainGeo = new THREE.CircleGeometry(0.5 + Math.random() * 1, 8);
            const stainMat = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a1a,
                transparent: true,
                opacity: 0.2 + Math.random() * 0.2
            });
            const stain = new THREE.Mesh(stainGeo, stainMat);
            stain.rotation.x = -Math.PI / 2;
            stain.position.set(
                (Math.random() - 0.5) * 30,
                0.01,
                (Math.random() - 0.5) * 30
            );
            stain.receiveShadow = true;
            this.scene.add(stain);
        }

        // Linhas de demarcação
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff6b00 });
        
        // Vagas dos elevadores
        GarageConfig.lifts.forEach(lift => {
            const points = [
                new THREE.Vector3(lift.position[0] - lift.width/2, 0.02, lift.position[2] - lift.length/2),
                new THREE.Vector3(lift.position[0] - lift.width/2, 0.02, lift.position[2] + lift.length/2),
                new THREE.Vector3(lift.position[0] + lift.width/2, 0.02, lift.position[2] + lift.length/2),
                new THREE.Vector3(lift.position[0] + lift.width/2, 0.02, lift.position[2] - lift.length/2),
                new THREE.Vector3(lift.position[0] - lift.width/2, 0.02, lift.position[2] - lift.length/2)
            ];
            
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeo, lineMat);
            this.scene.add(line);
        });
    }

    createGarageStructure() {
        const cfg = GarageConfig.materials;
        const dims = GarageConfig.dimensions;
        const halfW = dims.width / 2;
        const halfL = dims.length / 2;

        // Paredes
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: cfg.walls.color,
            roughness: cfg.walls.roughness,
            metalness: cfg.walls.metalness
        });

        // Parede dos fundos
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(dims.width, dims.height, dims.wallThickness), 
            wallMat
        );
        backWall.position.set(0, dims.height/2, -halfL);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);

        // Paredes laterais
        const sideWallGeo = new THREE.BoxGeometry(dims.wallThickness, dims.height, dims.length);
        
        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(-halfW, dims.height/2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
        rightWall.position.set(halfW, dims.height/2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);

        // Pilares
        const pillarMat = new THREE.MeshStandardMaterial({ 
            color: cfg.pillars.color,
            roughness: cfg.pillars.roughness,
            metalness: cfg.pillars.metalness
        });
        const pillarGeo = new THREE.BoxGeometry(0.8, dims.height, 0.8);
        
        const pillarPositions = [
            [-halfW + 2, dims.height/2, -halfL + 2],
            [halfW - 2, dims.height/2, -halfL + 2],
            [-halfW + 2, dims.height/2, halfL - 2],
            [halfW - 2, dims.height/2, halfL - 2]
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], pos[1], pos[2]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });

        // Portas de entrada
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
        const doorGeo = new THREE.BoxGeometry(4, 4, 0.2);
        
        for (let i = -3; i <= 3; i+= 6) {
            const door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(i, 2, halfL + 0.1);
            door.castShadow = true;
            door.receiveShadow = true;
            this.scene.add(door);
        }

        // Teto com vigas
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        for (let i = -halfW + 2; i < halfW; i += 3) {
            const beamGeo = new THREE.BoxGeometry(0.3, 0.3, dims.length - 2);
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(i, dims.height - 0.2, 0);
            beam.castShadow = true;
            beam.receiveShadow = true;
            this.scene.add(beam);
        }
    }

    createFurniture() {
        const cfg = GarageConfig.materials;
        
        // Elevadores
        GarageConfig.lifts.forEach(lift => {
            const liftGroup = new THREE.Group();
            
            // Base
            const baseGeo = new THREE.BoxGeometry(lift.width, 0.2, lift.length);
            const baseMat = new THREE.MeshStandardMaterial({ 
                color: cfg.lifts.primary,
                metalness: cfg.lifts.metalness,
                roughness: cfg.lifts.roughness
            });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.1;
            base.receiveShadow = true;
            base.castShadow = true;
            liftGroup.add(base);

            // Colunas
            const columnGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
            const columnMat = new THREE.MeshStandardMaterial({ 
                color: cfg.lifts.primary,
                metalness: cfg.lifts.metalness
            });
            
            const colPositions = [
                [-lift.width/2 + 0.3, 1.5, -lift.length/2 + 0.3],
                [lift.width/2 - 0.3, 1.5, -lift.length/2 + 0.3],
                [-lift.width/2 + 0.3, 1.5, lift.length/2 - 0.3],
                [lift.width/2 - 0.3, 1.5, lift.length/2 - 0.3]
            ];
            
            colPositions.forEach(pos => {
                const column = new THREE.Mesh(columnGeo, columnMat);
                column.position.set(pos[0], pos[1], pos[2]);
                column.castShadow = true;
                column.receiveShadow = true;
                liftGroup.add(column);
            });

            // Braços do elevador
            const armGeo = new THREE.BoxGeometry(lift.width - 0.6, 0.1, 0.3);
            const armMat = new THREE.MeshStandardMaterial({ color: cfg.lifts.secondary });
            
            const armPositions = [
                [0, 0.5, -lift.length/4],
                [0, 0.5, lift.length/4]
            ];
            
            armPositions.forEach(pos => {
                const arm = new THREE.Mesh(armGeo, armMat);
                arm.position.set(pos[0], pos[1], pos[2]);
                arm.castShadow = true;
                liftGroup.add(arm);
            });

            liftGroup.position.set(lift.position[0], lift.position[1], lift.position[2]);
            this.scene.add(liftGroup);
        });

        // Bancadas de trabalho
        GarageConfig.workbenches.forEach(bench => {
            const benchGroup = new THREE.Group();
            
            // Base
            const baseGeo = new THREE.BoxGeometry(2.5, 0.8, 1.2);
            const baseMat = new THREE.MeshStandardMaterial({ color: cfg.workbenches.wood });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.4;
            base.castShadow = true;
            base.receiveShadow = true;
            benchGroup.add(base);

            // Tampo
            const topGeo = new THREE.BoxGeometry(2.7, 0.1, 1.4);
            const topMat = new THREE.MeshStandardMaterial({ color: cfg.workbenches.top });
            const top = new THREE.Mesh(topGeo, topMat);
            top.position.y = 0.85;
            top.castShadow = true;
            top.receiveShadow = true;
            benchGroup.add(top);

            // Gavetas
            for (let i = 0; i < 3; i++) {
                const drawerGeo = new THREE.BoxGeometry(2.3, 0.2, 1.0);
                const drawerMat = new THREE.MeshStandardMaterial({ color: cfg.workbenches.metal });
                const drawer = new THREE.Mesh(drawerGeo, drawerMat);
                drawer.position.set(0, 0.2 + i * 0.2, 0);
                drawer.castShadow = true;
                benchGroup.add(drawer);
            }

            benchGroup.position.set(bench.position[0], bench.position[1], bench.position[2]);
            benchGroup.rotation.y = bench.rotation;
            this.scene.add(benchGroup);
        });

        // Prateleiras
        GarageConfig.shelves.forEach(shelf => {
            const shelfMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            
            for (let level = 0; level < 4; level++) {
                const shelfGeo = new THREE.BoxGeometry(2.8, 0.1, 1.2);
                const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
                shelfMesh.position.set(shelf.position[0], 0.5 + level * 1.2, shelf.position[2]);
                shelfMesh.castShadow = true;
                shelfMesh.receiveShadow = true;
                this.scene.add(shelfMesh);

                // Caixas nas prateleiras
                if (Math.random() > 0.3) {
                    const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
                    const boxMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
                    const box = new THREE.Mesh(boxGeo, boxMat);
                    box.position.set(
                        shelf.position[0] + (Math.random() - 0.5) * 1.8,
                        0.5 + level * 1.2 + 0.3,
                        shelf.position[2] + (Math.random() - 0.5) * 0.8
                    );
                    box.castShadow = true;
                    box.receiveShadow = true;
                    this.scene.add(box);
                }
            }
        });

        // Armários de ferramentas
        GarageConfig.toolCabinets.forEach(cabinet => {
            const cabinetMat = new THREE.MeshStandardMaterial({ color: cabinet.color });
            
            // Corpo
            const bodyGeo = new THREE.BoxGeometry(1.5, 2.0, 0.8);
            const body = new THREE.Mesh(bodyGeo, cabinetMat);
            body.position.set(cabinet.position[0], 1.0, cabinet.position[2]);
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
        // Máquina de trocar pneus
        const tireChanger = new THREE.Group();
        
        const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        tireChanger.add(base);

        const columnGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
        const columnMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.position.set(0.4, 1.0, 0);
        column.castShadow = true;
        tireChanger.add(column);

        const armGeo = new THREE.BoxGeometry(1.2, 0.1, 0.2);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00, metalness: 0.5 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(1.0, 1.2, 0);
        arm.castShadow = true;
        tireChanger.add(arm);

        const machinePos = GarageConfig.machines.find(m => m.type === 'tire-changer').position;
        tireChanger.position.set(machinePos[0], machinePos[1], machinePos[2]);
        this.scene.add(tireChanger);

        // Computador de diagnóstico
        const computer = new THREE.Group();
        
        const deskGeo = new THREE.BoxGeometry(1.2, 0.1, 0.8);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.y = 0.55;
        desk.castShadow = true;
        desk.receiveShadow = true;
        computer.add(desk);

        const monitorGeo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
        const monitorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.set(0, 1.2, 0);
        monitor.castShadow = true;
        computer.add(monitor);

        const screenGeo = new THREE.BoxGeometry(0.7, 0.5, 0.02);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.2, 0.06);
        computer.add(screen);

        const computerPos = GarageConfig.machines.find(m => m.type === 'diagnostic-computer').position;
        computer.position.set(computerPos[0], computerPos[1], computerPos[2]);
        this.scene.add(computer);
    }

    createDecorations() {
        // Posteres
        GarageConfig.decorations.posters.forEach(poster => {
            const posterMat = new THREE.MeshStandardMaterial({ 
                color: 0xffaa00,
                emissive: 0x221100
            });
            const posterGeo = new THREE.BoxGeometry(poster.scale[0], poster.scale[1], poster.scale[2]);
            const posterMesh = new THREE.Mesh(posterGeo, posterMat);
            posterMesh.position.set(poster.position[0], poster.position[1], poster.position[2]);
            posterMesh.rotation.y = poster.rotation;
            this.scene.add(posterMesh);
        });

        // Pneus empilhados
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        GarageConfig.decorations.tires.forEach(tire => {
            for (let i = 0; i < tire.count; i++) {
                const tireGeo = new THREE.TorusGeometry(0.4, 0.1, 16, 32);
                const tireMesh = new THREE.Mesh(tireGeo, tireMat);
                tireMesh.rotation.x = Math.PI / 2;
                tireMesh.position.set(
                    tire.position[0] + (Math.random() - 0.5) * 0.5,
                    tire.position[1] + i * 0.3,
                    tire.position[2] + (Math.random() - 0.5) * 0.5
                );
                tireMesh.castShadow = true;
                tireMesh.receiveShadow = true;
                this.scene.add(tireMesh);
            }
        });

        // Extintores
        const extMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const extPositions = [[-10, 0.3, -13], [10, 0.3, -13], [-10, 0.3, 13], [10, 0.3, 13]];
        extPositions.forEach(pos => {
            const extGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
            const ext = new THREE.Mesh(extGeo, extMat);
            ext.position.set(pos[0], pos[1], pos[2]);
            ext.castShadow = true;
            this.scene.add(ext);
        });
    }

    createCar(carData, job) {
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
        }

        // Criar um carro simples por enquanto
        const carGroup = new THREE.Group();
        
        // Carroceria
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.6, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.3, metalness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);
        
        // Cabine
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 1.5);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.1, -0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        carGroup.add(cabin);
        
        // Rodas
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const positions = [
            [-1.0, 0.3, 1.2], [1.0, 0.3, 1.2],
            [-1.0, 0.3, -1.4], [1.0, 0.3, -1.4]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);
        });

        // Posicionar no primeiro elevador disponível
        const firstLift = GarageConfig.lifts[0];
        carGroup.position.set(firstLift.position[0], 0.3, firstLift.position[2]);
        
        this.currentCar = carGroup;
        this.scene.add(carGroup);
        
        return carGroup;
    }

    createRepairEffect(position) {
        const colors = [0xffaa00, 0xff6b00, 0xff4400];
        
        for (let i = 0; i < 12; i++) {
            const geometry = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4);
            const material = new THREE.MeshStandardMaterial({ 
                color: colors[Math.floor(Math.random() * colors.length)],
                emissive: 0x331100
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03,
                    Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.03
                ),
                life: 1.0
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.userData.life -= 0.01;
            
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            } else {
                p.position.x += p.userData.velocity.x;
                p.position.y += p.userData.velocity.y;
                p.position.z += p.userData.velocity.z;
                p.scale.setScalar(p.userData.life);
                p.material.opacity = p.userData.life;
                p.material.transparent = true;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateParticles();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.RealisticGarage = RealisticGarage;
}