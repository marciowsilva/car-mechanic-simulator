// src/garage/UltraRealisticGarage.js - Garagem fotorrealista

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RealisticGarageConfig } from "./RealisticGarageConfig.js";

export class UltraRealisticGarage {
  constructor(container) {

    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);
    this.scene.fog = new THREE.Fog(0x111122, 30, 80);

    this.clock = new THREE.Clock();
    this.mixers = [];
    this.particles = [];

    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.setupTextures();
    this.createEnvironment();
    this.createStructure();
    this.createFloorDetails();
    this.createEquipment();
    this.createStorage();
    this.createDetails();
    this.createParticles();

    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: true,
      depth: true,
      alpha: false,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Sombras de alta qualidade
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.bias = 0.00005;
    this.renderer.shadowMap.normalBias = 0.02;
    this.renderer.shadowMap.width = 4096;
    this.renderer.shadowMap.height = 4096;

    // Tone mapping para cores realistas
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(15, 6, 25);
    this.camera.lookAt(0, 1, 0);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 1, 0);
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
  }

  setupLights() {
    const cfg = RealisticGarageConfig.lighting;

    // Luz ambiente com cor sutil
    const ambientLight = new THREE.AmbientLight(
      cfg.ambient.color,
      cfg.ambient.intensity,
    );
    this.scene.add(ambientLight);

    // Luz principal (sol) com sombras
    const mainLight = new THREE.DirectionalLight(
      cfg.main.color,
      cfg.main.intensity,
    );
    mainLight.position.set(
      cfg.main.position[0],
      cfg.main.position[1],
      cfg.main.position[2],
    );
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = cfg.main.shadowSize;
    mainLight.shadow.mapSize.height = cfg.main.shadowSize;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -25;
    mainLight.shadow.camera.right = 25;
    mainLight.shadow.camera.top = 25;
    mainLight.shadow.camera.bottom = -25;
    mainLight.shadow.bias = -0.0005;
    mainLight.shadow.normalBias = 0.02;
    this.scene.add(mainLight);

    // Luz de preenchimento
    const fillLight = new THREE.PointLight(cfg.fill.color, cfg.fill.intensity);
    fillLight.position.set(
      cfg.fill.position[0],
      cfg.fill.position[1],
      cfg.fill.position[2],
    );
    fillLight.castShadow = false;
    this.scene.add(fillLight);

    // Luz traseira
    const backLight = new THREE.PointLight(cfg.back.color, cfg.back.intensity);
    backLight.position.set(
      cfg.back.position[0],
      cfg.back.position[1],
      cfg.back.position[2],
    );
    backLight.castShadow = false;
    this.scene.add(backLight);

    // Luzes de teto (fluorescentes)
    cfg.ceiling.forEach((lightCfg) => {
      const light = new THREE.SpotLight(lightCfg.color, lightCfg.intensity);
      light.position.set(
        lightCfg.position[0],
        lightCfg.position[1],
        lightCfg.position[2],
      );
      light.angle = lightCfg.angle || 0.8;
      light.penumbra = lightCfg.penumbra || 0.5;
      light.decay = 1;
      light.distance = 30;
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;

      // Alvo da luz
      const target = new THREE.Object3D();
      target.position.set(lightCfg.position[0], 0, lightCfg.position[2] + 2);
      this.scene.add(target);
      light.target = target;

      this.scene.add(light);

      // Adicionar modelo da luminária
      this.createFluorescentLight(lightCfg.position);
    });

    // Luzes de trabalho nas bancadas
    cfg.workLights.forEach((lightCfg) => {
      const light = new THREE.SpotLight(lightCfg.color, lightCfg.intensity);
      light.position.set(
        lightCfg.position[0],
        lightCfg.position[1],
        lightCfg.position[2],
      );
      light.angle = 0.6;
      light.penumbra = 0.3;
      light.decay = 1;
      light.distance = 15;
      light.castShadow = true;

      const target = new THREE.Object3D();
      target.position.set(
        lightCfg.target[0],
        lightCfg.target[1],
        lightCfg.target[2],
      );
      this.scene.add(target);
      light.target = target;

      this.scene.add(light);
    });

    // Néons
    cfg.neon.forEach((neonCfg) => {
      const neonLight = new THREE.PointLight(neonCfg.color, neonCfg.intensity);
      neonLight.position.set(
        neonCfg.position[0],
        neonCfg.position[1],
        neonCfg.position[2],
      );
      this.scene.add(neonLight);
    });
  }

  createFluorescentLight(position) {
    const group = new THREE.Group();

    // Base da luminária
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.3,
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.4), baseMat);
    base.position.y = 0.05;
    group.add(base);

    // Tubos fluorescentes
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x88aaff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = -0.4; i <= 0.4; i += 0.8) {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8),
        tubeMat,
      );
      tube.rotation.z = Math.PI / 2;
      tube.position.set(i, 0, 0);
      group.add(tube);
    }

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  setupTextures() {
    // Carregar texturas (simplificado - você precisará adicionar os arquivos)
    this.textures = {};
    const loader = new THREE.TextureLoader();

    // Por enquanto, usar texturas procedurais
    this.createProceduralTextures();
  }

  createProceduralTextures() {
    // Textura de concreto procedural
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Concreto base
    ctx.fillStyle = "#7a7a7a";
    ctx.fillRect(0, 0, 512, 512);

    // Adicionar ruído
    for (let i = 0; i < 10000; i++) {
      const x = Math.floor(Math.random() * 512);
      const y = Math.floor(Math.random() * 512);
      const brightness = 100 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const concreteTex = new THREE.CanvasTexture(canvas);
    concreteTex.wrapS = THREE.RepeatWrapping;
    concreteTex.wrapT = THREE.RepeatWrapping;
    concreteTex.repeat.set(4, 4);

    this.textures.concrete = concreteTex;
  }

  createEnvironment() {
    // Chão principal
    const floorGeo = new THREE.CircleGeometry(60, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.9,
      metalness: 0.1,
      map: this.textures.concrete,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Céu/ambiente (simplificado)
    this.scene.background = new THREE.Color(0x111122);
  }

  createStructure() {
    const cfg = RealisticGarageConfig;
    const dims = cfg.dimensions;
    const mat = cfg.materials;
    const halfW = dims.width / 2;
    const halfL = dims.length / 2;
    const wallHeight = 4; // Altura reduzida

    // Material das paredes
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.7,
    });

    // CHÃO
    const floorGeo = new THREE.PlaneGeometry(dims.width, dims.length);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // GRID OPCIONAL (pode remover se preferir)
    // const gridHelper = new THREE.GridHelper(dims.width, 20, 0xff6b00, 0x444444);
    // gridHelper.position.y = 0.01;
    // this.scene.add(gridHelper);

    // PAREDE DOS FUNDOS
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(dims.width, wallHeight, 0.3),
      wallMat,
    );
    backWall.position.set(0, wallHeight / 2, -halfL);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    // PAREDE ESQUERDA
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, wallHeight, dims.length),
      wallMat,
    );
    leftWall.position.set(-halfW, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    // PAREDE DIREITA
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, wallHeight, dims.length),
      wallMat,
    );
    rightWall.position.set(halfW, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // PORTA (opcional - pode remover)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.2), doorMat);
    door.position.set(0, 1.5, halfL + 0.1);
    door.castShadow = true;
    door.receiveShadow = true;
    this.scene.add(door);
  }

  createFloorDetails() {
    // Manchas de óleo
    const stainMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.4,
    });

    RealisticGarageConfig.equipment.stains.forEach((stain) => {
      const stainGeo = new THREE.CircleGeometry(stain.size, 16);
      const stainMesh = new THREE.Mesh(stainGeo, stainMat);
      stainMesh.rotation.x = -Math.PI / 2;
      stainMesh.position.set(stain.position[0], 0.01, stain.position[2]);
      stainMesh.receiveShadow = true;
      this.scene.add(stainMesh);
    });

    // Marcas de pneu
    const markMat = new THREE.LineBasicMaterial({ color: 0x333333 });

    RealisticGarageConfig.equipment.tireMarks.forEach((mark) => {
      const points = [
        new THREE.Vector3(mark.start[0], 0.02, mark.start[1]),
        new THREE.Vector3(mark.end[0], 0.02, mark.end[1]),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, markMat);
      this.scene.add(line);
    });

    // Linhas de demarcação
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });

    // Vagas dos elevadores
    RealisticGarageConfig.equipment.lifts.forEach((lift) => {
      const points = [
        new THREE.Vector3(
          lift.position[0] - lift.width / 2,
          0.02,
          lift.position[2] - lift.length / 2,
        ),
        new THREE.Vector3(
          lift.position[0] - lift.width / 2,
          0.02,
          lift.position[2] + lift.length / 2,
        ),
        new THREE.Vector3(
          lift.position[0] + lift.width / 2,
          0.02,
          lift.position[2] + lift.length / 2,
        ),
        new THREE.Vector3(
          lift.position[0] + lift.width / 2,
          0.02,
          lift.position[2] - lift.length / 2,
        ),
        new THREE.Vector3(
          lift.position[0] - lift.width / 2,
          0.02,
          lift.position[2] - lift.length / 2,
        ),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      this.scene.add(line);
    });
  }

  createEquipment() {
    // Criar elevadores
    RealisticGarageConfig.equipment.lifts.forEach((lift) => {
      this.createLift(lift);
    });

    // Criar máquina de trocar pneus
    this.createTireChanger(
      RealisticGarageConfig.equipment.tireChanger.position,
    );

    // Criar balanceadora
    this.createWheelBalancer(
      RealisticGarageConfig.equipment.wheelBalancer.position,
    );

    // Criar dreno de óleo
    this.createOilDrain(RealisticGarageConfig.equipment.oilDrain.position);

    // Criar guindaste de motor
    this.createEngineCrane(
      RealisticGarageConfig.equipment.engineCrane.position,
    );

    // Criar suporte de motor
    this.createEngineStand(
      RealisticGarageConfig.equipment.engineStand.position,
    );

    // Criar carregador de bateria
    this.createBatteryCharger(
      RealisticGarageConfig.equipment.batteryCharger.position,
    );

    // Criar máquina de solda
    this.createWeldingMachine(
      RealisticGarageConfig.equipment.weldingMachine.position,
    );

    // Criar oficina de pintura
    this.createPaintShop(RealisticGarageConfig.equipment.paintShop.position);
  }

  createLift(config) {
    const group = new THREE.Group();
    const mat = RealisticGarageConfig.materials;

    // Base
    const baseGeo = new THREE.BoxGeometry(config.width, 0.2, config.length);
    const baseMat = new THREE.MeshStandardMaterial({
      color: mat.metal.color,
      roughness: mat.metal.roughness,
      metalness: mat.metal.metalness,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.receiveShadow = true;
    base.castShadow = true;
    group.add(base);

    // Colunas
    const columnGeo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
    const columnMat = new THREE.MeshStandardMaterial({
      color: mat.wornMetal.color,
      roughness: mat.wornMetal.roughness,
      metalness: mat.wornMetal.metalness,
    });

    const colPositions = [
      [-config.width / 2 + 0.3, 1.8, -config.length / 2 + 0.3],
      [config.width / 2 - 0.3, 1.8, -config.length / 2 + 0.3],
      [-config.width / 2 + 0.3, 1.8, config.length / 2 - 0.3],
      [config.width / 2 - 0.3, 1.8, config.length / 2 - 0.3],
    ];

    colPositions.forEach((pos) => {
      const column = new THREE.Mesh(columnGeo, columnMat);
      column.position.set(pos[0], pos[1], pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      group.add(column);
    });

    // Braços do elevador
    const armGeo = new THREE.BoxGeometry(config.width - 0.6, 0.1, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });

    for (let i = -1; i <= 1; i += 2) {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0, 0.6, (i * config.length) / 3);
      arm.castShadow = true;
      group.add(arm);
    }

    // Pistões hidráulicos
    const pistonGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const piston = new THREE.Mesh(pistonGeo, pistonMat);
        piston.position.set(
          (i * config.width) / 3,
          1.2,
          (j * config.length) / 3,
        );
        piston.castShadow = true;
        group.add(piston);
      }
    }

    group.position.set(
      config.position[0],
      config.position[1],
      config.position[2],
    );
    group.rotation.y = config.rotation;
    this.scene.add(group);
  }

  createTireChanger(position) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.7,
      roughness: 0.3,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Coluna principal
    const columnGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
    });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.set(0.4, 0.8, 0);
    column.castShadow = true;
    group.add(column);

    // Braço
    const armGeo = new THREE.BoxGeometry(1.2, 0.1, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff6b00 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(1.0, 1.2, 0);
    arm.castShadow = true;
    group.add(arm);

    // Cabeçote
    const headGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const head = new THREE.Mesh(headGeo, baseMat);
    head.position.set(1.6, 1.2, 0);
    head.rotation.z = Math.PI / 2;
    head.castShadow = true;
    group.add(head);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createWheelBalancer(position) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.6,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Coluna
    const columnGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 8);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
    });
    const column = new THREE.Mesh(columnGeo, columnMat);
    column.position.y = 0.6;
    column.castShadow = true;
    group.add(column);

    // Display
    const displayGeo = new THREE.BoxGeometry(0.5, 0.3, 0.1);
    const displayMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x004400,
    });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0.4, 0.9, 0);
    display.castShadow = true;
    group.add(display);

    // Eixo
    const shaftGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
    const shaft = new THREE.Mesh(shaftGeo, columnMat);
    shaft.position.set(0, 0.8, 0.3);
    shaft.rotation.x = Math.PI / 2;
    shaft.castShadow = true;
    group.add(shaft);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createOilDrain(position) {
    const group = new THREE.Group();

    // Tanque principal
    const tankGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 0.4;
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);

    // Tampa
    const lidGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 8);
    const lid = new THREE.Mesh(lidGeo, tankMat);
    lid.position.y = 0.85;
    lid.castShadow = true;
    group.add(lid);

    // Mangueira
    const hoseGeo = new THREE.TorusKnotGeometry(0.15, 0.03, 32, 8);
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const hose = new THREE.Mesh(hoseGeo, hoseMat);
    hose.position.set(0.4, 0.6, 0.3);
    hose.scale.set(0.5, 0.5, 0.5);
    hose.rotation.x = Math.PI / 2;
    hose.castShadow = true;
    group.add(hose);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createEngineCrane(position) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(1.5, 0.2, 2.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Coluna principal
    const columnGeo = new THREE.BoxGeometry(0.3, 2.5, 0.3);
    const column = new THREE.Mesh(columnGeo, baseMat);
    column.position.set(0, 1.35, 0);
    column.castShadow = true;
    group.add(column);

    // Braço
    const armGeo = new THREE.BoxGeometry(2.5, 0.2, 0.3);
    const arm = new THREE.Mesh(armGeo, baseMat);
    arm.position.set(1.0, 2.4, 0);
    arm.castShadow = true;
    group.add(arm);

    // Gancho
    const hookGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 16, Math.PI);
    const hook = new THREE.Mesh(hookGeo, baseMat);
    hook.position.set(2.2, 2.4, 0);
    hook.rotation.x = Math.PI / 2;
    hook.castShadow = true;
    group.add(hook);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createEngineStand(position) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(1.0, 0.2, 1.0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Coluna
    const columnGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
    const column = new THREE.Mesh(columnGeo, baseMat);
    column.position.y = 0.6;
    column.castShadow = true;
    group.add(column);

    // Plataforma giratória
    const platformGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
    const platform = new THREE.Mesh(platformGeo, baseMat);
    platform.position.y = 1.1;
    platform.castShadow = true;
    group.add(platform);

    // Braços de fixação
    const armGeo = new THREE.BoxGeometry(0.6, 0.1, 0.1);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeo, baseMat);
      arm.position.set(
        Math.cos((i * Math.PI) / 2) * 0.4,
        1.2,
        Math.sin((i * Math.PI) / 2) * 0.4,
      );
      arm.rotation.y = (i * Math.PI) / 2;
      arm.castShadow = true;
      group.add(arm);
    }

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createBatteryCharger(position) {
    const group = new THREE.Group();

    // Corpo
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Display
    const displayGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const displayMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
    });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.3, 0.21);
    group.add(display);

    // Cabos
    const cableGeo = new THREE.TorusKnotGeometry(0.1, 0.02, 16, 4);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(0.3, 0.2, 0.1);
    cable.scale.set(0.5, 0.5, 0.5);
    cable.castShadow = true;
    group.add(cable);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createWeldingMachine(position) {
    const group = new THREE.Group();

    // Corpo principal
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Bobina
    const coilGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
    const coil = new THREE.Mesh(coilGeo, bodyMat);
    coil.position.set(0.2, 0.3, -0.3);
    coil.rotation.x = Math.PI / 2;
    coil.castShadow = true;
    group.add(coil);

    // Tocha
    const torchGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
    const torch = new THREE.Mesh(torchGeo, bodyMat);
    torch.position.set(-0.2, 0.3, 0.3);
    torch.rotation.z = 0.3;
    torch.castShadow = true;
    group.add(torch);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createPaintShop(position) {
    const group = new THREE.Group();

    // Cabine de pintura
    const boothGeo = new THREE.BoxGeometry(3.0, 2.5, 3.0);
    const boothMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    const booth = new THREE.Mesh(boothGeo, boothMat);
    booth.position.y = 1.25;
    booth.castShadow = true;
    booth.receiveShadow = true;
    group.add(booth);

    // Estrutura
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const frameGeo = new THREE.BoxGeometry(0.1, 2.5, 3.0);

    const frame1 = new THREE.Mesh(frameGeo, frameMat);
    frame1.position.set(-1.5, 1.25, 0);
    frame1.castShadow = true;
    group.add(frame1);

    const frame2 = frame1.clone();
    frame2.position.set(1.5, 1.25, 0);
    group.add(frame2);

    // Pistola de pintura
    const gunGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6);
    const gun = new THREE.Mesh(gunGeo, frameMat);
    gun.position.set(0, 1.0, 1.6);
    gun.rotation.x = Math.PI / 2;
    gun.castShadow = true;
    group.add(gun);

    group.position.set(position[0], position[1], position[2]);
    this.scene.add(group);
  }

  createStorage() {
    // Prateleiras do depósito
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

    RealisticGarageConfig.equipment.warehouse.shelves.forEach((shelf) => {
      for (let level = 0; level < 4; level++) {
        const shelfGeo = new THREE.BoxGeometry(2.5, 0.1, 1.5);
        const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
        shelfMesh.position.set(
          shelf.position[0],
          0.5 + level * 1.2,
          shelf.position[2],
        );
        shelfMesh.castShadow = true;
        shelfMesh.receiveShadow = true;
        this.scene.add(shelfMesh);

        // Caixas
        if (Math.random() > 0.4) {
          const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
          const boxMat = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
          });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(
            shelf.position[0] + (Math.random() - 0.5) * 1.8,
            0.5 + level * 1.2 + 0.3,
            shelf.position[2] + (Math.random() - 0.5) * 0.8,
          );
          box.castShadow = true;
          box.receiveShadow = true;
          this.scene.add(box);
        }
      }
    });
  }

  createDetails() {
    // Pneus empilhados
    RealisticGarageConfig.equipment.tires.forEach((tire) => {
      for (let i = 0; i < tire.count; i++) {
        const tireGeo = new THREE.TorusGeometry(0.4, 0.1, 16, 32);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const tireMesh = new THREE.Mesh(tireGeo, tireMat);
        tireMesh.rotation.x = Math.PI / 2;
        tireMesh.position.set(
          tire.position[0],
          tire.position[1] + i * 0.3,
          tire.position[2] + (Math.random() - 0.5) * 0.5,
        );
        tireMesh.castShadow = true;
        tireMesh.receiveShadow = true;
        this.scene.add(tireMesh);
      }
    });

    // Ferramentas nas bancadas
    RealisticGarageConfig.equipment.tools.forEach((tool) => {
      const toolGeo = new THREE.BoxGeometry(0.1, 0.1, 0.3);
      const toolMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const toolMesh = new THREE.Mesh(toolGeo, toolMat);
      toolMesh.position.set(
        tool.position[0],
        tool.position[1],
        tool.position[2],
      );
      toolMesh.rotation.y = Math.random() * Math.PI;
      toolMesh.castShadow = true;
      this.scene.add(toolMesh);
    });

    // Posteres
    const posterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    RealisticGarageConfig.equipment.posters.forEach((poster) => {
      const posterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.0, 0.1),
        posterMat,
      );
      posterMesh.position.set(
        poster.position[0],
        poster.position[1],
        poster.position[2],
      );
      posterMesh.rotation.y = poster.rotation;
      posterMesh.castShadow = true;
      this.scene.add(posterMesh);
    });

    // Sofá da área de descanso
    const sofaGroup = new THREE.Group();

    const seatGeo = new THREE.BoxGeometry(2.0, 0.4, 0.8);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.2;
    seat.castShadow = true;
    seat.receiveShadow = true;
    sofaGroup.add(seat);

    const backGeo = new THREE.BoxGeometry(2.0, 0.8, 0.2);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 0.6, -0.4);
    back.castShadow = true;
    back.receiveShadow = true;
    sofaGroup.add(back);

    sofaGroup.position.set(-8, 0, -14);
    this.scene.add(sofaGroup);

    // Máquina de café
    const coffeeGeo = new THREE.BoxGeometry(0.4, 0.6, 0.3);
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.position.set(-6, 0.3, -14);
    coffee.castShadow = true;
    coffee.receiveShadow = true;
    this.scene.add(coffee);

    // Máquina de venda automática
    const vendingGeo = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    const vendingMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const vending = new THREE.Mesh(vendingGeo, vendingMat);
    vending.position.set(-4, 0.9, -14);
    vending.castShadow = true;
    vending.receiveShadow = true;
    this.scene.add(vending);
  }

  createParticles() {
    // Poeira no ar (partículas)
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(particles);
    this.particles.push(particles);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Animar partículas (poeira)
    if (this.particles.length > 0) {
      const positions = this.particles[0].geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.001; // Sobe lentamente
        if (positions[i] > 8) {
          positions[i] = 0;
        }
      }
      this.particles[0].geometry.attributes.position.needsUpdate = true;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
