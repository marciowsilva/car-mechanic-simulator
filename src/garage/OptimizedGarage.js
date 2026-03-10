// src/garage/OptimizedGarage.js
// CORREÇÃO: cada grupo de nível contém APENAS itens novos daquele nível.
// Ao expandir a garagem, nenhum equipamento é duplicado.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

THREE.Cache.enabled = true;

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
    this.moveForward = false;
    this.moveBackward = false;
    this.rotateLeft = false;
    this.rotateRight = false;
    this.eyeHeight = 1.7;
    this.cameraYaw = 0;
    this.cameraPitch = 0;
    this.maxPitch = Math.PI / 3.5;
    this.mouseRotationEnabled = JSON.parse(
      localStorage.getItem("garage_mouseRotation") ?? "true",
    );
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLights();
    this.createGarage();
    this.setupInteraction();
    this.animate();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, this.eyeHeight, 10);
    this.camera.lookAt(0, this.eyeHeight, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);
    this.clock = new THREE.Clock();
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.target.set(0, 1, 0);
    this.controls.enableRotate = false;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
  }

  setupInteraction() {
    this.renderer.domElement.addEventListener("click", (e) => this.onClick(e));
    this.renderer.domElement.addEventListener("mousemove", (e) =>
      this.onMouseMove(e),
    );
    this.renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const d = new THREE.Vector3();
        this.camera.getWorldDirection(d);
        this.camera.position.addScaledVector(d, -e.deltaY * 0.04);
        this.camera.position.y = this.eyeHeight;
      },
      { passive: false },
    );
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    if (e.code === "KeyW") this.moveForward = true;
    if (e.code === "KeyS") this.moveBackward = true;
    if (e.code === "KeyA" || e.code === "ArrowLeft" || e.code === "KeyQ")
      this.rotateLeft = true;
    if (e.code === "KeyD" || e.code === "ArrowRight" || e.code === "KeyE")
      this.rotateRight = true;
  }
  onKeyUp(e) {
    if (e.code === "KeyW") this.moveForward = false;
    if (e.code === "KeyS") this.moveBackward = false;
    if (e.code === "KeyA" || e.code === "ArrowLeft" || e.code === "KeyQ")
      this.rotateLeft = false;
    if (e.code === "KeyD" || e.code === "ArrowRight" || e.code === "KeyE")
      this.rotateRight = false;
  }

  updateMovement(delta) {
    const speed = 5.0,
      rotKey = 1.8,
      rotMouse = 5.0,
      pitchSpeed = 1.5;
    if (this.rotateLeft) this.cameraYaw -= rotKey * delta;
    if (this.rotateRight) this.cameraYaw += rotKey * delta;
    if (this.mouseRotationEnabled) {
      const tx = 0.4;
      if (this.mouse.x > tx)
        this.cameraYaw += rotMouse * ((this.mouse.x - tx) / (1 - tx)) * delta;
      else if (this.mouse.x < -tx)
        this.cameraYaw -=
          rotMouse * ((Math.abs(this.mouse.x) - tx) / (1 - tx)) * delta;
    }
    const ty = 0.4;
    if (this.mouse.y > ty)
      this.cameraPitch += pitchSpeed * ((this.mouse.y - ty) / (1 - ty)) * delta;
    else if (this.mouse.y < -ty)
      this.cameraPitch -=
        pitchSpeed * ((Math.abs(this.mouse.y) - ty) / (1 - ty)) * delta;
    this.cameraPitch = Math.max(
      -this.maxPitch,
      Math.min(this.maxPitch, this.cameraPitch),
    );
    const fw = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch),
    );
    const gfw = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw),
    );
    if (this.moveForward)
      this.camera.position.addScaledVector(gfw, speed * delta);
    if (this.moveBackward)
      this.camera.position.addScaledVector(gfw, -speed * delta);
    this.camera.position.y = this.eyeHeight;
    const lim = 14;
    this.camera.position.x = Math.max(
      -lim,
      Math.min(lim, this.camera.position.x),
    );
    this.camera.position.z = Math.max(
      -lim,
      Math.min(lim, this.camera.position.z),
    );
    this.camera.lookAt(
      this.camera.position.x + fw.x,
      this.camera.position.y + fw.y,
      this.camera.position.z + fw.z,
    );
  }

  toggleMouseRotation() {
    this.mouseRotationEnabled = !this.mouseRotationEnabled;
    localStorage.setItem(
      "garage_mouseRotation",
      JSON.stringify(this.mouseRotationEnabled),
    );
    window.uiManager?.showNotification(
      `🖱️ Mouse horizontal: ${this.mouseRotationEnabled ? "Ligado" : "Desligado"}`,
      "info",
    );
    const btn = document.getElementById("btn-mouse-rotation");
    if (btn) {
      btn.classList.toggle("active", this.mouseRotationEnabled);
      btn.textContent = `🖱️ Mouse Horizontal: ${this.mouseRotationEnabled ? "ON" : "OFF"}`;
    }
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableObjects, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.equipmentId) obj = obj.parent;
      if (obj && this.hoveredObject !== obj) {
        if (this.hoveredObject) this.highlightObject(this.hoveredObject, false);
        this.hoveredObject = obj;
        this.highlightObject(obj, true);
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

  onClick() {
    if (!this.hoveredObject || !this.equipmentSystem) return;
    this.equipmentSystem.interactWithEquipment(
      this.hoveredObject.userData.equipmentId,
    );
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
    const el = document.getElementById("interaction-info");
    if (el) {
      el.innerHTML = `Clique para usar: <b>${id.toUpperCase()}</b>`;
      el.style.display = "block";
    }
  }
  hideInteractionTooltip() {
    const el = document.getElementById("interaction-info");
    if (el) el.style.display = "none";
  }

  toggleLift() {
    this.carLifted = !this.carLifted;
    this.targetLiftHeight = this.carLifted ? 1.5 : 0;
    window.uiManager?.showNotification(
      this.carLifted ? "⬆️ Elevando veículo..." : "⬇️ Descendo veículo...",
      "info",
    );
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xddeeff, 0x223322, 0.3));
    const main = new THREE.DirectionalLight(0xfff5e0, 0.6);
    main.position.set(8, 18, 12);
    main.castShadow = true;
    main.shadow.mapSize.width = main.shadow.mapSize.height = 2048;
    main.shadow.camera.left = -20;
    main.shadow.camera.right = 20;
    main.shadow.camera.top = 20;
    main.shadow.camera.bottom = -20;
    main.shadow.camera.far = 60;
    main.shadow.bias = -0.001;
    this.scene.add(main);
    const fill = new THREE.DirectionalLight(0xaaccff, 0.2);
    fill.position.set(-10, 10, -5);
    this.scene.add(fill);
  }

  createGarage() {
    // Chão
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: 0x6b6b5f,
        roughness: 0.92,
        metalness: 0.05,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Linhas no chão
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xf0c040,
      roughness: 1.0,
    });
    [
      [-2.5, 0],
      [2.5, 0],
      [-7.5, 0],
      [7.5, 0],
    ].forEach(([x, z]) => {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 9), lineMat);
      l.rotation.x = -Math.PI / 2;
      l.position.set(x, 0.01, z);
      this.scene.add(l);
    });

    // Paredes
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xc8c0a8,
      roughness: 0.9,
    });
    const bw = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.4), wallMat);
    bw.position.set(0, 4, -15);
    this.scene.add(bw);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1a4a7a, roughness: 0.8 }),
    );
    stripe.position.set(0, 1.5, -14.78);
    this.scene.add(stripe);
    const bb = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.3, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 }),
    );
    bb.position.set(0, 0.15, -14.8);
    this.scene.add(bb);
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 30), wallMat);
    lw.position.set(-15, 4, 0);
    this.scene.add(lw);
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 30), wallMat);
    rw.position.set(15, 4, 0);
    this.scene.add(rw);
    [-15, 15].forEach((x, i) => {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.2, 30),
        new THREE.MeshStandardMaterial({ color: 0x1a4a7a, roughness: 0.8 }),
      );
      s.position.set(x + (i === 0 ? 0.22 : -0.22), 1.5, 0);
      this.scene.add(s);
    });

    // Teto
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 1.0 }),
    );
    ceil.position.y = 8;
    ceil.rotation.x = Math.PI / 2;
    this.scene.add(ceil);

    // Vigas
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.5,
    });
    [-8, -3, 2, 7].forEach((z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 0.2), beamMat);
      b.position.set(0, 7.8, z);
      this.scene.add(b);
    });

    // Pilares
    const pMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
      metalness: 0.4,
    });
    [
      [-10, -10],
      [10, -10],
      [-10, 5],
      [10, 5],
    ].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 0.4), pMat);
      p.position.set(x, 4, z);
      this.scene.add(p);
      const pb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), beamMat);
      pb.position.set(x, 0.07, z);
      this.scene.add(pb);
    });

    this.addGarageDoor();

    // =====================================================
    // GRUPOS DE NÍVEL: cada grupo contém APENAS itens NOVOS
    // Nenhum equipamento se repete entre grupos diferentes
    // =====================================================
    this.levelGroups = {
      1: new THREE.Group(),
      2: new THREE.Group(),
      3: new THREE.Group(),
      4: new THREE.Group(),
      5: new THREE.Group(),
    };
    Object.values(this.levelGroups).forEach((g) => this.scene.add(g));
    this.setupLevelContent();
    this.updateVisibility(1);
  }

  addGarageDoor() {
    const dm = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.6,
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.15), dm);
    door.position.set(0, 2.5, 14.9);
    this.scene.add(door);
    const rm = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.7,
    });
    for (let i = 0; i < 10; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 0.05), rm);
      r.position.set(0, 0.5 + i * 0.45, 15.0);
      this.scene.add(r);
    }
    const rlm = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8,
    });
    [-3.1, 3.1].forEach((x) => {
      const rl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6, 0.15), rlm);
      rl.position.set(x, 3, 14.9);
      this.scene.add(rl);
    });
  }

  // =====================================================
  // Cada posição é única. Nenhum tipo de equipamento aparece
  // em dois grupos diferentes na mesma posição.
  //
  // NÍV1: elevador#1, bancada#1, armário vermelho, extintor, luz
  // NÍV2: elevador#2, máq.pneus, tambores, poster, luz
  // NÍV3: elevador#3, bancada#2, computador, armário azul, prateleira esq, luz
  // NÍV4: elevador#4, bancada#3, balanceadora, prateleira dir, compressor, luz
  // NÍV5: cabine pintura, guindaste, bancada#4, pneus extras, luz
  // =====================================================
  setupLevelContent() {
    const g1 = this.levelGroups[1];
    this.addLift([-5, 0, -4], g1);
    this.addWorkbench([-11, 0, -9], g1);
    this.addToolCabinet(-11, -12, 0xcc3333, g1);
    this.addCeilingLight([-5, 7.5, -4], 0xffffdd, g1);
    this.addFireExtinguisher(-14.5, 0, 9, g1);

    const g2 = this.levelGroups[2];
    this.addLift([5, 0, -4], g2);
    this.addTireMachine([-7, 0, 8], g2);
    this.addOilDrums([10, 0, 9], g2);
    this.addCeilingLight([5, 7.5, -4], 0xffffdd, g2);
    this.addWallPoster(-14.7, 3, -5, "left", g2);

    const g3 = this.levelGroups[3];
    this.addLift([-5, 0, 4], g3);
    this.addWorkbench([11, 0, -9], g3);
    this.addDiagnosticComputer([11, 0, -12], g3);
    this.addToolCabinet(11, -6, 0x1a4a8a, g3);
    this.addPartsShelf([-14, 0, 0], g3);
    this.addCeilingLight([-5, 7.5, 4], 0xccddff, g3);

    const g4 = this.levelGroups[4];
    this.addLift([5, 0, 4], g4);
    this.addWorkbench([-11, 0, 9], g4);
    this.addBalancingMachine([7, 0, 9], g4);
    this.addPartsShelf([14, 0, 0], g4);
    this.addAirCompressor([-12, 0, 6], g4);
    this.addCeilingLight([5, 7.5, 4], 0xffeebb, g4);

    const g5 = this.levelGroups[5];
    this.addPaintBooth(g5);
    this.addCrane(g5);
    this.addWorkbench([11, 0, 9], g5);
    this.addExtraTires(g5);
    this.addCeilingLight([0, 7.5, 8], 0xffffdd, g5);
  }

  // Mostra grupos 1..level, oculta o resto. Sem recriar nada.
  updateVisibility(level) {
    this.currentLevel = level;
    for (let i = 1; i <= 5; i++) {
      if (this.levelGroups[i]) this.levelGroups[i].visible = i <= level;
    }
  }

  // ── helpers de material ──────────────────────────────────
  _mat(color, roughness = 0.5, metalness = 0.5) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  // ── Elevador ─────────────────────────────────────────────
  addLift(pos, group) {
    const g = new THREE.Group();
    const steel = this._mat(0x555560, 0.4, 0.85),
      blue = this._mat(0x1a3a6a, 0.5, 0.6),
      yellow = this._mat(0xf0c040, 0.5, 0.3),
      rubber = this._mat(0x1a1a1a, 1.0, 0),
      chrome = this._mat(0xcccccc, 0.2, 1.0);

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 5.0), steel);
    base.position.set(0, 0.04, 0);
    g.add(base);
    [-1.25, 1.25].forEach((x) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 5.0), yellow);
      r.position.set(x, 0.1, 0);
      g.add(r);
    });
    [-1.1, 1.1].forEach((x) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), blue);
      c.position.set(x, 1.65, -2.2);
      c.castShadow = true;
      g.add(c);
      const gu = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.06), chrome);
      gu.position.set(x, 1.6, -2.2);
      g.add(gu);
    });
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.35), blue);
    cb.position.set(-1.4, 0.5, -2.2);
    g.add(cb);
    const hs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8),
      this._mat(0x222222, 0.9, 0),
    );
    hs.position.set(-1.3, 0.95, -2.2);
    hs.rotation.z = 0.3;
    g.add(hs);
    [
      { x: -0.85, z: 1.6, ry: 0.15 },
      { x: 0.85, z: 1.6, ry: -0.15 },
      { x: -0.85, z: -1.2, ry: -0.1 },
      { x: 0.85, z: -1.2, ry: 0.1 },
    ].forEach((cfg) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 1.9), steel);
      arm.position.set(cfg.x, 0.42, cfg.z);
      arm.rotation.y = cfg.ry;
      g.add(arm);
      const sn = cfg.z > 0 ? 1 : -1;
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.11, 0.1, 10),
        rubber,
      );
      pad.position.set(
        cfg.x + Math.sin(cfg.ry) * 0.9 * sn,
        0.49,
        cfg.z + Math.cos(cfg.ry) * 0.9 * sn,
      );
      g.add(pad);
    });
    const wp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.02), yellow);
    wp.position.set(0, 0.25, -2.15);
    g.add(wp);
    g.position.set(pos[0], pos[1], pos[2]);
    g.userData.equipmentId = "carLift";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Bancada ───────────────────────────────────────────────
  addWorkbench(pos, group) {
    const g = new THREE.Group();
    const steel = this._mat(0x444444, 0.4, 0.85),
      top = this._mat(0x2a2a2a, 0.6, 0.5),
      red = this._mat(0x991111, 0.6, 0),
      chrome = this._mat(0xbbbbbb, 0.2, 1.0),
      rubber = this._mat(0x1a1a1a, 1.0, 0);

    [
      [-0.95, -0.45],
      [-0.95, 0.45],
      [0.95, -0.45],
      [0.95, 0.45],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.85, 0.08),
        steel,
      );
      leg.position.set(x, 0.42, z);
      g.add(leg);
      const ft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8),
        rubber,
      );
      ft.position.set(x, 0.02, z);
      g.add(ft);
    });
    const db = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 0.92), red);
    db.position.set(0, 0.48, 0);
    g.add(db);
    [0.6, 0.35, 0.1].forEach((y) => {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.02, 0.88), steel);
      sp.position.set(0, y, 0);
      g.add(sp);
      const hd = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.04, 0.04),
        chrome,
      );
      hd.position.set(0, y + 0.09, 0.47);
      g.add(hd);
    });
    const tp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.05), top);
    tp.position.set(0, 0.92, 0);
    g.add(tp);
    const bs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.05), steel);
    bs.position.set(0, 1.2, -0.5);
    g.add(bs);
    const vb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.32), steel);
    vb.position.set(-0.85, 1.0, 0.35);
    g.add(vb);
    const vj = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.08), steel);
    vj.position.set(-0.85, 1.03, 0.5);
    g.add(vj);
    const vs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      chrome,
    );
    vs.rotation.x = Math.PI / 2;
    vs.position.set(-0.85, 1.0, 0.4);
    g.add(vs);

    g.position.set(pos[0], pos[1], pos[2]);
    g.userData.equipmentId = "workbench";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Armário ───────────────────────────────────────────────
  addToolCabinet(x, z, color, group) {
    const g = new THREE.Group();
    const body = this._mat(color, 0.5, 0.5),
      dark = this._mat(0x111111, 0.6, 0.4),
      chrome = this._mat(0xcccccc, 0.2, 1.0);
    const bd = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.6), body);
    bd.position.y = 0.9;
    bd.castShadow = true;
    g.add(bd);
    for (let i = 0; i < 7; i++) {
      const dh = i < 3 ? 0.18 : 0.25,
        dy = 0.15 + i * (i < 3 ? 0.19 : 0.26);
      const dr = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, dh - 0.02, 0.55),
        body,
      );
      dr.position.set(0, dy, 0.01);
      g.add(dr);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.04), chrome);
      hd.position.set(0, dy + dh / 2 - 0.04, 0.3);
      g.add(hd);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.02, 0.58), dark);
      sp.position.set(0, dy + dh / 2, 0);
      g.add(sp);
    }
    const tc = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.65), dark);
    tc.position.y = 1.83;
    g.add(tc);
    const rm = this._mat(0x333333, 0.8, 0);
    [
      [-0.4, -0.22],
      [0.4, -0.22],
      [-0.4, 0.22],
      [0.4, 0.22],
    ].forEach(([rx, rz]) => {
      const r = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8),
        rm,
      );
      r.position.set(rx, 0.04, rz);
      g.add(r);
    });
    g.position.set(x, 0, z);
    group.add(g);
  }

  // ── Luz de teto ───────────────────────────────────────────
  addCeilingLight(pos, color, group) {
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.18, 0.55),
        this._mat(0x1a1a1a, 0.8, 0.6),
      ),
    );
    const rf = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.04, 0.45),
      this._mat(0xddddcc, 0.3, 0.5),
    );
    rf.position.y = -0.07;
    g.add(rf);
    const tb = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.05, 0.35),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.5,
      }),
    );
    tb.position.y = -0.09;
    g.add(tb);
    const cm = this._mat(0x555555, 0.5, 0.8);
    [-0.9, 0.9].forEach((cx) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), cm);
      c.position.set(cx, 0.24, 0);
      g.add(c);
    });
    const lt = new THREE.PointLight(color, 2.5, 18);
    lt.position.y = -0.5;
    g.add(lt);
    g.position.set(pos[0], pos[1], pos[2]);
    group.add(g);
  }

  // ── Máquina de pneus ─────────────────────────────────────
  addTireMachine(pos, group) {
    const g = new THREE.Group();
    const blue = this._mat(0x1144aa, 0.5, 0.5),
      steel = this._mat(0x555555, 0.4, 0.8),
      chrome = this._mat(0xaaaaaa, 0.2, 1.0),
      rubber = this._mat(0x111111, 1.0, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.05, 1.3), blue);
    base.position.y = 0.52;
    g.add(base);
    const tt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24),
      steel,
    );
    tt.position.y = 1.1;
    g.add(tt);
    const cn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.06, 0.2, 12),
      chrome,
    );
    cn.position.y = 1.25;
    g.add(cn);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const j = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), steel);
      j.position.set(Math.cos(a) * 0.35, 1.2, Math.sin(a) * 0.35);
      g.add(j);
    }
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 0.22), steel);
    col.position.set(0.45, 1.8, -0.5);
    g.add(col);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.16), steel);
    arm.position.set(0, 2.35, -0.5);
    g.add(arm);
    const hd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.04, 0.55, 8),
      chrome,
    );
    hd.rotation.x = Math.PI / 2;
    hd.position.set(-0.4, 2.35, -0.42);
    g.add(hd);
    const pm = this._mat(0x222222, 0.8, 0);
    [
      [-0.3, 0.65],
      [0, 0.65],
      [0.3, 0.65],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.32), pm);
      p.position.set(px, 0.025, pz);
      g.add(p);
      const pt = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.01, 0.28),
        rubber,
      );
      pt.position.set(px, 0.055, pz);
      g.add(pt);
    });
    g.position.set(pos[0], pos[1], pos[2]);
    g.userData.equipmentId = "tireChanger";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Prateleira ────────────────────────────────────────────
  addPartsShelf(pos, group) {
    const g = new THREE.Group();
    const fm = this._mat(0x888888, 0.5, 0.7),
      bm = this._mat(0x4a3520, 0.9, 0),
      b1 = this._mat(0x336699, 0.8, 0),
      b2 = this._mat(0x993333, 0.8, 0);
    const W = 3.2,
      D = 0.85,
      H = 4.0,
      L = 5;
    [-(W / 2 - 0.04), W / 2 - 0.04, 0].forEach((x) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, H, 0.07), fm);
      p.position.set(x, H / 2, 0);
      g.add(p);
    });
    for (let i = 0; i < L; i++) {
      const y = 0.3 + i * 0.75;
      const sh = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, D), bm);
      sh.position.set(0, y, 0);
      g.add(sh);
      [-(W / 2) + 0.1, W / 2 - 0.1].forEach((bx) => {
        const br = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.3, D * 0.9),
          fm,
        );
        br.position.set(bx, y - 0.15, 0);
        g.add(br);
      });
      if (i % 2 === 0) {
        for (let b = 0; b < 5; b++) {
          const bx = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.3, 0.4),
            b % 2 === 0 ? b1 : b2,
          );
          bx.position.set(-1.2 + b * 0.6, y + 0.18, 0.1);
          g.add(bx);
        }
      }
    }
    g.position.set(pos[0], pos[1], pos[2]);
    g.rotation.y = pos[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(g);
  }

  // ── Computador diagnóstico ────────────────────────────────
  addDiagnosticComputer(pos, group) {
    const g = new THREE.Group();
    const desk = this._mat(0x2a2a2a, 0.6, 0.5),
      black = this._mat(0x111111, 0.8, 0),
      white = this._mat(0xdddddd, 0.7, 0);
    const screenOn = new THREE.MeshStandardMaterial({
      color: 0x0044ff,
      emissive: 0x002288,
      emissiveIntensity: 1.5,
    });
    const scanMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x00aa44,
      emissiveIntensity: 1,
    });
    const dk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.85), desk);
    dk.position.y = 0.45;
    g.add(dk);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), black);
    st.position.set(0, 1.05, -0.1);
    g.add(st);
    const mf = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.06), black);
    mf.position.set(0, 1.45, -0.1);
    g.add(mf);
    const sc = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.54, 0.02),
      screenOn,
    );
    sc.position.set(0, 1.45, -0.07);
    g.add(sc);
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.28), black);
    kb.position.set(0, 0.93, 0.1);
    g.add(kb);
    const ms = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.14), white);
    ms.position.set(0.45, 0.93, 0.1);
    g.add(ms);
    const sn = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.38, 0.03), black);
    sn.position.set(-0.55, 0.98, 0);
    sn.rotation.z = 0.2;
    g.add(sn);
    const sd = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.01), scanMat);
    sd.position.set(-0.55, 0.98, 0.02);
    sd.rotation.z = 0.2;
    g.add(sd);
    g.position.set(pos[0], pos[1], pos[2]);
    g.userData.equipmentId = "workComputer";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Balanceadora ──────────────────────────────────────────
  addBalancingMachine(pos, group) {
    const g = new THREE.Group();
    const body = this._mat(0xcc3300, 0.5, 0.4),
      steel = this._mat(0x666666, 0.4, 0.8);
    const scrn = new THREE.MeshStandardMaterial({
      color: 0x001122,
      emissive: 0x002244,
      emissiveIntensity: 1,
    });
    const bd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.0), body);
    bd.position.y = 0.6;
    g.add(bd);
    const sh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12),
      steel,
    );
    sh.rotation.z = Math.PI / 2;
    sh.position.set(-0.2, 1.1, 0);
    g.add(sh);
    const cn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.02, 0.3, 12),
      steel,
    );
    cn.rotation.z = -Math.PI / 2;
    cn.position.set(-0.7, 1.1, 0);
    g.add(cn);
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.05), scrn);
    dp.position.set(0.1, 1.0, 0.53);
    g.add(dp);
    g.position.set(pos[0], pos[1], pos[2]);
    g.userData.equipmentId = "balancingMachine";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Compressor ────────────────────────────────────────────
  addAirCompressor(pos, group) {
    const g = new THREE.Group();
    const body = this._mat(0xcc4400, 0.4, 0.5),
      tank = this._mat(0x888888, 0.3, 0.8),
      blk = this._mat(0x111111, 0.8, 0);
    const tk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 1.3, 16),
      tank,
    );
    tk.rotation.z = Math.PI / 2;
    tk.position.set(0, 0.45, 0);
    g.add(tk);
    [
      [-0.5, -0.2],
      [0.5, -0.2],
      [-0.5, 0.2],
      [0.5, 0.2],
    ].forEach(([lx, lz]) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), blk);
      l.position.set(lx, 0.15, lz);
      g.add(l);
    });
    const mt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), body);
    mt.position.set(-0.2, 0.97, 0);
    g.add(mt);
    g.position.set(pos[0], pos[1], pos[2]);
    group.add(g);
  }

  // ── Cabine de pintura ─────────────────────────────────────
  addPaintBooth(group) {
    const g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const frame = this._mat(0x444444, 0.5, 0.7);
    const floor = new THREE.MeshStandardMaterial({
      color: 0xf0c040,
      roughness: 0.9,
      transparent: true,
      opacity: 0.4,
    });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), floor);
    fp.rotation.x = -Math.PI / 2;
    fp.position.set(0, 0.01, 0);
    g.add(fp);
    [
      { s: [7, 4.5, 0.05], p: [0, 2.25, 3.5] },
      { s: [7, 4.5, 0.05], p: [0, 2.25, -3.5] },
      { s: [0.05, 4.5, 7], p: [3.5, 2.25, 0] },
      { s: [0.05, 4.5, 7], p: [-3.5, 2.25, 0] },
    ].forEach((c) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(...c.s), glass);
      w.position.set(...c.p);
      g.add(w);
    });
    [
      [3.5, 0],
      [-3.5, 0],
      [0, 3.5],
      [0, -3.5],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 0.1), frame);
      p.position.set(px, 2.25, pz);
      g.add(p);
    });
    const rf = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), glass);
    rf.rotation.x = Math.PI / 2;
    rf.position.y = 4.55;
    g.add(rf);
    const bl = new THREE.PointLight(0xffffff, 1.5, 10);
    bl.position.set(0, 4, 0);
    g.add(bl);
    g.position.set(7, 0, 7);
    g.userData.equipmentId = "paintShop";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Guindaste ─────────────────────────────────────────────
  addCrane(group) {
    const g = new THREE.Group();
    const frame = this._mat(0xf0c040, 0.4, 0.5),
      steel = this._mat(0x555555, 0.4, 0.8),
      wheel = this._mat(0x222222, 0.9, 0),
      chain = this._mat(0x888888, 0.3, 0.9);
    [0.8, -0.8].forEach((x) =>
      [0.6, -0.6].forEach((z) => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 1.4), frame);
        l.position.set(x * 0.5, 0.06, z * 0.5);
        l.rotation.y = Math.atan2(x, z);
        g.add(l);
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10),
          wheel,
        );
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.07, z);
        g.add(w);
      }),
    );
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.14, 4.2, 0.14), frame);
    mast.position.y = 2.1;
    g.add(mast);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), frame);
    arm.position.set(0.9, 3.8, 0);
    g.add(arm);
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10),
      steel,
    );
    cyl.position.set(0.5, 3.3, 0);
    cyl.rotation.z = 0.5;
    g.add(cyl);
    for (let i = 0; i < 6; i++) {
      const lk = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.015, 6, 8),
        chain,
      );
      lk.position.set(1.75, 3.68 + i * 0.07, 0);
      lk.rotation.x = i % 2 === 0 ? Math.PI / 2 : 0;
      g.add(lk);
    }
    const hk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.04), steel);
    hk.position.set(1.75, 3.5, 0);
    g.add(hk);
    g.position.set(-12, 0, -12);
    g.userData.equipmentId = "engineCrane";
    group.add(g);
    this.clickableObjects.push(g);
  }

  // ── Pneus extras ──────────────────────────────────────────
  addExtraTires(group) {
    const tm = this._mat(0x1a1a1a, 0.95, 0),
      rm = this._mat(0x888888, 0.3, 0.9);
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.11, 12, 24), tm);
      t.rotation.y = Math.PI / 2;
      g.add(t);
      const r = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12),
        rm,
      );
      r.rotation.z = Math.PI / 2;
      g.add(r);
      g.rotation.z = Math.PI / 2;
      g.position.set(5 + (i % 2) * 0.85, 0.38, 8 + Math.floor(i / 2) * 0.88);
      group.add(g);
    }
  }

  // ── Extintor ──────────────────────────────────────────────
  addFireExtinguisher(x, y, z, group) {
    const g = new THREE.Group();
    const red = this._mat(0xcc1111, 0.4, 0.5),
      silver = this._mat(0xaaaaaa, 0.3, 0.9),
      blk = this._mat(0x111111, 0.8, 0);
    const bd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.55, 16),
      red,
    );
    bd.position.y = 0.35;
    g.add(bd);
    const tp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 0.12, 12),
      silver,
    );
    tp.position.y = 0.79;
    g.add(tp);
    const vl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8),
      silver,
    );
    vl.position.y = 0.9;
    g.add(vl);
    const hs = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.018, 8, 12, Math.PI),
      blk,
    );
    hs.position.set(0.06, 0.8, 0);
    hs.rotation.z = -0.5;
    g.add(hs);
    g.position.set(x, y, z);
    group.add(g);
  }

  // ── Tambores de óleo ─────────────────────────────────────
  addOilDrums(pos, group) {
    const dm = this._mat(0x1a3a6a, 0.4, 0.6),
      st = this._mat(0xf0c040, 0.5, 0),
      ld = this._mat(0x444444, 0.3, 0.8);
    [
      [0, 0],
      [0.7, 0],
      [0.35, 0.6],
    ].forEach(([dx, dz]) => {
      const g = new THREE.Group();
      const d = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.85, 16),
        dm,
      );
      d.position.y = 0.42;
      g.add(d);
      [0.2, 0.5, 0.7].forEach((dy) => {
        const b = new THREE.Mesh(
          new THREE.TorusGeometry(0.285, 0.015, 8, 20),
          st,
        );
        b.rotation.x = Math.PI / 2;
        b.position.y = dy;
        g.add(b);
      });
      const l = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
        ld,
      );
      l.position.y = 0.87;
      g.add(l);
      g.position.set(pos[0] + dx, pos[1], pos[2] + dz);
      group.add(g);
    });
  }

  // ── Poster na parede ──────────────────────────────────────
  addWallPoster(x, y, z, side, group) {
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.2, 0.06),
        this._mat(0x5a3a1a, 0.8, 0),
      ),
    );
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.0, 0.04),
      this._mat(0x1a3a6a, 0.9, 0),
    );
    p.position.z = 0.02;
    g.add(p);
    [0.3, -0.1].forEach((ly) => {
      const l = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.06, 0.01),
        this._mat(0xffffff, 1.0, 0),
      );
      l.position.set(0, ly, 0.05);
      g.add(l);
    });
    g.position.set(x, y, z);
    if (side === "left") g.rotation.y = Math.PI / 2;
    else if (side === "right") g.rotation.y = -Math.PI / 2;
    group.add(g);
  }

  // ── Carro ─────────────────────────────────────────────────
  createCar(carData, job) {
    if (this.currentCar) this.scene.remove(this.currentCar);
    const cg = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.6, 4.5),
      this._mat(0x3366cc, 0.4, 0.6),
    );
    body.position.y = 0.6;
    body.castShadow = true;
    cg.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.5, 1.5),
      this._mat(0x222244, 0.2, 0.5),
    );
    cabin.position.set(0, 1.1, -0.5);
    cg.add(cabin);
    const wm = this._mat(0x1a1a1a, 0.9, 0),
      rm = this._mat(0xaaaaaa, 0.2, 1.0);
    [
      [-1.0, 0.3, 1.2],
      [1.0, 0.3, 1.2],
      [-1.0, 0.3, -1.4],
      [1.0, 0.3, -1.4],
    ].forEach((p) => {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16),
        wm,
      );
      w.rotation.z = Math.PI / 2;
      w.position.set(...p);
      cg.add(w);
      const r = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.31, 10),
        rm,
      );
      r.rotation.z = Math.PI / 2;
      r.position.set(...p);
      cg.add(r);
    });
    cg.position.set(-5, 0.3, -4);
    this.currentCar = cg;
    this.scene.add(cg);
    return cg;
  }

  // ── Partículas ────────────────────────────────────────────
  createRepairEffect(position) {
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4),
        new THREE.MeshStandardMaterial({ color: 0xffaa00 }),
      );
      p.position.copy(position);
      p.position.x += (Math.random() - 0.5) * 0.4;
      p.position.y += (Math.random() - 0.5) * 0.4;
      p.position.z += (Math.random() - 0.5) * 0.4;
      p.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
        life: 1.0,
      };
      this.scene.add(p);
      this.particles.push(p);
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
        p.position.add(p.userData.velocity);
        p.scale.setScalar(p.userData.life);
      }
    }
  }

  // ── Upgrade ───────────────────────────────────────────────
  upgradeToLevel(level) {
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

  // ── Loop ──────────────────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.updateMovement(delta);
    this.updateParticles();
    if (this.targetLiftHeight !== undefined) {
      const step = 0.05;
      if (Math.abs(this.liftHeight - this.targetLiftHeight) > step) {
        this.liftHeight +=
          this.targetLiftHeight > this.liftHeight ? step : -step;
        if (this.currentCar) this.currentCar.position.y = this.liftHeight;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== "undefined") window.OptimizedGarage = OptimizedGarage;
