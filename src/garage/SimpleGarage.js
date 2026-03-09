// src/garage/SimpleGarage.js - Garagem simples e funcional

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class SimpleGarage {
  constructor(container) {

    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.objects = []; // Array para rastrear objetos criados
    this.level = 1;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.createFloor();
    this.createWalls();
    this.createLevel1();

    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(8, 5, 12);
    this.camera.lookAt(0, 1, 0);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1, 0);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    this.scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x4466ff, 0.5);
    fillLight.position.set(-3, 3, 4);
    this.scene.add(fillLight);
  }

  createFloor() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(20, 20, 0xff6b00, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    this.objects.push(floor, gridHelper);
  }

  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

    // Parede dos fundos
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, 4, 0.5),
      wallMaterial,
    );
    backWall.position.set(0, 2, -10);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Paredes laterais
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 20),
      wallMaterial,
    );
    leftWall.position.set(-10, 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 20),
      wallMaterial,
    );
    rightWall.position.set(10, 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    this.objects.push(backWall, leftWall, rightWall);
  }

  // ===== NÍVEL 1 =====
  createLevel1() {

    // 1 elevador no centro
    this.createLift(0, 0, 0);

    // 1 bancada
    this.createWorkbench(-4, 0, -4);

    // 1 armário
    this.createCabinet(5, 0, -4, 0xcc3333);

  }

  // ===== NÍVEL 2 =====
  createLevel2() {

    // Segundo elevador
    this.createLift(4, 0, 2);

    // Segunda bancada
    this.createWorkbench(4, 0, 4);

    // Máquina de pneus
    this.createTireMachine(-4, 0, 3);
  }

  // ===== NÍVEL 3 =====
  createLevel3() {

    // Terceiro elevador
    this.createLift(-3, 0, 3);

    // Computador
    this.createComputer(5, 0, 3);

    // Segundo armário
    this.createCabinet(-5, 0, -3, 0x33cc33);
  }

  // ===== NÍVEL 4 =====
  createLevel4() {

    // Quarto elevador
    this.createLift(3, 0, -2);

    // Estante
    this.createStorageRack(-2, 0, -5);

    // Área de teste
    this.createTestArea(6, 0, 0);
  }

  // ===== NÍVEL 5 =====
  createLevel5() {

    // Oficina de pintura
    this.createPaintBooth(-6, 0, 4);

    // Guincho
    this.createEngineCrane(0, 0, -5);

    // Decorações
    this.createPosters();
  }

  // ===== MÉTODOS DE CRIAÇÃO DE OBJETOS =====

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
    const columnGeo = new THREE.BoxGeometry(0.2, 2.5, 0.2);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    const positions = [
      [-1.1, 1.3, -2.0],
      [1.1, 1.3, -2.0],
      [-1.1, 1.3, 2.0],
      [1.1, 1.3, 2.0],
    ];

    positions.forEach((pos) => {
      const column = new THREE.Mesh(columnGeo, columnMat);
      column.position.set(pos[0], pos[1], pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      group.add(column);
    });

    // Braços
    const armGeo = new THREE.BoxGeometry(2.1, 0.1, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });

    const armPositions = [
      [0, 0.5, -1.5],
      [0, 0.5, 1.5],
    ];

    armPositions.forEach((pos) => {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(pos[0], pos[1], pos[2]);
      arm.castShadow = true;
      group.add(arm);
    });

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createWorkbench(x, y, z) {

    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(2.2, 0.8, 1.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Tampo
    const topGeo = new THREE.BoxGeometry(2.4, 0.1, 1.4);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.85;
    top.castShadow = true;
    group.add(top);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createCabinet(x, y, z, color) {

    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.4, 2.0, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createTireMachine(x, y, z) {

    const group = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const columnGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6);
    const columnMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.set(0.4, 0.7, 0);
    column.castShadow = true;
    group.add(column);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createComputer(x, y, z) {

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
    monitor.position.set(0, 1.1, 0);
    monitor.castShadow = true;
    group.add(monitor);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createStorageRack(x, y, z) {

    const rackMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

    for (let level = 0; level < 3; level++) {
      const shelfGeo = new THREE.BoxGeometry(2.0, 0.1, 1.0);
      const shelf = new THREE.Mesh(shelfGeo, rackMat);
      shelf.position.set(x, y + 0.5 + level * 1.0, z);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.scene.add(shelf);
    }
  }

  createTestArea(x, y, z) {

    const mat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const points = [
      new THREE.Vector3(x - 2, y + 0.02, z),
      new THREE.Vector3(x + 2, y + 0.02, z),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
  }

  createPaintBooth(x, y, z) {

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

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createEngineCrane(x, y, z) {

    const group = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(1.5, 0.2, 1.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const columnGeo = new THREE.BoxGeometry(0.3, 2.2, 0.3);
    const column = new THREE.Mesh(columnGeo, baseMat);
    column.position.set(0, 1.2, 0);
    column.castShadow = true;
    group.add(column);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createPosters() {

    const posterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

    const poster1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.0, 0.1),
      posterMat,
    );
    poster1.position.set(-7, 2.0, -9.5);
    this.scene.add(poster1);

    const poster2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.0, 0.1),
      posterMat,
    );
    poster2.position.set(7, 2.0, -9.5);
    this.scene.add(poster2);

  }

  // ===== MÉTODO PARA UPGRADE =====
  upgradeToLevel(level) {

    switch (level) {
      case 2:
        this.createLevel2();
        break;
      case 3:
        this.createLevel3();
        break;
      case 4:
        this.createLevel4();
        break;
      case 5:
        this.createLevel5();
        break;
      default:
        return;
    }

    this.level = level;
  }

  // ===== MÉTODO PARA LISTAR OBJETOS =====
  listObjects() {
    return this.scene.children.length;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.SimpleGarage = SimpleGarage;
}
