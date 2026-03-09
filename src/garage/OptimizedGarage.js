// src/garage/OptimizedGarage.js - Garagem realista com otimizações

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ===== 1. CACHE DE TEXTURAS =====
THREE.Cache.enabled = true; // Ativa cache de texturas
// ================================

export class OptimizedGarage {
  constructor(container) {

    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLights();
    this.createGarage();

    this.currentCar = null;
    this.particles = [];

    this.animate();

    // Código temporario monitoramento FPS
    this.fpsCounter = 0;
    this.lastFpsUpdate = performance.now();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(8, 4, 15);
    this.camera.lookAt(0, 1, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.bias = 0.0001;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // ===== 2. RELÓGIO PARA CONTROLE DE FPS =====
    this.clock = new THREE.Clock();
    // ===========================================
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.target.set(0, 1, 0);
    this.controls.rotateSpeed = 0.8;
  }

  setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);

    // Luz principal
    const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 30;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    mainLight.shadow.bias = -0.0005;
    this.scene.add(mainLight);

    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x4466ff, 0.5);
    fillLight.position.set(-3, 4, 4);
    fillLight.castShadow = false;
    this.scene.add(fillLight);

    const fillLight2 = new THREE.PointLight(0xffaa66, 0.5);
    fillLight2.position.set(4, 4, -3);
    fillLight2.castShadow = false;
    this.scene.add(fillLight2);
  }

  createGarage() {
    // ===== CHÃO (textura simples) =====
    const floorGeo = new THREE.CircleGeometry(25, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid simples (menos linhas)
    const gridHelper = new THREE.GridHelper(25, 20, 0xff6b00, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // ===== PAREDES (simplificadas) =====
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

    // Parede dos fundos
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(25, 5, 0.3), wallMat);
    backWall.position.set(0, 2.5, -12);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    // Paredes laterais
    const sideWallGeo = new THREE.BoxGeometry(0.3, 5, 25);

    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-12.5, 2.5, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(12.5, 2.5, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // ===== ELEVADORES (simplificados) =====
    const liftPositions = [
      [-5, 0, -4],
      [5, 0, -4],
      [-5, 0, 4],
      [5, 0, 4],
    ];

    liftPositions.forEach((pos) => {
      // Base
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.2, 4.2),
        new THREE.MeshStandardMaterial({ color: 0xcccccc }),
      );
      base.position.set(pos[0], 0.1, pos[2]);
      base.receiveShadow = true;
      base.castShadow = true;
      this.scene.add(base);

      // Colunas (apenas 2 por elevador)
      const columnGeo = new THREE.BoxGeometry(0.25, 2.5, 0.25);
      const columnMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

      const column1 = new THREE.Mesh(columnGeo, columnMat);
      column1.position.set(pos[0] - 1.0, 1.3, pos[2] - 1.8);
      column1.castShadow = true;
      column1.receiveShadow = true;
      this.scene.add(column1);

      const column2 = new THREE.Mesh(columnGeo, columnMat);
      column2.position.set(pos[0] + 1.0, 1.3, pos[2] - 1.8);
      column2.castShadow = true;
      column2.receiveShadow = true;
      this.scene.add(column2);
    });

    // ===== BANCADAS (simplificadas) =====
    const benchPositions = [
      [-9, 0, -9],
      [9, 0, -9],
      [-9, 0, 9],
      [9, 0, 9],
    ];

    benchPositions.forEach((pos) => {
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), benchMat);
      base.position.set(pos[0], 0.4, pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);

      // Tampo
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.1, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a }),
      );
      top.position.set(pos[0], 0.85, pos[2]);
      top.castShadow = true;
      this.scene.add(top);
    });

    // ===== ARMÁRIOS (poucos) =====
    const cabinetColors = [0xcc3333, 0x3333cc];
    [-10, 10].forEach((x, i) => {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 0.8),
        new THREE.MeshStandardMaterial({ color: cabinetColors[i] }),
      );
      cabinet.position.set(x, 1, -11);
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      this.scene.add(cabinet);
    });

    // ===== DECORAÇÃO MÍNIMA =====
    // Posteres
    const posterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    [-9, 9].forEach((x) => {
      const poster = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1, 0.1),
        posterMat,
      );
      poster.position.set(x, 2.5, -11.5);
      this.scene.add(poster);
    });

    // Pneus (apenas 2)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (let i = 0; i < 2; i++) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.1, 8, 16),
        tireMat,
      );
      tire.rotation.x = Math.PI / 2;
      tire.position.set(-7 + i * 14, 0.3, 8);
      tire.castShadow = true;
      this.scene.add(tire);
    }
  }

  createCar(carData, job) {
    if (this.currentCar) {
      this.scene.remove(this.currentCar);
    }

    const carGroup = new THREE.Group();

    // Carroceria (menos polígonos)
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.6, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
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

    // Rodas (menos segmentos)
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const positions = [
      [-1.0, 0.3, 1.2],
      [1.0, 0.3, 1.2],
      [-1.0, 0.3, -1.4],
      [1.0, 0.3, -1.4],
    ];

    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });

    // Posicionar
    carGroup.position.set(-5, 0.3, -4);

    this.currentCar = carGroup;
    this.scene.add(carGroup);

    return carGroup;
  }

  createRepairEffect(position) {
    // Menos partículas
    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.SphereGeometry(0.04, 4);
      const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.4;
      particle.position.y += (Math.random() - 0.5) * 0.4;
      particle.position.z += (Math.random() - 0.5) * 0.4;

      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
        life: 1.0,
      };

      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= 0.02;

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      } else {
        p.position.x += p.userData.velocity.x;
        p.position.y += p.userData.velocity.y;
        p.position.z += p.userData.velocity.z;
        p.scale.setScalar(p.userData.life);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // ===== 3. LIMITADOR DE FPS =====
    const delta = this.clock.getDelta();
    if (delta > 0.016) {
      // Se passou mais de 16ms (abaixo de 60fps)
      // Atualiza apenas se necessário
      this.updateParticles();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    } else {
      // Se estiver acima de 60fps, renderiza mesmo assim para não travar
      this.updateParticles();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
    // ================================

    // Versão mais simples (recomendada):
    // Simplesmente renderiza sempre, mas o clock já ajuda
    this.updateParticles();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Código temporario monitoramento FPS
    //this.fpsCounter++;
    //const now = performance.now();
    //if (now - this.lastFpsUpdate > 1000) {
    //  
    //  this.fpsCounter = 0;
    //  this.lastFpsUpdate = now;
    //}
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.OptimizedGarage = OptimizedGarage;
}
