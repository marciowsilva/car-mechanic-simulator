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

  openGarageDoor() {
    if (!this.garageDoorOpen && !this.garageDoorMoving) {
      this.garageDoorMoving = true;
      this.garageDoorOpen = true;
    }
  }

  closeGarageDoor() {
    if (this.garageDoorOpen && !this.garageDoorMoving) {
      this.garageDoorMoving = true;
      this.garageDoorOpen = false;
    }
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
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.8);
    this.scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
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

    // ===== CHÃO =====
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.3, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid sutil
    const grid = new THREE.GridHelper(30, 30, 0x4444ff, 0x222222);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    this.scene.add(grid);

    // ===== MATERIAIS =====
    this.wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.3 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.4, metalness: 0.8 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.5, metalness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.3, metalness: 0.9 });
    const doorStripeMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4, metalness: 0.5, emissive: 0x332200, emissiveIntensity: 0.3 });

    // ===== PAREDES =====
    // Parede dos fundos
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.5), this.wallMat);
    backWall.position.set(0, 4, -15);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Parede esquerda
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 30), this.wallMat);
    leftWall.position.set(-15, 4, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Parede direita
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 30), this.wallMat);
    rightWall.position.set(15, 4, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Parede frontal (com abertura para porta)
    // Lado esquerdo da parede frontal
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(9, 8, 0.5), this.wallMat);
    frontWallLeft.position.set(-10.5, 4, 15);
    this.scene.add(frontWallLeft);
    // Lado direito
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(9, 8, 0.5), this.wallMat);
    frontWallRight.position.set(10.5, 4, 15);
    this.scene.add(frontWallRight);
    // Cima da porta
    const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 0.5), this.wallMat);
    frontWallTop.position.set(0, 7, 15);
    this.scene.add(frontWallTop);

    // ===== TETO com vigas =====
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), ceilingMat);
    ceiling.position.y = 8;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Vigas do teto
    for (let i = -12; i <= 12; i += 6) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 30), metalMat);
      beam.position.set(i, 7.75, 0);
      this.scene.add(beam);
    }
    // Viga transversal
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 0.4), darkMetalMat);
    crossBeam.position.set(0, 7.6, -5);
    this.scene.add(crossBeam);

    // ===== FAIXAS DE SEGURANÇA no chão =====
    const stripeGeo = new THREE.PlaneGeometry(0.3, 28);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8 });
    [-5.5, 5.5].forEach(x => {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.02, -1);
      this.scene.add(stripe);
    });

    // ===== PORTA DE GARAGEM =====
    this.garageDoor = new THREE.Group();

    // Painéis da porta (4 painéis horizontais que sobem)
    const panelMat = doorMat;
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(11.8, 1.4, 0.15), panelMat);
      panel.position.y = 0.7 + i * 1.5;
      this.garageDoor.add(panel);

      // Faixa laranja em cada painel
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.1, 0.2), doorStripeMat);
      stripe.position.y = 0.7 + i * 1.5;
      this.garageDoor.add(stripe);
    }

    // Trilhos laterais da porta
    [- 6, 6].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6.5, 0.15), darkMetalMat);
      rail.position.set(x, 3, 0);
      this.garageDoor.add(rail);
    });

    this.garageDoor.position.set(0, 0, 14.8);
    this.garageDoorTargetY = 0;    // posição Y base dos painéis
    this.garageDoorOpen = false;
    this.garageDoorMoving = false;
    this.scene.add(this.garageDoor);

    // Marco da porta
    const frameMat = darkMetalMat;
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.4, 0.4), frameMat);
    frameTop.position.set(0, 6.2, 15);
    this.scene.add(frameTop);
    [-6.2, 6.2].forEach(x => {
      const frameSide = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.5, 0.4), frameMat);
      frameSide.position.set(x, 3, 15);
      this.scene.add(frameSide);
    });

    // Rodapé metálico nas paredes
    const baseboardGeo = new THREE.BoxGeometry(30, 0.3, 0.2);
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.3 });
    const bbBack = new THREE.Mesh(baseboardGeo, baseboardMat);
    bbBack.position.set(0, 0.15, -14.8);
    this.scene.add(bbBack);
    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 30), baseboardMat);
    bbLeft.position.set(-14.8, 0.15, 0);
    this.scene.add(bbLeft);
    const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 30), baseboardMat);
    bbRight.position.set(14.8, 0.15, 0);
    this.scene.add(bbRight);

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
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.3, metalness: 0.9 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5, metalness: 0.3 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.4, metalness: 0.8 });

    // Base no chão
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 5.0), darkMat);
    base.position.set(0, 0.04, 0);
    liftGroup.add(base);

    // 4 colunas verticais nos cantos — FORA da largura do carro (X=±1.5)
    const colH = 3.5;
    const colGeo = new THREE.BoxGeometry(0.25, colH, 0.25);
    const colPositions = [[-1.45, colH/2, -2.1], [1.45, colH/2, -2.1], [-1.45, colH/2, 2.1], [1.45, colH/2, 2.1]];
    colPositions.forEach(([x, y, z]) => {
      const col = new THREE.Mesh(colGeo, steelMat);
      col.position.set(x, y, z);
      liftGroup.add(col);
      // Faixa amarela decorativa no topo de cada coluna
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.26), yellowMat);
      stripe.position.set(x, colH - 0.1, z);
      liftGroup.add(stripe);
    });

    // Travessas horizontais fixas no topo conectando as colunas (frente e trás)
    const crossGeo = new THREE.BoxGeometry(3.2, 0.2, 0.2);
    [-2.1, 2.1].forEach(z => {
      const cross = new THREE.Mesh(crossGeo, steelMat);
      cross.position.set(0, colH, z);
      liftGroup.add(cross);
    });

    // === PARTE MÓVEL: 2 vigas laterais + plataforma que sobem ===
    const movingGroup = new THREE.Group();
    movingGroup.position.y = 0;

    // 2 vigas laterais deslizantes (sobem pelas colunas)
    const railGeo = new THREE.BoxGeometry(0.2, 0.18, 4.8);
    [-1.45, 1.45].forEach(x => {
      const rail = new THREE.Mesh(railGeo, darkMat);
      rail.position.set(x, 0.09, 0);
      movingGroup.add(rail);
    });

    // Travessa central de apoio
    const centerBar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.2), steelMat);
    centerBar.position.set(0, 0.18, 0);
    movingGroup.add(centerBar);

    // 4 pads de borracha nos pontos de apoio do chassi
    const padPositions = [[-0.85, 0, -1.5], [0.85, 0, -1.5], [-0.85, 0, 1.5], [0.85, 0, 1.5]];
    padPositions.forEach(([x, y, z]) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 8), rubberMat);
      pad.position.set(x, 0.24, z);
      movingGroup.add(pad);
    });

    liftGroup.add(movingGroup);
    liftGroup.userData.movingGroup = movingGroup;

    liftGroup.position.set(pos[0], pos[1], pos[2]);
    liftGroup.userData.equipmentId = "carLift";
    liftGroup.userData.arms = [movingGroup]; // animar o grupo móvel inteiro
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

    // Cor aleatória para cada job
    const carColors = [0x2255cc, 0xcc2222, 0x22aa44, 0xddaa00, 0x888888, 0xcc5500, 0x222222, 0xffffff];
    const bodyColor = carColors[Math.floor(Math.random() * carColors.length)];

    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbcc, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 1.0 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.1, emissive: 0x332200, emissiveIntensity: 0.3 });
    const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff2200, roughness: 0.1, emissive: 0x440000, emissiveIntensity: 0.3 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.2, metalness: 0.9 });
    const underbodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // ===== CARROCERIA PRINCIPAL =====
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 4.4), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Parte traseira (porta-malas)
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 1.0), bodyMat);
    trunk.position.set(0, 1.0, 1.4);
    trunk.castShadow = true;
    carGroup.add(trunk);

    // Cabine / teto
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.5, 1.8), bodyMat);
    cabin.position.set(0, 1.28, 0.1);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Capô (levemente elevado)
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.4), bodyMat);
    hood.position.set(0, 1.0, -1.3);
    hood.castShadow = true;
    carGroup.add(hood);

    // ===== PARA-CHOQUES =====
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.2), darkMat);
    frontBumper.position.set(0, 0.45, -2.3);
    carGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.2), darkMat);
    rearBumper.position.set(0, 0.45, 2.3);
    carGroup.add(rearBumper);

    // ===== GRADES DIANTEIRAS =====
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.1), darkMat);
    grille.position.set(0, 0.55, -2.26);
    carGroup.add(grille);

    // ===== JANELAS =====
    // Pára-brisa
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.08), glassMat);
    windshield.position.set(0, 1.32, -0.85);
    windshield.rotation.x = Math.PI / 8;
    carGroup.add(windshield);

    // Vidro traseiro
    const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.08), glassMat);
    rearWindow.position.set(0, 1.28, 1.05);
    rearWindow.rotation.x = -Math.PI / 10;
    carGroup.add(rearWindow);

    // Janelas laterais
    [[-0.94, 1.32, 0.1], [0.94, 1.32, 0.1]].forEach(([x, y, z]) => {
      const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.35, 1.4), glassMat);
      sideWin.position.set(x, y, z);
      carGroup.add(sideWin);
    });

    // ===== FARÓIS DIANTEIROS =====
    [[-0.7, 0.65, -2.25], [0.7, 0.65, -2.25]].forEach(([x, y, z]) => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.1), lightMat);
      headlight.position.set(x, y, z);
      carGroup.add(headlight);

      // Aro cromado
      const ring = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.21, 0.08), chromeMat);
      ring.position.set(x, y, z - 0.02);
      carGroup.add(ring);
    });

    // ===== LANTERNAS TRASEIRAS =====
    [[-0.75, 0.75, 2.25], [0.75, 0.75, 2.25]].forEach(([x, y, z]) => {
      const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), tailLightMat);
      taillight.position.set(x, y, z);
      carGroup.add(taillight);
    });

    // ===== ESPELHOS RETROVISORES =====
    [[-1.1, 1.1, -0.4], [1.1, 1.1, -0.4]].forEach(([x, y, z]) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.22), darkMat);
      mirror.position.set(x, y, z);
      carGroup.add(mirror);
    });

    // ===== SOLEIRA (embaixo das portas) =====
    [[-1.07, 0.28, 0.0], [1.07, 0.28, 0.0]].forEach(([x, y, z]) => {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 3.6), chromeMat);
      sill.position.set(x, y, z);
      carGroup.add(sill);
    });

    // ===== CHASSI / FUNDO =====
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 4.0), underbodyMat);
    chassis.position.set(0, 0.18, 0);
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // ===== RODAS (pneu + aro) =====
    const wheelPositions = [[-1.1, 0.38, -1.4], [1.1, 0.38, -1.4], [-1.1, 0.38, 1.4], [1.1, 0.38, 1.4]];
    wheelPositions.forEach(([x, y, z]) => {
      // Pneu
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      tire.castShadow = true;
      carGroup.add(tire);

      // Aro
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      carGroup.add(rim);

      // Centro do aro
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 6), chromeMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x, y, z);
      carGroup.add(hub);

      // Parafusos do aro
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 5), darkMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(x, y + Math.sin(angle) * 0.13, z + Math.cos(angle) * 0.13);
        carGroup.add(bolt);
      }
    });

    // ===== ESCAPAMENTO =====
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.6, 0.22, 2.35);
    carGroup.add(exhaust);

    // Posição final no elevador
    this.carTargetPos = new THREE.Vector3(-5, 0, -4);

    // Abre porta e depois entra
    carGroup.position.set(-5, 0, 16);
    this.currentCar = carGroup;
    this.carEntering = false;
    this.scene.add(carGroup);

    // Resetar elevador ao receber novo carro
    this.liftHeight = 0;
    this.targetLiftHeight = 0;
    this.carLifted = false;
    this.activeLiftGroup = null;

    this.openGarageDoor();
    setTimeout(() => {
      this.carEntering = true;
      window.uiManager?.showNotification("🚗 Carro entrando na garagem...", "info");
    }, 800);

    return carGroup;
  }

  removeCar() {
    if (this.currentCar) {
      // Abrir porta, depois sair
      this.openGarageDoor();
      window.uiManager?.showNotification("🚗 Carro saindo da garagem...", "info");
      setTimeout(() => {
        this.carExiting = true;
        this.carExitTarget = 16;
      }, 800);
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
            // arm é o movingGroup — sobe diretamente
            arm.position.y = 0.1 + this.liftHeight;
          });
        }
      }
    }

    // Animação da porta de garagem
    if (this.garageDoorMoving && this.garageDoor) {
      const targetY = this.garageDoorOpen ? 6.5 : 0;
      const currentY = this.garageDoor.position.y;
      const diff = targetY - currentY;
      if (Math.abs(diff) > 0.05) {
        this.garageDoor.position.y += diff * 5 * delta;
      } else {
        this.garageDoor.position.y = targetY;
        this.garageDoorMoving = false;
      }
    }

    // Animação de entrada do carro
    if (this.carEntering && this.currentCar) {
      const target = this.carTargetPos;
      const pos = this.currentCar.position;
      const speed = 8 * delta;
      if (pos.z > target.z + 0.05) {
        pos.z -= speed;
      } else {
        pos.z = target.z;
        this.carEntering = false;
        this.closeGarageDoor();
        window.uiManager?.showNotification("✅ Carro pronto para serviço!", "success");
      }
    }

    // Animação de saída do carro
    if (this.carExiting && this.currentCar) {
      const pos = this.currentCar.position;
      const speed = 8 * delta;
      pos.z += speed;
      if (pos.z >= this.carExitTarget) {
        this.scene.remove(this.currentCar);
        this.currentCar = null;
        this.carExiting = false;
        this.liftHeight = 0;
        this.targetLiftHeight = 0;
        this.carLifted = false;
        this.activeLiftGroup = null;
        // Fecha porta após carro sair
        setTimeout(() => this.closeGarageDoor(), 300);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== "undefined") {
  window.OptimizedGarage = OptimizedGarage;
}
