// scene3d.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PART_TRANSLATIONS, PART_POSITIONS } from './constants.js';
import { gameState } from './game.js';

export class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 3, 8);
        this.camera.lookAt(0, 1, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
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
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        
        this.setupLights();
        this.setupEnvironment();
        this.createGarage();
        
        this.currentCar = null;
        this.partLabels = [];
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffeedd, 1);
        sunLight.position.set(5, 10, 7);
        sunLight.castShadow = true;
        sunLight.receiveShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        const d = 10;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 15;
        this.scene.add(sunLight);
        
        for (let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(0xffaa66, 0.8);
            light.position.set(-3 + i * 2, 4, 0);
            this.scene.add(light);
        }
    }

    setupEnvironment() {
        const floorGeometry = new THREE.CircleGeometry(20, 32);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        const gridHelper = new THREE.GridHelper(20, 20, 0xff6b00, 0x444444);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    createGarage() {
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
        
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 0.5), wallMaterial);
        backWall.position.set(0, 2, -5);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);
        
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 10), wallMaterial);
        leftWall.position.set(-6, 2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 10), wallMaterial);
        rightWall.position.set(6, 2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);
    }

    createCar(carData, job) {
        if (this.currentCar) {
            this.scene.remove(this.currentCar);
        }
        
        const carGroup = new THREE.Group();
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.3, metalness: 0.7 });
        
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 5), bodyMaterial);
        mainBody.position.set(0, 0.8, 0);
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        carGroup.add(mainBody);
        
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.5), new THREE.MeshStandardMaterial({ color: 0x444444 }));
        cabin.position.set(0, 1.4, -0.5);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        carGroup.add(cabin);
        
        this.addWheels(carGroup);
        this.addLights(carGroup);
        
        carGroup.position.set(0, 0, 0);
        this.currentCar = carGroup;
        this.scene.add(carGroup);
        
        this.updatePartLabels(carData, job);
        
        return carGroup;
    }

    addWheels(carGroup) {
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const wheelPositions = [
            [-1.1, 0.4, 1.5], [1.1, 0.4, 1.5],
            [-1.1, 0.4, -1.5], [1.1, 0.4, -1.5]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32), wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);
        });
    }

    addLights(carGroup) {
        const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0x442200 });
        const headlightLeft = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16), headlightMaterial);
        headlightLeft.position.set(-0.8, 0.9, 2.4);
        carGroup.add(headlightLeft);
        
        const headlightRight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16), headlightMaterial);
        headlightRight.position.set(0.8, 0.9, 2.4);
        carGroup.add(headlightRight);
    }

    updatePartLabels(carData, job) {
        if (this.partLabels.length > 0) {
            this.partLabels.forEach(label => {
                if (this.currentCar) this.currentCar.remove(label);
            });
            this.partLabels = [];
        }

        if (!this.currentCar || !carData || !job) return;

        Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
            if (carData.parts[partName]) {
                const condition = Math.min(100, Math.round(carData.parts[partName].condition));
                const targetCondition = Math.min(100, Math.round(job.targetConditions[partName]));
                const displayName = PART_TRANSLATIONS[partName].display;
                
                const labelDiv = document.createElement('div');
                labelDiv.className = 'part-label';
                if (gameState.selectedPart === partName) {
                    labelDiv.classList.add('selected');
                }
                
                labelDiv.textContent = `${displayName}: ${condition}% / ${targetCondition}%`;
                
                if (condition === 100) {
                    labelDiv.classList.add('perfect');
                    labelDiv.style.backgroundColor = '#4CAF50';
                } else if (condition >= targetCondition) {
                    labelDiv.style.backgroundColor = '#00aa00';
                } else if (condition >= targetCondition * 0.7) {
                    labelDiv.style.backgroundColor = '#ffaa00';
                } else {
                    labelDiv.style.backgroundColor = '#ff0000';
                }
                
                labelDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectPart(partName);
                });
                
                const label = new CSS2DObject(labelDiv);
                label.position.set(pos[0], pos[1] + 0.5, pos[2]);
                this.currentCar.add(label);
                this.partLabels.push(label);
            }
        });
    }

    selectPart(partName) {
        gameState.selectedPart = partName;
        
        this.partLabels.forEach(label => {
            label.element.classList.remove('selected');
            if (label.element.textContent.includes(PART_TRANSLATIONS[partName].display)) {
                label.element.classList.add('selected');
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }
}