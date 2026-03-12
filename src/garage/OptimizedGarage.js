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
    if (this.currentCar) this.scene.remove(this.currentCar);

    const carColors = [0x1a3a8a, 0xaa1111, 0x116622, 0xcc8800, 0x555566, 0xbb4400, 0x111111, 0xdddddd, 0x4a1a8a, 0x006688];
    const bodyColor = carColors[Math.floor(Math.random() * carColors.length)];
    const types = ['sedan', 'suv', 'muscle'];
    const carType = types[Math.floor(Math.random() * types.length)];

    const carGroup = this._buildCar(carType, bodyColor);

    this.carTargetPos = new THREE.Vector3(-5, 0, -4);
    carGroup.position.set(-5, 0, 16);
    this.currentCar = carGroup;
    this.carEntering = false;
    this.scene.add(carGroup);

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

  _buildCar(type, bodyColor) {
    const g = new THREE.Group();

    const bodyMat  = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.25, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x99ccdd, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
    const chromeMat= new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.05, metalness: 1.0 });
    const tireMat  = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 1.0 });
    const rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffee88, emissiveIntensity: 0.4, roughness: 0.1 });
    const tailMat  = new THREE.MeshStandardMaterial({ color: 0xff1100, emissive: 0x880000, emissiveIntensity: 0.4, roughness: 0.1 });
    const underbodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
    const rubberMat= new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    if (type === 'sedan') {
      this._buildSedan(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat);
    } else if (type === 'suv') {
      this._buildSUV(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat);
    } else {
      this._buildMuscle(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat);
    }

    return g;
  }

  _addWheels(g, positions, tireR, tireW, rimR, tireMat, rimMat, chromeMat, darkMat) {
    positions.forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireR, tireR, tireW, 20), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      tire.castShadow = true;
      g.add(tire);

      // Sidewall detail
      const side = new THREE.Mesh(new THREE.TorusGeometry(tireR * 0.78, tireR * 0.11, 6, 20), tireMat);
      side.rotation.y = Math.PI / 2;
      side.position.set(x > 0 ? x + tireW * 0.42 : x - tireW * 0.42, y, z);
      g.add(side);

      // Rim dish
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(rimR, rimR * 0.9, tireW * 0.6, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      g.add(rim);

      // Rim spokes
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(tireW * 0.55, rimR * 0.16, rimR * 0.16), rimMat);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.x = angle;
        spoke.position.set(x, y + Math.sin(angle) * rimR * 0.48, z + Math.cos(angle) * rimR * 0.48);
        g.add(spoke);
      }

      // Center cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, tireW * 0.65, 6), chromeMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(x, y, z);
      g.add(cap);

      // Lug nuts
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, tireW * 0.66, 5), darkMat);
        nut.rotation.z = Math.PI / 2;
        nut.position.set(x, y + Math.sin(angle) * rimR * 0.35, z + Math.cos(angle) * rimR * 0.35);
        g.add(nut);
      }
    });
  }

  _buildBodyShape(profile, width, bodyMat) {
    // Creates an extruded body from a 2D side-profile shape
    const shape = new THREE.Shape();
    profile.forEach(([px, py], i) => i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py));
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    const mesh = new THREE.Mesh(geo, bodyMat);
    mesh.rotation.y = Math.PI / 2;
    mesh.castShadow = true;
    return mesh;
  }

  _buildSedan(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat) {
    // === SILHUETA SEDAN com ExtrudeGeometry ===
    // Perfil lateral do sedã (Z, Y) — vista lateral
    const bodyProfile = [
      [-2.2, 0.38],  // frente baixo
      [-2.35, 0.6],  // nariz
      [-2.1, 0.82],  // capô frente
      [-1.3, 0.9],   // capô
      [-0.8, 1.52],  // base para-brisa
      [-0.3, 1.78],  // topo para-brisa
      [0.65, 1.82],  // teto
      [1.1, 1.72],   // teto traseiro
      [1.55, 1.42],  // base vidro traseiro
      [1.85, 0.88],  // porta-malas
      [2.2, 0.82],   // traseira alta
      [2.35, 0.55],  // traseira baixo
      [2.2, 0.38],   // traseira chão
      [-2.2, 0.38],  // fecha
    ];
    const bodyMesh = this._buildBodyShape(bodyProfile, 2.0, bodyMat);
    bodyMesh.position.set(0, 0, -1.0); // centraliza
    g.add(bodyMesh);

    // Teto separado (cor uniforme)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 1.55), bodyMat);
    roof.position.set(0, 1.83, 0.18);
    g.add(roof);

    // Para-brisa
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.72), glassMat);
    ws.position.set(0, 1.64, -0.55);
    ws.rotation.x = Math.PI / 2 - 0.9;
    g.add(ws);

    // Vidro traseiro
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.55), glassMat);
    rw.position.set(0, 1.58, 0.96);
    rw.rotation.x = -(Math.PI / 2 - 1.1);
    g.add(rw);

    // Janelas laterais (frente + trás)
    [[-1.02, 1.62, -0.18], [1.02, 1.62, -0.18]].forEach(([x, y, z]) => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.36), glassMat);
      sw.rotation.y = Math.PI / 2;
      sw.position.set(x, y, z);
      g.add(sw);
      const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), glassMat);
      sw2.rotation.y = Math.PI / 2;
      sw2.position.set(x, y, z + 0.75);
      g.add(sw2);
    });

    // Faróis LED
    [[-0.65, 0.68, -2.3], [0.65, 0.68, -2.3]].forEach(([x, y, z]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), lightMat);
      hl.position.set(x, y, z);
      g.add(hl);
      const hlr = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.06), chromeMat);
      hlr.position.set(x, y, z - 0.01);
      g.add(hlr);
      // DRL strip
      const drl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.06), lightMat);
      drl.position.set(x, y - 0.1, z);
      g.add(drl);
    });

    // Lanternas
    [[-0.68, 0.78, 2.3], [0.68, 0.78, 2.3]].forEach(([x, y, z]) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.08), tailMat);
      tl.position.set(x, y, z);
      g.add(tl);
    });

    // Para-choques
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.28, 0.18), darkMat);
    fb.position.set(0, 0.44, -2.28);
    g.add(fb);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.28, 0.18), darkMat);
    rb.position.set(0, 0.44, 2.28);
    g.add(rb);

    // Grade
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 0.08), darkMat);
    grille.position.set(0, 0.62, -2.3);
    g.add(grille);
    const gBar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.06), chromeMat);
    gBar.position.set(0, 0.62, -2.31);
    g.add(gBar);

    // Espelhos
    [[-1.06, 1.1, -0.52], [1.06, 1.1, -0.52]].forEach(([x, y, z]) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.2), darkMat);
      mir.position.set(x, y, z);
      g.add(mir);
    });

    // Soleira cromada
    [[-1.04, 0.3, 0.1], [1.04, 0.3, 0.1]].forEach(([x, y, z]) => {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 3.4), chromeMat);
      sill.position.set(x, y, z);
      g.add(sill);
    });

    // Chassi
    const ch = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 4.2), underbodyMat);
    ch.position.set(0, 0.15, 0);
    g.add(ch);

    // Escapamento duplo
    [0.45, 0.62].forEach(x => {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 8), chromeMat);
      ex.rotation.x = Math.PI / 2;
      ex.position.set(x, 0.22, 2.32);
      g.add(ex);
    });

    // Rodas
    this._addWheels(g,
      [[-1.06, 0.38, -1.38], [1.06, 0.38, -1.38], [-1.06, 0.38, 1.38], [1.06, 0.38, 1.38]],
      0.38, 0.26, 0.25, tireMat, rimMat, chromeMat, darkMat
    );
  }

  _buildSUV(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat) {
    // Perfil SUV — mais alto, mais quadrado
    const bodyProfile = [
      [-2.3, 0.44],
      [-2.45, 0.7],
      [-2.25, 0.96],
      [-1.6, 1.04],
      [-1.0, 1.72],
      [-0.5, 1.98],
      [1.5, 2.0],
      [1.85, 1.96],
      [2.1, 1.6],
      [2.35, 1.05],
      [2.45, 0.72],
      [2.3, 0.44],
    ];
    const bodyMesh = this._buildBodyShape(bodyProfile, 2.15, bodyMat);
    bodyMesh.position.set(0, 0, -1.07);
    g.add(bodyMesh);

    // Teto plano
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 2.8), bodyMat);
    roof.position.set(0, 2.0, 0.3);
    g.add(roof);

    // Rack de teto
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 2.4), darkMat);
    rack.position.set(0, 2.07, 0.28);
    g.add(rack);
    [-0.75, 0.75].forEach(x => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 2.4), darkMat);
      bar.position.set(x, 2.07, 0.28);
      g.add(bar);
    });

    // Para-brisa
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.7), glassMat);
    ws.position.set(0, 1.83, -0.52);
    ws.rotation.x = Math.PI / 2 - 1.05;
    g.add(ws);

    // Vidro traseiro vertical
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.82), glassMat);
    rw.position.set(0, 1.62, 2.1);
    rw.rotation.x = 0.12;
    g.add(rw);

    // Janelas laterais
    [[-1.09, 1.82, 0.2], [1.09, 1.82, 0.2]].forEach(([x, y, z]) => {
      [[-0.95, 0.52], [0.35, 0.52], [1.3, 0.42]].forEach(([dz, wz]) => {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(wz, 0.38), glassMat);
        sw.rotation.y = Math.PI / 2;
        sw.position.set(x, y, z + dz);
        g.add(sw);
      });
    });

    // Faróis grandes
    [[-0.72, 0.78, -2.42], [0.72, 0.78, -2.42]].forEach(([x, y, z]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.08), lightMat);
      hl.position.set(x, y, z);
      g.add(hl);
      const hlr = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.24, 0.06), chromeMat);
      hlr.position.set(x, y, z - 0.01);
      g.add(hlr);
    });

    // Lanternas verticais
    [[-0.76, 0.95, 2.42], [0.76, 0.95, 2.42]].forEach(([x, y, z]) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.08), tailMat);
      tl.position.set(x, y, z);
      g.add(tl);
    });

    // Para-choques robustos com skid plate
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.35, 0.22), darkMat);
    fb.position.set(0, 0.48, -2.42);
    g.add(fb);
    const skid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.16), chromeMat);
    skid.position.set(0, 0.3, -2.43);
    g.add(skid);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.35, 0.22), darkMat);
    rb.position.set(0, 0.48, 2.42);
    g.add(rb);
    const rSkid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.16), chromeMat);
    rSkid.position.set(0, 0.3, 2.43);
    g.add(rSkid);

    // Grade com barras horizontais
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 0.08), darkMat);
    grille.position.set(0, 0.78, -2.44);
    g.add(grille);
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.06), chromeMat);
      bar.position.set(0, 0.66 + i * 0.08, -2.45);
      g.add(bar);
    }

    // Espelhos grandes
    [[-1.12, 1.25, -0.48], [1.12, 1.25, -0.48]].forEach(([x, y, z]) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.26), darkMat);
      mir.position.set(x, y, z);
      g.add(mir);
    });

    // Soleira larga
    [[-1.1, 0.34, 0.2], [1.1, 0.34, 0.2]].forEach(([x, y, z]) => {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 4.2), darkMat);
      sill.position.set(x, y, z);
      g.add(sill);
    });

    // Chassi alto
    const ch = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 4.6), underbodyMat);
    ch.position.set(0, 0.2, 0);
    g.add(ch);

    // Escapamento central
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.25, 8), chromeMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(0.5, 0.25, 2.45);
    g.add(ex);

    // Rodas grandes
    this._addWheels(g,
      [[-1.1, 0.44, -1.52], [1.1, 0.44, -1.52], [-1.1, 0.44, 1.52], [1.1, 0.44, 1.52]],
      0.44, 0.3, 0.3, tireMat, rimMat, chromeMat, darkMat
    );
  }

  _buildMuscle(g, bodyMat, glassMat, darkMat, chromeMat, lightMat, tailMat, tireMat, rimMat, underbodyMat, rubberMat) {
    // Muscle car — capô longo, traseira quadrada, postura baixa
    const bodyProfile = [
      [-2.5, 0.35],
      [-2.65, 0.52],
      [-2.45, 0.78],
      [-1.55, 0.85],
      [-0.85, 1.45],
      [-0.25, 1.68],
      [0.85, 1.7],
      [1.2, 1.62],
      [1.65, 1.22],
      [1.95, 0.85],
      [2.35, 0.82],
      [2.5, 0.55],
      [2.35, 0.35],
    ];
    const bodyMesh = this._buildBodyShape(bodyProfile, 1.95, bodyMat);
    bodyMesh.position.set(0, 0, -0.98);
    g.add(bodyMesh);

    // Capô com scoop
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.8), bodyMat);
    hood.position.set(0, 0.86, -1.4);
    g.add(hood);
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.9), bodyMat);
    scoop.position.set(0, 0.94, -1.4);
    g.add(scoop);
    const scoopMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.75), darkMat);
    scoopMesh.position.set(0, 0.99, -1.4);
    g.add(scoopMesh);

    // Teto
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.4), bodyMat);
    roof.position.set(0, 1.7, 0.1);
    g.add(roof);

    // Para-brisa inclinado
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.65), glassMat);
    ws.position.set(0, 1.56, -0.58);
    ws.rotation.x = Math.PI / 2 - 0.85;
    g.add(ws);

    // Vidro traseiro
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.52), glassMat);
    rw.position.set(0, 1.48, 0.85);
    rw.rotation.x = -(Math.PI / 2 - 0.95);
    g.add(rw);

    // Janelas laterais
    [[-0.99, 1.56, -0.06], [0.99, 1.56, -0.06]].forEach(([x, y, z]) => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.32), glassMat);
      sw.rotation.y = Math.PI / 2;
      sw.position.set(x, y, z);
      g.add(sw);
      const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.3), glassMat);
      sw2.rotation.y = Math.PI / 2;
      sw2.position.set(x, y, z + 0.7);
      g.add(sw2);
    });

    // Faróis retangulares clássicos
    [[-0.62, 0.62, -2.6], [0.62, 0.62, -2.6]].forEach(([x, y, z]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.08), lightMat);
      hl.position.set(x, y, z);
      g.add(hl);
      const hlr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.06), chromeMat);
      hlr.position.set(x, y, z - 0.01);
      g.add(hlr);
    });

    // Lanternas traseiras grandes
    [[-0.65, 0.65, 2.45], [0.65, 0.65, 2.45]].forEach(([x, y, z]) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.08), tailMat);
      tl.position.set(x, y, z);
      g.add(tl);
    });

    // Para-choques cromados muscle
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 0.16), chromeMat);
    fb.position.set(0, 0.38, -2.6);
    g.add(fb);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 0.16), chromeMat);
    rb.position.set(0, 0.38, 2.45);
    g.add(rb);

    // Grade muscle (vertical slats)
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.08), darkMat);
    grille.position.set(0, 0.58, -2.6);
    g.add(grille);
    for (let i = 0; i < 7; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.06), chromeMat);
      slat.position.set(-0.66 + i * 0.22, 0.58, -2.61);
      g.add(slat);
    }

    // Spoiler traseiro
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.35), bodyMat);
    spoiler.position.set(0, 0.96, 2.28);
    g.add(spoiler);
    [-0.75, 0.75].forEach(x => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), bodyMat);
      leg.position.set(x, 0.82, 2.28);
      g.add(leg);
    });

    // Espelhos
    [[-1.02, 1.06, -0.5], [1.02, 1.06, -0.5]].forEach(([x, y, z]) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.22), darkMat);
      mir.position.set(x, y, z);
      g.add(mir);
    });

    // Soleira
    [[-0.99, 0.28, 0.1], [0.99, 0.28, 0.1]].forEach(([x, y, z]) => {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 3.6), darkMat);
      sill.position.set(x, y, z);
      g.add(sill);
    });

    // Chassi baixo
    const ch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 4.8), underbodyMat);
    ch.position.set(0, 0.14, 0);
    g.add(ch);

    // Escapamento duplo quad
    [[-0.45, -0.28], [0.28, 0.45]].forEach(pair => {
      pair.forEach(x => {
        const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.28, 8), chromeMat);
        ex.rotation.x = Math.PI / 2;
        ex.position.set(x, 0.28, 2.46);
        g.add(ex);
      });
    });

    // Rodas largas traseiras
    this._addWheels(g,
      [[-1.02, 0.36, -1.55], [1.02, 0.36, -1.55], [-1.08, 0.38, 1.55], [1.08, 0.38, 1.55]],
      0.38, 0.3, 0.26, tireMat, rimMat, chromeMat, darkMat
    );
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
