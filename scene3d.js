// scene3d.js - VERSÃO OTIMIZADA PARA PERFORMANCE

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
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.bias = 0.0001;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar pixel ratio
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
        this.controls.rotateSpeed = 0.8; // Reduzir velocidade para suavizar
        
        this.carModels = new CarModels();
        this.currentCar = null;
        this.partLabels = [];
        this.partObjects = [];
        this.normalLabels = [];
        this.highlightRing = null;
        
        // Cache de geometrias para reutilização
        this.geometryCache = {};
        this.materialCache = {};
        
        // Controle de animações
        this.animations = [];
        this.lastTime = performance.now();
        this.frameCount = 0;
        
        this.setupLights();
        this.setupEnvironment();
        this.createRealisticGarage();
        
        // Raycaster para detecção de clique
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        console.log('✅ Scene3D inicializada');
    }

    // ===== MÉTODOS DE OTIMIZAÇÃO =====

    getCachedGeometry(type, params) {
        const key = type + JSON.stringify(params);
        if (!this.geometryCache[key]) {
            switch(type) {
                case 'box':
                    this.geometryCache[key] = new THREE.BoxGeometry(...params);
                    break;
                case 'sphere':
                    this.geometryCache[key] = new THREE.SphereGeometry(...params);
                    break;
                case 'cylinder':
                    this.geometryCache[key] = new THREE.CylinderGeometry(...params);
                    break;
                case 'torus':
                    this.geometryCache[key] = new THREE.TorusGeometry(...params);
                    break;
            }
        }
        return this.geometryCache[key];
    }

    getCachedMaterial(type, color, options = {}) {
        const key = type + color.toString(16) + JSON.stringify(options);
        if (!this.materialCache[key]) {
            switch(type) {
                case 'standard':
                    this.materialCache[key] = new THREE.MeshStandardMaterial({ color, ...options });
                    break;
                case 'basic':
                    this.materialCache[key] = new THREE.MeshBasicMaterial({ color, ...options });
                    break;
            }
        }
        return this.materialCache[key];
    }

    // ===== MÉTODOS DE ILUMINAÇÃO OTIMIZADOS =====

    setupLights() {
        // Luz ambiente (uma única)
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        // Luz principal (uma única directional)
        const mainLight = new THREE.DirectionalLight(0xffeedd, 1);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.receiveShadow = true;
        mainLight.shadow.mapSize.width = 1024; // Reduzido de 2048 para 1024
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        // Agrupar luzes de teto em um único objeto se possível
        const ceilingLights = new THREE.Group();
        if (GARAGE_CONFIG.lights && GARAGE_CONFIG.lights.ceiling) {
            GARAGE_CONFIG.lights.ceiling.forEach(lightConfig => {
                const light = new THREE.PointLight(0xffeedd, lightConfig.intensity * 0.8); // Reduzir intensidade
                light.position.set(lightConfig.position[0], lightConfig.position[1], lightConfig.position[2]);
                light.castShadow = false; // Desabilitar sombras para luzes secundárias
                ceilingLights.add(light);
            });
        }
        this.scene.add(ceilingLights);
    }

    // ===== MÉTODOS DE CRIAÇÃO DE AMBIENTE =====

    setupEnvironment() {
        // Chão de concreto (uma única geometria)
        const floorGeo = this.getCachedGeometry('box', [30, 0.1, 30]);
        const floorMat = this.getCachedMaterial('standard', 0x2a2a2a, { roughness: 0.8, metalness: 0.1 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, -0.05, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Marcas de pneu (instanciadas para performance)
        const markGeo = this.getCachedGeometry('plane', [0.5, 1]);
        const markMat = this.getCachedMaterial('standard', 0x1a1a1a, { transparent: true, opacity: 0.3 });
        
        for (let i = 0; i < 5; i++) { // Reduzido de 10 para 5
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.rotation.x = -Math.PI / 2;
            mark.position.set((Math.random() * 20) - 10, 0.01, (Math.random() * 20) - 10);
            mark.rotation.z = Math.random() * Math.PI;
            this.scene.add(mark);
        }
    }

    // ===== MÉTODOS DE CRIAÇÃO DA GARAGEM (SIMPLIFICADOS) =====

    createRealisticGarage() {
        // Criar grupos para melhor organização
        this.walls = new THREE.Group();
        this.furniture = new THREE.Group();
        this.decor = new THREE.Group();
        
        this.createWalls();
        this.createPillars();
        this.createDoors();
        this.createLifts();
        this.createWorkbenches();
        this.createShelves();
        this.createToolCabinets();
        this.createMachines();
        this.createDecorations();
        
        this.scene.add(this.walls);
        this.scene.add(this.furniture);
        this.scene.add(this.decor);
    }

    createWalls() {
        const wallMat = this.getCachedMaterial('standard', 0x3a3a3a, { roughness: 0.7 });
        const windowMat = this.getCachedMaterial('standard', 0x88aaff, { emissive: 0x112233 });
        
        const { width, length, height } = GARAGE_CONFIG.dimensions;
        const halfW = width / 2;
        const halfL = length / 2;

        // Usar instâncias para paredes similares
        const wallGeo = this.getCachedGeometry('box', [width, height, 0.3]);
        
        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, height/2, -halfL);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.walls.add(backWall);

        // Paredes laterais
        const sideWallGeo = this.getCachedGeometry('box', [0.3, height, length]);
        
        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(-halfW, height/2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.walls.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
        rightWall.position.set(halfW, height/2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.walls.add(rightWall);
    }

    createPillars() {
        const pillarMat = this.getCachedMaterial('standard', 0x555555);
        const pillarGeo = this.getCachedGeometry('cylinder', [0.5, 0.5, 8, 8]);
        
        const positions = [
            [-8, 4, -10], [8, 4, -10],
            [-8, 4, 10], [8, 4, 10]
        ];

        positions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], pos[1], pos[2]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.walls.add(pillar);
        });
    }

    createDoors() {
        const doorMat = this.getCachedMaterial('standard', 0x888888);
        const doorGeo = this.getCachedGeometry('box', [4, 4, 0.2]);
        
        for (let i = -3; i <= 3; i+= 6) {
            const door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(i, 2, 12.5);
            door.castShadow = true;
            door.receiveShadow = true;
            this.walls.add(door);
        }
    }

    createLifts() {
        const liftMat = this.getCachedMaterial('standard', 0xcccccc);
        const armMat = this.getCachedMaterial('standard', 0xff6b00);
        
        const baseGeo = this.getCachedGeometry('box', [2.5, 0.2, 4.5]);
        const columnGeo = this.getCachedGeometry('box', [0.3, 3, 0.3]);
        const armGeo = this.getCachedGeometry('box', [2.0, 0.1, 0.3]);

        GARAGE_CONFIG.lifts.forEach(lift => {
            const base = new THREE.Mesh(baseGeo, liftMat);
            base.position.set(lift.position[0], 0.1, lift.position[2]);
            base.receiveShadow = true;
            base.castShadow = true;
            this.furniture.add(base);

            [-1.2, 1.2].forEach(xOffset => {
                const column = new THREE.Mesh(columnGeo, liftMat);
                column.position.set(lift.position[0] + xOffset, 1.5, lift.position[2] - 1.8);
                column.castShadow = true;
                column.receiveShadow = true;
                this.furniture.add(column);
            });

            const arm = new THREE.Mesh(armGeo, armMat);
            arm.position.set(lift.position[0], 0.5, lift.position[2]);
            arm.castShadow = true;
            this.furniture.add(arm);
        });
    }

    createWorkbenches() {
        const benchMat = this.getCachedMaterial('standard', 0x8B4513);
        const topMat = this.getCachedMaterial('standard', 0x2a2a2a);
        const drawerMat = this.getCachedMaterial('standard', 0x666666);
        
        const baseGeo = this.getCachedGeometry('box', [2, 0.8, 1]);
        const topGeo = this.getCachedGeometry('box', [2.2, 0.1, 1.1]);
        const drawerGeo = this.getCachedGeometry('box', [1.8, 0.15, 0.8]);

        GARAGE_CONFIG.workbenches.forEach(bench => {
            const base = new THREE.Mesh(baseGeo, benchMat);
            base.position.set(bench.position[0], 0.4, bench.position[2]);
            base.castShadow = true;
            base.receiveShadow = true;
            this.furniture.add(base);

            const top = new THREE.Mesh(topGeo, topMat);
            top.position.set(bench.position[0], 0.85, bench.position[2]);
            top.castShadow = true;
            top.receiveShadow = true;
            this.furniture.add(top);

            for (let i = 0; i < 2; i++) { // Reduzido de 3 para 2 gavetas
                const drawer = new THREE.Mesh(drawerGeo, drawerMat);
                drawer.position.set(bench.position[0], 0.2 + i * 0.2, bench.position[2]);
                drawer.castShadow = true;
                this.furniture.add(drawer);
            }
        });
    }

    createShelves() {
        const shelfMat = this.getCachedMaterial('standard', 0x666666);
        const shelfGeo = this.getCachedGeometry('box', [2.5, 0.1, 1.5]);

        GARAGE_CONFIG.shelves.forEach(shelf => {
            for (let level = 0; level < 3; level++) { // Reduzido de 4 para 3 níveis
                const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
                shelfMesh.position.set(shelf.position[0], 0.5 + level * 1.2, shelf.position[2]);
                shelfMesh.castShadow = true;
                shelfMesh.receiveShadow = true;
                this.furniture.add(shelfMesh);
            }
        });
    }

    createToolCabinets() {
        const bodyGeo = this.getCachedGeometry('box', [1.5, 2, 0.8]);
        const drawerGeo = this.getCachedGeometry('box', [1.3, 0.3, 0.1]);

        GARAGE_CONFIG.toolCabinets.forEach(cabinet => {
            const bodyMat = this.getCachedMaterial('standard', cabinet.color);
            const drawerMat = this.getCachedMaterial('standard', 0x888888);
            
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.set(cabinet.position[0], 1, cabinet.position[2]);
            body.castShadow = true;
            body.receiveShadow = true;
            this.furniture.add(body);

            for (let i = 0; i < 3; i++) { // Reduzido de 4 para 3 gavetas
                const drawer = new THREE.Mesh(drawerGeo, drawerMat);
                drawer.position.set(cabinet.position[0], 0.3 + i * 0.4, cabinet.position[2] + 0.35);
                drawer.castShadow = true;
                this.furniture.add(drawer);
            }
        });
    }

    createMachines() {
        // Versão simplificada das máquinas
        GARAGE_CONFIG.machines.forEach(machine => {
            const machineMat = this.getCachedMaterial('standard', 0x444444);
            const machineGeo = this.getCachedGeometry('box', [1, 1, 1]);
            
            const machineMesh = new THREE.Mesh(machineGeo, machineMat);
            machineMesh.position.set(machine.position[0], machine.position[1] + 0.5, machine.position[2]);
            machineMesh.castShadow = true;
            machineMesh.receiveShadow = true;
            this.furniture.add(machineMesh);
        });
    }

    createDecorations() {
        const posterMat = this.getCachedMaterial('standard', 0xffaa00);
        const posterGeo = this.getCachedGeometry('box', [1.5, 1, 0.1]);
        
        const poster1 = new THREE.Mesh(posterGeo, posterMat);
        poster1.position.set(-8, 2.5, -11);
        this.decor.add(poster1);

        const poster2 = new THREE.Mesh(posterGeo, posterMat);
        poster2.position.set(8, 2.5, -11);
        this.decor.add(poster2);
    }

    // ===== MÉTODOS DO CARRO OTIMIZADOS =====

    createCar(carData, job) {
        console.log('🚗 Criando carro com modelo 3D realista...');
        
        this.clearAllLabels();
        this.clearHighlight();
        
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
            this.currentCar = null;
        }
        
        let carType = 'sedan';
        if (job?.carData?.type) {
            carType = job.carData.type;
        }
        
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
        
        const carGroup = this.carModels.createCarByType(carType, carColor);
        
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
        if (!this.currentCar || !carData || !job) return;

        this.clearAllLabels();

        this.partObjects = [];
        this.normalLabels = [];

        Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
            if (carData.parts[partName]) {
                const condition = Math.min(100, Math.round(carData.parts[partName].condition));
                const targetCondition = Math.min(100, Math.round(job.targetConditions[partName]));
                const displayName = PART_TRANSLATIONS[partName].display;
                
                let bgColor = condition === 100 ? '#4CAF50' : 
                             condition >= targetCondition ? '#00aa00' :
                             condition >= targetCondition * 0.7 ? '#ffaa00' : '#ff0000';
                
                let displayText = condition === 100 
                    ? `${displayName}: 100% ✨` 
                    : `${displayName}: ${condition}% / ${targetCondition}%`;
                
                const normalDiv = document.createElement('div');
                normalDiv.className = 'part-label';
                normalDiv.textContent = displayText;
                normalDiv.style.backgroundColor = bgColor;
                normalDiv.style.color = condition >= targetCondition * 0.7 && condition < targetCondition ? 'black' : 'white';
                normalDiv.style.border = condition === 100 ? '3px solid gold' : '2px solid #ff6b00';
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
                
                try {
                    const baseY = pos[1] + 0.5;
                    const normalLabel = new CSS2DObject(normalDiv);
                    normalLabel.position.set(pos[0], baseY, pos[2]);
                    normalLabel.userData = { partName, baseY };
                    
                    this.currentCar.add(normalLabel);
                    this.normalLabels.push(normalLabel);
                    
                } catch (error) {
                    console.error(`❌ Erro ao criar label para ${partName}:`, error);
                }
            }
        });
        
        setTimeout(() => {
            if (gameState?.selectedPart) {
                this.selectPart(gameState.selectedPart);
            }
        }, 100);
    }

    selectPart(partName) {
        if (!gameState || !this.normalLabels) return;
        
        gameState.selectedPart = partName;
        
        this.normalLabels.forEach(label => {
            label.element.classList.remove('selected');
            if (label.element.textContent.includes(PART_TRANSLATIONS[partName].display)) {
                label.element.classList.add('selected');
            }
        });
        
        this.createHighlightRing(partName);
        
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
        
        const ringGeo = this.getCachedGeometry('torus', [0.4, 0.03, 16, 32]);
        const ringMat = this.getCachedMaterial('standard', 0xffaa00, { 
            emissive: 0x442200,
            transparent: true,
            opacity: 0.6
        });
        
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pos[0], pos[1] + 0.7, pos[2]);
        ring.rotation.x = Math.PI / 2;
        
        this.currentCar.add(ring);
        this.highlightRing = ring;
    }

    clearHighlight() {
        if (this.highlightRing && this.currentCar) {
            this.currentCar.remove(this.highlightRing);
            this.highlightRing = null;
        }
    }

    clearAllLabels() {
        if (this.normalLabels) {
            this.normalLabels.forEach(label => {
                if (label.parent) label.parent.remove(label);
            });
            this.normalLabels = [];
        }
        
        if (this.partObjects) {
            this.partObjects.forEach(obj => {
                if (obj.parent) obj.parent.remove(obj);
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
            }
        }
    }

    createRepairEffect(position) {
        if (!position) return;
        
        const particleCount = 8; // Reduzido de 15 para 8
        const particles = [];
        const color = 0xffaa00;
        
        const particleGeo = this.getCachedGeometry('sphere', [0.03, 4]);
        const particleMat = this.getCachedMaterial('standard', color, { emissive: 0x331100 });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeo, particleMat);
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
                life: 0.5
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        const animateParticles = () => {
            let alive = false;
            
            particles.forEach(particle => {
                particle.userData.life -= 0.03;
                
                if (particle.userData.life > 0) {
                    alive = true;
                    particle.position.x += particle.userData.velocity.x;
                    particle.position.y += particle.userData.velocity.y;
                    particle.position.z += particle.userData.velocity.z;
                    particle.scale.setScalar(particle.userData.life);
                    particle.material.opacity = particle.userData.life;
                    particle.material.transparent = true;
                } else if (particle.parent) {
                    this.scene.remove(particle);
                }
            });
            
            if (alive) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }

    // ===== LOOP DE ANIMAÇÃO OTIMIZADO =====

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        
        // Atualizar apenas a cada 16ms (aproximadamente 60fps)
        if (deltaTime >= 16) {
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
            this.lastTime = now;
        }
    }
}