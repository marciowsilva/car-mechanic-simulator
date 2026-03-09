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
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

    // Parede dos fundos
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(25, 5, 0.3),
      this.wallMat,
    );
    backWall.position.set(0, 2.5, -12);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    // Paredes laterais
    const sideWallGeo = new THREE.BoxGeometry(0.3, 5, 25);

    const leftWall = new THREE.Mesh(sideWallGeo, this.wallMat);
    leftWall.position.set(-12.5, 2.5, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, this.wallMat);
    rightWall.position.set(12.5, 2.5, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // Grupos para níveis
    this.levelGroups = {
      1: new THREE.Group(),
      2: new THREE.Group(),
      3: new THREE.Group(),
      4: new THREE.Group(),
      5: new THREE.Group(),
    };

    Object.values(this.levelGroups).forEach((group) => this.scene.add(group));

    this.setupLevelContent();
    this.updateVisibility(1);
  }

  setupLevelContent() {
    // --- NÍVEL 1: Itens básicos ---
    this.addLift([-5, 0, -4], this.levelGroups[1]);
    this.addWorkbench([-9, 0, -9], this.levelGroups[1]);
    this.addCabinet(-10, 0xcc3333, this.levelGroups[1]);

    // --- NÍVEL 2: Expansão básica ---
    this.addLift([5, 0, -4], this.levelGroups[2]);
    this.addTireMachine([-7, 0, 8], this.levelGroups[2]);
    this.addPoster(-9, 0xffaa00, this.levelGroups[2]);

    // --- NÍVEL 3: Profissionalizante ---
    this.addLift([-5, 0, 4], this.levelGroups[3]);
    this.addWorkbench([9, 0, -9], this.levelGroups[3]);
    this.addComputerTable([10, 0, -11], this.levelGroups[3]);
    this.addCabinet(10, 0x3333cc, this.levelGroups[3]);

    // --- NÍVEL 4: Oficina Completa ---
    this.addLift([5, 0, 4], this.levelGroups[4]);
    this.addWorkbench([-9, 0, 9], this.levelGroups[4]);
    this.addShelf([-11, 0, 0], this.levelGroups[4]);

    // --- NÍVEL 5: Ultra Master ---
    this.addWorkbench([9, 0, 9], this.levelGroups[5]);
    this.addPaintArea(this.levelGroups[5]);
    this.addPoster(9, 0x00ffaa, this.levelGroups[5]);
    this.addExtraTires(this.levelGroups[5]);
  }

  addLift(pos, group) {
    const liftGroup = new THREE.Group();
    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.2, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xcccccc }),
    );
    base.position.set(0, 0.1, 0);
    base.receiveShadow = true;
    base.castShadow = true;
    liftGroup.add(base);

    // Colunas
    const columnGeo = new THREE.BoxGeometry(0.25, 2.5, 0.25);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    const column1 = new THREE.Mesh(columnGeo, columnMat);
    column1.position.set(-1.0, 1.3, -1.8);
    column1.castShadow = true;
    liftGroup.add(column1);

    const column2 = new THREE.Mesh(columnGeo, columnMat);
    column2.position.set(1.0, 1.3, -1.8);
    column2.castShadow = true;
    liftGroup.add(column2);

    liftGroup.position.set(pos[0], pos[1], pos[2]);
    group.add(liftGroup);
  }

  addWorkbench(pos, group) {
    const benchGroup = new THREE.Group();
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), benchMat);
    base.position.set(0, 0.4, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    benchGroup.add(base);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a }),
    );
    top.position.set(0, 0.85, 0);
    top.castShadow = true;
    benchGroup.add(top);

    benchGroup.position.set(pos[0], pos[1], pos[2]);
    group.add(benchGroup);
  }

  addCabinet(x, color, group) {
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2, 0.8),
      new THREE.MeshStandardMaterial({ color: color }),
    );
    cabinet.position.set(x, 1, -11);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    group.add(cabinet);
  }

  addPoster(x, color, group) {
    const poster = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 0.1),
      new THREE.MeshStandardMaterial({ color: color }),
    );
    poster.position.set(x, 2.5, -11.5);
    group.add(poster);
  }

  addTireMachine(pos, group) {
    const machine = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
    );
    base.position.y = 0.5;
    machine.add(base);
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x666666 }),
    );
    arm.position.set(0.4, 1, 0);
    machine.add(arm);
    machine.position.set(pos[0], pos[1], pos[2]);
    group.add(machine);
  }

  addComputerTable(pos, group) {
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 1),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
    );
    table.position.set(pos[0], 0.4, pos[2]);
    group.add(table);
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x000000 }),
    );
    screen.position.set(pos[0], 1.2, pos[2] - 0.4);
    group.add(screen);
  }

  addShelf(pos, group) {
    const shelf = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x555555 }),
      );
      p.position.y = 0.5 + i * 1;
      shelf.add(p);
    }
    shelf.position.set(pos[0], pos[1], pos[2]);
    shelf.rotation.y = Math.PI / 2;
    group.add(shelf);
  }

  addPaintArea(group) {
    const area = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.05, 8),
      new THREE.MeshStandardMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.3,
      }),
    );
    area.position.set(8, 0.03, 8);
    group.add(area);
  }

  addExtraTires(group) {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (let i = 0; i < 4; i++) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.1, 8, 16),
        tireMat,
      );
      tire.rotation.x = Math.PI / 2;
      tire.position.set(5 + (i % 2) * 1.5, 0.3, 8 + (i > 1 ? 1 : 0));
      group.add(tire);
    }
  }

  updateVisibility(level) {
    this.currentLevel = level;
    for (let i = 1; i <= 5; i++) {
      if (this.levelGroups[i]) {
        this.levelGroups[i].visible = i <= level;
      }
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

    // Posicionar no elevador 1 (sempre disponível)
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

  upgradeToLevel(level) {
    console.log("Garage upgrading visually to level " + level);
    this.updateVisibility(level);
  }
  upgradeToLevel2() {
    this.updateVisibility(2);
  }
  upgradeToLevel3() {
    this.updateVisibility(3);
  }
  upgradeToLevel4() {
    this.updateVisibility(4);
  }
  upgradeToLevel5() {
    this.updateVisibility(5);
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
