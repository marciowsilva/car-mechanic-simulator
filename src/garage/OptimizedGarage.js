// src/garage/OptimizedGarage.js - Garagem realista com otimizações

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ===== 1. CACHE DE TEXTURAS =====
THREE.Cache.enabled = true;
// ================================

export class OptimizedGarage {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    this.currentCar = null;
    this.particles = [];
    this.equipmentSystem = null;
    this.clickableObjects = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.carLifted = false;
    this.liftHeight = 0;
    this.liftArms = []; // Braços do elevador ativo

    // Movimentação FPS
    this.moveForward = false;
    this.moveBackward = false;
    this.rotateLeft = false;
    this.rotateRight = false;
    this.eyeHeight = 1.7;
    this.cameraYaw = 0;
    this.cameraPitch = 0;
    this.maxPitch = Math.PI / 3.5;

    // Botão direito → olhar ao redor
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.dragSensitivity = 0.004;

    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLights();
    this.createGarage();
    this.setupInteraction();

    this.animate();

    this.fpsCounter = 0;
    this.lastFpsUpdate = performance.now();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, this.eyeHeight || 1.7, 10);
    this.camera.lookAt(0, this.eyeHeight || 1.7, 0);
    this.cameraYaw = 0;
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

    this.clock = new THREE.Clock();
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 30;
    this.controls.target.set(0, 1, 0);
    this.controls.enableRotate = false;
    this.controls.enableZoom = false; // zoom feito manualmente
    this.controls.enablePan = false;
  }

  setupInteraction() {
    // Botão esquerdo pressionado → iniciar arrasto
    this.renderer.domElement.addEventListener("pointerdown", (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.hasDragged = false;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.container.style.cursor = "grabbing";
      }
    });

    // Soltar botão esquerdo → parar arrasto ou disparar clique
    this.renderer.domElement.addEventListener("pointerup", (e) => {
      if (e.button === 0) {
        this.isDragging = false;
        this.container.style.cursor = "default";
        if (!this.hasDragged) this.onClick(e);
      }
    });

    // Segurança: soltar fora do canvas também para o arrasto
    window.addEventListener("pointerup", (e) => {
      if (e.button === 0) {
        this.isDragging = false;
        this.container.style.cursor = "default";
      }
    });

    // Bloquear menu de contexto do botão direito
    this.renderer.domElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Mouse move: hover de equipamentos OU rotação de câmera
    this.renderer.domElement.addEventListener("pointermove", (e) =>
      this.onMouseMove(e),
    );

    // Scroll = zoom horizontal (sem subir/descer com pitch)
    this.renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const groundForward = new THREE.Vector3(
          Math.sin(this.cameraYaw),
          0,
          -Math.cos(this.cameraYaw),
        );
        const dir = e.deltaY < 0 ? 1 : -1;
        this.camera.position.addScaledVector(groundForward, 0.5 * dir);
        this.camera.position.y = this.eyeHeight;
      },
      { passive: false },
    );

    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(event) {
    switch (event.code) {
      case "KeyW": this.moveForward = true; break;
      case "KeyS": this.moveBackward = true; break;
      case "KeyA": this.rotateLeft = true; break;
      case "KeyD": this.rotateRight = true; break;
      case "ArrowLeft":
      case "KeyQ": this.rotateLeft = true; break;
      case "ArrowRight":
      case "KeyE": this.rotateRight = true; break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW": this.moveForward = false; break;
      case "KeyS": this.moveBackward = false; break;
      case "KeyA": this.rotateLeft = false; break;
      case "KeyD": this.rotateRight = false; break;
      case "ArrowLeft":
      case "KeyQ": this.rotateLeft = false; break;
      case "ArrowRight":
      case "KeyE": this.rotateRight = false; break;
    }
  }

  updateMovement(delta) {
    const speed = 5.0;
    const rotKeySpeed = 1.8;

    // YAW pelo teclado
    if (this.rotateLeft) this.cameraYaw -= rotKeySpeed * delta;
    if (this.rotateRight) this.cameraYaw += rotKeySpeed * delta;

    // Limitar pitch
    this.cameraPitch = Math.max(
      -this.maxPitch,
      Math.min(this.maxPitch, this.cameraPitch),
    );

    // Vetor de direção 3D (yaw + pitch)
    const forward = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch),
    );

    // Direção no chão para WASD
    const groundForward = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw),
    );

    if (this.moveForward)
      this.camera.position.addScaledVector(groundForward, speed * delta);
    if (this.moveBackward)
      this.camera.position.addScaledVector(groundForward, -speed * delta);

    // Manter altura e limites
    this.camera.position.y = this.eyeHeight;
    const limit = 14;
    this.camera.position.x = Math.max(-limit, Math.min(limit, this.camera.position.x));
    this.camera.position.z = Math.max(-limit, Math.min(limit, this.camera.position.z));

    // Aplicar direção
    this.camera.lookAt(
      this.camera.position.x + forward.x,
      this.camera.position.y + forward.y,
      this.camera.position.z + forward.z,
    );
  }

  onMouseMove(event) {
    // Se arrastando → rotar câmera
    if (this.isDragging) {
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.hasDragged = true;

      this.cameraYaw -= dx * this.dragSensitivity;
      this.cameraPitch += dy * this.dragSensitivity;
      this.cameraPitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.cameraPitch));
      return;
    }

    // Hover de equipamentos (só quando não está arrastando)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const visibleObjects = this.clickableObjects.filter(obj => { let o = obj; while (o) { if (!o.visible) return false; o = o.parent; } return true; });
    const intersects = this.raycaster.intersectObjects(visibleObjects, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.equipmentId) obj = obj.parent;

      if (obj && this.hoveredObject !== obj) {
        if (this.hoveredObject) this.highlightObject(this.hoveredObject, false);
        this.hoveredObject = obj;
        this.highlightObject(this.hoveredObject, true);
        this.container.style.cursor = "pointer";
        this.showInteractionTooltip(obj.userData.equipmentId);
      }
    } else {
      if (this.hoveredObject) {
        this.highlightObject(this.hoveredObject, false);
        this.hoveredObject = null;
        this.container.style.cursor = "default";
        this.hideInteractionTooltip();
      }
    }
  }

  onClick(event) {

    if (!this.hoveredObject || !this.equipmentSystem) return;
    const eqId = this.hoveredObject.userData.equipmentId;
    console.warn(`Interagindo com: ${eqId}`);
    this.equipmentSystem.interactWithEquipment(eqId);
  }

  highlightObject(obj, active) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (active) {
          child.userData.oldEmissive = child.material.emissive?.getHex() || 0;
          child.material.emissive?.setHex(0x333300);
        } else {
          child.material.emissive?.setHex(child.userData.oldEmissive || 0);
        }
      }
    });
  }

  showInteractionTooltip(id) {
    const info = document.getElementById("interaction-info");
    if (info) {
      info.innerHTML = `Clique para usar: <b>${id.toUpperCase()}</b>`;
      info.style.display = "block";
    }
  }

  hideInteractionTooltip() {
    const info = document.getElementById("interaction-info");
    if (info) info.style.display = "none";
  }

  toggleLift() {
    this.carLifted = !this.carLifted;
    this.targetLiftHeight = this.carLifted ? 1.5 : 0;
    // Encontrar elevador do nível atual visível
    if (!this.activeLiftGroup) {
      for (const group of Object.values(this.levelGroups)) {
        if (group.visible) {
          const lift = group.children.find(c => c.userData.equipmentId === 'carLift');
          if (lift) { this.activeLiftGroup = lift; break; }
        }
      }
    }
    window.uiManager?.showNotification(
      this.carLifted ? "⬆️ Elevando veículo..." : "⬇️ Descendo veículo...",
      "info",
    );
  }

  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.25);
    this.scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.001;
    this.scene.add(mainLight);
  }

  createGarage() {
    const texLoader = new THREE.TextureLoader();

    const floorTex = texLoader.load("/src/assets/images/garage_floor_texture_concrete.png");
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(4, 4);

    const wallTex = texLoader.load("/src/assets/images/garage_wall_texture_brick_metal.png");
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(6, 2);

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.3,
      metalness: 0.1,
      bumpScale: 0.02,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x4444ff, 0x222222);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    this.scene.add(grid);

    this.wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.8,
      metalness: 0.3,
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.5), this.wallMat);
    backWall.position.set(0, 4, -15);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const sideWallGeo = new THREE.BoxGeometry(0.5, 8, 30);
    const leftWall = new THREE.Mesh(sideWallGeo, this.wallMat);
    leftWall.position.set(-15, 4, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, this.wallMat);
    rightWall.position.set(15, 4, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    );
    ceiling.position.y = 8;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

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
    this.addLift([-5, 0, -4], this.levelGroups[1]);
    this.addWorkbench([-9, 0, -9], this.levelGroups[1]);
    this.addCabinet(-10, 0xcc3333, this.levelGroups[1]);
    this.addCeilingLight([-5, 7.5, -4], 0xffffff, this.levelGroups[1]);

    this.addLift([5, 0, -4], this.levelGroups[2]);
    this.addTireMachine([-7, 0, 8], this.levelGroups[2]);
    this.addPoster(-14.7, 0xffaa00, this.levelGroups[2], "left");
    this.addCeilingLight([5, 7.5, -4], 0xffffff, this.levelGroups[2]);

    this.addLift([-5, 0, 4], this.levelGroups[3]);
    this.addWorkbench([9, 0, -9], this.levelGroups[3]);
    this.addComputerTable([14, 0, -11], this.levelGroups[3]);
    this.addCabinet(12, 0x3333cc, this.levelGroups[3]);
    this.addCeilingLight([-5, 7.5, 4], 0xccddff, this.levelGroups[3]);

    this.addLift([5, 0, 4], this.levelGroups[4]);
    this.addWorkbench([-9, 0, 9], this.levelGroups[4]);
    this.addShelf([-14, 0, 0], this.levelGroups[4]);
    this.addCeilingLight([5, 7.5, 4], 0xffeebb, this.levelGroups[4]);

    this.addWorkbench([12, 0, 12], this.levelGroups[5]);
    this.addPaintArea(this.levelGroups[5]);
    this.addPoster(14.7, 0x00ffaa, this.levelGroups[5], "right");
    this.addExtraTires(this.levelGroups[5]);
    this.addCrane(this.levelGroups[5]);
  }

  addCeilingLight(pos, color, group) {
    const lightGroup = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.15, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }),
    );
    lightGroup.add(frame);
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.05, 0.4),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1 }),
    );
    bulb.position.y = -0.08;
    lightGroup.add(bulb);
    const light = new THREE.PointLight(color, 2, 15);
    light.position.y = -0.5;
    light.castShadow = true;
    light.shadow.bias = -0.01;
    lightGroup.add(light);
    lightGroup.position.set(pos[0], pos[1], pos[2]);
    group.add(lightGroup);
  }

  addPoster(pos, color, group, side = "back") {
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2),
      new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide }),
    );
    if (side === "left") {
      poster.position.set(-14.7, 4, -5);
      poster.rotation.y = Math.PI / 2;
    } else if (side === "right") {
      poster.position.set(14.7, 4, 5);
      poster.rotation.y = -Math.PI / 2;
    } else {
      poster.position.set(pos, 4, -14.7);
    }
    group.add(poster);
  }

  addCrane(group) {
    const crane = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 }),
    );
    base.position.y = 2;
    crane.add(base);
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 }),
    );
    arm.position.set(1.5, 4, 0);
    crane.add(arm);
    crane.position.set(-12, 0, -12);
    crane.userData.equipmentId = "engineCrane";
    group.add(crane);
    if (this.clickableObjects) this.clickableObjects.push(crane);
  }

  addLift(pos, group) {
    const liftGroup = new THREE.Group();
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.7 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1a4a8a, roughness: 0.5, metalness: 0.4 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 4.4), ironMat);
    base.position.set(0, 0.05, 0);
    liftGroup.add(base);

    const colGeo = new THREE.BoxGeometry(0.4, 3, 0.4);
    const col1 = new THREE.Mesh(colGeo, blueMat);
    col1.position.set(-1.1, 1.5, -1.8);
    liftGroup.add(col1);
    const col2 = new THREE.Mesh(colGeo, blueMat);
    col2.position.set(1.1, 1.5, -1.8);
    liftGroup.add(col2);

    const armGeo = new THREE.BoxGeometry(0.15, 0.2, 1.8);
    const arms = [];
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeo, ironMat);
      arm.position.y = 0.4;
      arm.userData.baseY = 0.4;
      arm.position.x = i < 2 ? -0.8 : 0.8;
      arm.position.z = i % 2 === 0 ? 1 : -1;
      arm.rotation.y = (i % 2 === 0 ? 0.3 : -0.3) * (i < 2 ? 1 : -1);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8), rubberMat);
      pad.position.set(0, 0.1, i % 2 === 0 ? 0.8 : -0.8);
      arm.add(pad);
      liftGroup.add(arm);
      arms.push(arm);
    }

    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), blueMat);
    unit.position.set(-1.3, 1.5, -1.8);
    liftGroup.add(unit);

    liftGroup.position.set(pos[0], pos[1], pos[2]);
    liftGroup.userData.equipmentId = "carLift";
    liftGroup.userData.arms = arms;
    group.add(liftGroup);
    if (this.clickableObjects) {
      this.clickableObjects.push(liftGroup);
    } else {
      this.clickableObjects = [liftGroup];
    }
  }

  addWorkbench(pos, group) {
    const benchGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0.7 });

    const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(i < 2 ? -0.9 : 0.9, 0.4, i % 2 === 0 ? -0.4 : 0.4);
      benchGroup.add(leg);
    }

    const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), redMat);
    drawer.position.set(0, 0.5, 0);
    benchGroup.add(drawer);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), metalMat);
    handle.position.set(0, 0.5, 0.41);
    benchGroup.add(handle);

    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.1), woodMat);
    top.position.set(0, 0.87, 0);
    benchGroup.add(top);

    const vise = new THREE.Group();
    const viseBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), metalMat);
    vise.add(viseBase);
    const viseJaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), metalMat);
    viseJaw.position.y = 0.15;
    vise.add(viseJaw);
    vise.position.set(-0.8, 1, 0.3);
    benchGroup.add(vise);

    benchGroup.position.set(pos[0], pos[1], pos[2]);
    benchGroup.userData.equipmentId = "workbench";
    group.add(benchGroup);
    if (this.clickableObjects) this.clickableObjects.push(benchGroup);
  }

  addCabinet(x, color, group) {
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2, 0.8),
      new THREE.MeshStandardMaterial({ color }),
    );
    cabinet.position.set(x, 1, -11);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    group.add(cabinet);
  }

  addTireMachine(pos, group) {
    const machine = new THREE.Group();
    const greyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0044aa, roughness: 0.7 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2), blueMat);
    base.position.y = 0.5;
    machine.add(base);
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), greyMat);
    turntable.position.y = 1.05;
    machine.add(turntable);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), greyMat);
    col.position.set(0.5, 1.6, -0.5);
    machine.add(col);
    const bArm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), greyMat);
    bArm.position.set(0.1, 2.1, -0.5);
    machine.add(bArm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.1), greyMat);
    head.position.set(-0.3, 1.8, -0.5);
    machine.add(head);
    for (let i = 0; i < 3; i++) {
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.3), greyMat);
      pedal.position.set(-0.3 + i * 0.3, 0.05, 0.65);
      machine.add(pedal);
    }

    machine.position.set(pos[0], pos[1], pos[2]);
    machine.userData.equipmentId = "tireChanger";
    group.add(machine);
    if (this.clickableObjects) this.clickableObjects.push(machine);
  }

  addComputerTable(pos, group) {
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 1),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
    );
    table.position.set(pos[0], 0.4, pos[2]);
    table.userData.equipmentId = "workComputer";
    group.add(table);
    if (this.clickableObjects) this.clickableObjects.push(table);

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
      new THREE.MeshStandardMaterial({ color: 0x44ff44, transparent: true, opacity: 0.3 }),
    );
    area.position.set(8, 0.03, 8);
    area.userData.equipmentId = "paintShop";
    group.add(area);
    if (this.clickableObjects) this.clickableObjects.push(area);
  }

  addExtraTires(group) {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (let i = 0; i < 4; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 16), tireMat);
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

    const bodyGeo = new THREE.BoxGeometry(2.2, 0.6, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.1, -0.5);
    cabin.castShadow = true;
    carGroup.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[-1.0, 0.3, 1.2], [1.0, 0.3, 1.2], [-1.0, 0.3, -1.4], [1.0, 0.3, -1.4]].forEach((wp) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp[0], wp[1], wp[2]);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    carGroup.position.set(-5, 0.3, -4);
    this.currentCar = carGroup;
    this.scene.add(carGroup);
    return carGroup;
  }

  removeCar() {
    if (this.currentCar) {
      this.scene.remove(this.currentCar);
      this.currentCar = null;
    }
  }

  preloadCarModels() {
    return Promise.resolve();
  }

  createRepairEffect(position) {
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

  upgradeToLevel(level) { this.updateVisibility(level); }
  upgradeToLevel2() { this.updateVisibility(2); }
  upgradeToLevel3() { this.updateVisibility(3); }
  upgradeToLevel4() { this.updateVisibility(4); }
  upgradeToLevel5() { this.updateVisibility(5); }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.updateMovement(delta);
    this.updateParticles();

    if (this.targetLiftHeight !== undefined) {
      const step = 0.05;
      if (Math.abs(this.liftHeight - this.targetLiftHeight) > step) {
        this.liftHeight += this.targetLiftHeight > this.liftHeight ? step : -step;
        if (this.currentCar) {
          this.currentCar.position.y = this.liftHeight;
        }
        // Animar braços do elevador ativo
        if (this.activeLiftGroup) {
          const arms = this.activeLiftGroup.userData.arms || [];
          arms.forEach(arm => {
            arm.position.y = (arm.userData.baseY || 0.4) + this.liftHeight * 0.6;
          });
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== "undefined") {
  window.OptimizedGarage = OptimizedGarage;
}
