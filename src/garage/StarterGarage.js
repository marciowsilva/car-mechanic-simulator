// src/garage/StarterGarage.js - Garagem inicial simples

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class StarterGarage {
  constructor(container) {
    console.log("🏢 Inicializando garagem básica (Nível 1)...");

    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.level = 1;
    this.equipment = {
      lifts: 1,
      workbenches: 1,
      cabinets: 1,
      tireMachine: false,
      computer: false,
      storage: false,
    };

    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.createBasicGarage();

    this.currentCar = null;
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(6, 4, 10);
    this.camera.lookAt(0, 1, 0);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 15;
    this.controls.target.set(0, 1, 0);
    this.controls.rotateSpeed = 0.8;
  }

  setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);

    // Luz principal
    const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x4466ff, 0.4);
    fillLight.position.set(-3, 3, 3);
    this.scene.add(fillLight);
  }

  createBasicGarage() {
    // ===== CHÃO =====
    const floorGeo = new THREE.CircleGeometry(12, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid simples
    const gridHelper = new THREE.GridHelper(12, 12, 0xff6b00, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // ===== PAREDES =====
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const wallHeight = 3.5;

    // Parede dos fundos
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(14, wallHeight, 0.3),
      wallMat,
    );
    backWall.position.set(0, wallHeight / 2, -6);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    // Paredes laterais
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, wallHeight, 12),
      wallMat,
    );
    leftWall.position.set(-7, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, wallHeight, 12),
      wallMat,
    );
    rightWall.position.set(7, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // ===== 1 ELEVADOR =====
    this.createLift([0, 0, 0]);

    // ===== 1 BANCADA =====
    this.createWorkbench([-4, 0, -4]);

    // ===== 1 ARMÁRIO =====
    this.createCabinet([5, 0, -4], 0xcc3333);

    // ===== ÁREA VAZIA PARA EXPANSÃO =====
    // Espaço reservado para futuros equipamentos
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
    const columnGeo = new THREE.BoxGeometry(0.2, 2.2, 0.2);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    const colPositions = [
      [-1.0, 1.2, -1.9],
      [1.0, 1.2, -1.9],
      [-1.0, 1.2, 1.9],
      [1.0, 1.2, 1.9],
    ];

    colPositions.forEach((pos) => {
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
      [0, 0.5, 1.2],
    ];

    armPositions.forEach((pos) => {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(pos[0], pos[1], pos[2]);
      arm.castShadow = true;
      group.add(arm);
    });

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);

    // Guardar referência
    this.lift1 = group;
  }

  createWorkbench(position) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(2.0, 0.8, 1.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
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

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);

    this.workbench1 = group;
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
    for (let i = 0; i < 3; i++) {
      const drawerGeo = new THREE.BoxGeometry(1.0, 0.3, 0.1);
      const drawerMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const drawer = new THREE.Mesh(drawerGeo, drawerMat);
      drawer.position.set(0, 0.3 + i * 0.4, 0.35);
      drawer.castShadow = true;
      group.add(drawer);
    }

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);

    this.cabinet1 = group;
  }

  // ===== MÉTODOS PARA UPGRADE =====

  upgradeToLevel2() {
    console.log("⬆️ Garagem expandida para Nível 2!");

    // Adicionar segundo elevador
    this.createLift([4, 0, 0]);

    // Adicionar segunda bancada
    this.createWorkbench([4, 0, 4]);

    // Adicionar máquina de pneus
    this.createTireMachine([-4, 0, 3]);

    this.level = 2;
    this.equipment.lifts = 2;
    this.equipment.workbenches = 2;
    this.equipment.tireMachine = true;
  }

  upgradeToLevel3() {
    console.log("⬆️ Garagem expandida para Nível 3!");

    // Adicionar terceiro elevador
    this.createLift([-4, 0, 3]);

    // Adicionar computador
    this.createComputer([5, 0, 3]);

    // Adicionar armário extra
    this.createCabinet([-5, 0, -3], 0x33cc33);

    this.level = 3;
    this.equipment.lifts = 3;
    this.equipment.computer = true;
    this.equipment.cabinets = 2;
  }

  upgradeToLevel4() {
    console.log("⬆️ Garagem expandida para Nível 4!");

    // Adicionar quarto elevador
    this.createLift([0, 0, 4]);

    // Adicionar estante de peças
    this.createStorageRack([-2, 0, -5]);

    // Adicionar área de teste
    this.createTestArea([6, 0, 0]);

    this.level = 4;
    this.equipment.lifts = 4;
    this.equipment.storage = true;
  }

  upgradeToLevel5() {
    console.log("⬆️ Garagem expandida para Nível Máximo!");

    // Oficina de pintura
    this.createPaintBooth([-6, 0, 4]);

    // Guincho de motor
    this.createEngineCrane([0, 0, -5]);

    // Decorações
    this.createDecorations();

    this.level = 5;
    this.equipment.paintBooth = true;
    this.equipment.engineCrane = true;
  }

  // Métodos para criar equipamentos avançados
  createTireMachine(position) {
    const group = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const columnGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.set(0.3, 0.7, 0);
    column.castShadow = true;
    group.add(column);

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

    const deskGeo = new THREE.BoxGeometry(1.0, 0.1, 0.6);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.55;
    desk.castShadow = true;
    desk.receiveShadow = true;
    group.add(desk);

    const monitorGeo = new THREE.BoxGeometry(0.6, 0.5, 0.1);
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const monitor = new THREE.Mesh(monitorGeo, monitorMat);
    monitor.position.set(0, 1.0, 0);
    monitor.castShadow = true;
    group.add(monitor);

    const screenGeo = new THREE.BoxGeometry(0.5, 0.4, 0.02);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.0, 0.06);
    group.add(screen);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createStorageRack(position) {
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

    for (let level = 0; level < 3; level++) {
      const shelfGeo = new THREE.BoxGeometry(2.0, 0.1, 1.0);
      const shelf = new THREE.Mesh(shelfGeo, rackMat);
      shelf.position.set(
        position[0],
        position[1] + 0.5 + level * 1.0,
        position[2],
      );
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.scene.add(shelf);

      // Caixas
      if (Math.random() > 0.5) {
        const boxGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const boxMat = new THREE.MeshStandardMaterial({
          color: Math.random() * 0xffffff,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(
          position[0] + (Math.random() - 0.5) * 1.2,
          position[1] + 0.5 + level * 1.0 + 0.3,
          position[2],
        );
        box.castShadow = true;
        this.scene.add(box);
      }
    }
  }

  createTestArea(position) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const points = [
      new THREE.Vector3(position[0] - 2, 0.02, position[2]),
      new THREE.Vector3(position[0] + 2, 0.02, position[2]),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
  }

  createPaintBooth(position) {
    const group = new THREE.Group();

    const boothGeo = new THREE.BoxGeometry(2.5, 2.0, 2.5);
    const boothMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    const booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.y = 1.0;
    booth.castShadow = true;
    booth.receiveShadow = true;
    group.add(booth);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createEngineCrane(position) {
    const group = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(1.2, 0.2, 1.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const columnGeo = new THREE.BoxGeometry(0.2, 2.0, 0.2);
    const column = new THREE.Mesh(columnGeo, baseMat);
    column.position.set(0, 1.1, 0);
    column.castShadow = true;
    group.add(column);

    const armGeo = new THREE.BoxGeometry(2.0, 0.1, 0.2);
    const arm = new THREE.Mesh(armGeo, baseMat);
    arm.position.set(1.0, 2.0, 0);
    arm.castShadow = true;
    group.add(arm);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createDecorations() {
    // Posteres
    const posterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    const poster1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.1),
      posterMat,
    );
    poster1.position.set(-5, 2.0, -5.8);
    this.scene.add(poster1);

    const poster2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.1),
      posterMat,
    );
    poster2.position.set(5, 2.0, -5.8);
    this.scene.add(poster2);
  }

  createCar(carData, job) {
    if (this.currentCar) {
      this.scene.remove(this.currentCar);
    }

    const carGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(2.0, 0.6, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 1.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, -0.4);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const wheelPositions = [
      [-0.9, 0.3, 1.2],
      [0.9, 0.3, 1.2],
      [-0.9, 0.3, -1.3],
      [0.9, 0.3, -1.3],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });

    carGroup.position.set(0, 0.2, 0);

    this.currentCar = carGroup;
    this.scene.add(carGroup);

    return carGroup;
  }

  getLevel() {
    return this.level;
  }

  getEquipment() {
    return { ...this.equipment };
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ===== MÉTODOS DE UPGRADE =====

  upgradeToLevel2() {
    console.log("⬆️ Garagem expandida para Nível 2!");

    // Segundo elevador
    this.createLift([4, 0, 2]);

    // Segunda bancada
    this.createWorkbench([4, 0, 4]);

    // Máquina de pneus
    this.createTireMachine([-4, 0, 3]);

    this.equipment.lifts = 2;
    this.equipment.workbenches = 2;
    this.equipment.tireMachine = true;

    this.level = 2;
  }

  upgradeToLevel3() {
    console.log("⬆️ Garagem expandida para Nível 3!");

    // Terceiro elevador
    this.createLift([-3, 0, 3]);

    // Computador
    this.createComputer([5, 0, 3]);

    // Segundo armário
    this.createCabinet([-5, 0, -3], 0x33cc33);

    this.equipment.lifts = 3;
    this.equipment.computer = true;
    this.equipment.cabinets = 2;

    this.level = 3;
  }

  upgradeToLevel4() {
    console.log("⬆️ Garagem expandida para Nível 4!");

    // Quarto elevador
    this.createLift([3, 0, -2]);

    // Estante de peças
    this.createStorageRack([-2, 0, -5]);

    // Área de teste
    this.createTestArea([6, 0, 0]);

    this.equipment.lifts = 4;
    this.equipment.storage = true;

    this.level = 4;
  }

  upgradeToLevel5() {
    console.log("⬆️ Garagem expandida para Nível Máximo!");

    // Oficina de pintura
    this.createPaintBooth([-6, 0, 4]);

    // Guincho de motor
    this.createEngineCrane([0, 0, -5]);

    // Decorações
    this.createDecorations();

    this.equipment.paintBooth = true;
    this.equipment.engineCrane = true;

    this.level = 5;
  }
}
