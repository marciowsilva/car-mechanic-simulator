// scene3d.js

import * as THREE from "https://unpkg.com/three@0.128.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.128.0/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "https://unpkg.com/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js";
import { PART_TRANSLATIONS, PART_POSITIONS, CAR_COLORS } from "./constants.js";
import { gameState } from "./game.js";

export class Scene3D {
  constructor(container) {
    console.log("🎮 Inicializando Scene3D...");
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(5, 3, 8);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = "0px";
    this.labelRenderer.domElement.style.left = "0px";
    this.labelRenderer.domElement.style.pointerEvents = "none";
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
    this.highlightRing = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Adicionar event listener para clique
    this.renderer.domElement.addEventListener("click", (event) =>
      this.onMouseClick(event),
    );

    console.log("✅ Scene3D inicializada");
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
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
    });
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

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 0.5),
      wallMaterial,
    );
    backWall.position.set(0, 2, -5);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 10),
      wallMaterial,
    );
    leftWall.position.set(-6, 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 10),
      wallMaterial,
    );
    rightWall.position.set(6, 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    this.scene.add(rightWall);
  }

  createCar(carData, job) {
    console.log("🚗 Criando carro:", job?.carModel);

    // Limpar completamente antes de criar novo
    this.clearAllLabels();
    this.clearHighlight();

    if (this.currentCar) {
      this.scene.remove(this.currentCar);
      this.currentCar = null;
    }

    const carGroup = new THREE.Group();

    // Escolher cor aleatória baseada no tipo de carro
    let carColor = 0x3366cc; // Azul padrão

    // Verificar se CAR_COLORS está definido
    if (typeof CAR_COLORS !== "undefined" && CAR_COLORS.length > 0) {
      if (job?.carData?.type) {
        // Cores baseadas no tipo
        const typeColors = {
          sports: 0xff3333, // Vermelho para esportivos
          luxury: 0x000000, // Preto para luxo
          suv: 0x666666, // Prata para SUVs
          pickup: 0x996633, // Marrom para pickups
          compact: 0x33cc33, // Verde para compactos
          sedan: 0x3366cc, // Azul para sedans
        };
        carColor =
          typeColors[job.carData.type] ||
          CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
      } else {
        carColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
      }
    } else {
      console.warn("⚠️ CAR_COLORS não definido, usando cor padrão");
      carColor = 0x3366cc;
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: carColor,
      roughness: 0.3,
      metalness: 0.7,
    });

    // Corpo principal
    const mainBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 5),
      bodyMaterial,
    );
    mainBody.position.set(0, 0.8, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    carGroup.add(mainBody);

    // Cabine
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
    );
    cabin.position.set(0, 1.4, -0.5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);

    // Capô
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.3, 1.8),
      bodyMaterial,
    );
    hood.position.set(0, 1.1, 1.2);
    hood.castShadow = true;
    hood.receiveShadow = true;
    carGroup.add(hood);

    // Porta-malas
    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.4, 1.2),
      bodyMaterial,
    );
    trunk.position.set(0, 1.0, -1.7);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    carGroup.add(trunk);

    this.addWheels(carGroup);
    this.addLights(carGroup);

    carGroup.position.set(0, 0, 0);
    this.currentCar = carGroup;
    this.scene.add(carGroup);

    this.updatePartLabels(carData, job);

    console.log("✅ Carro criado com cor:", carColor.toString(16));
    return carGroup;
  }

  addWheels(carGroup) {
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const wheelPositions = [
      [-1.1, 0.4, 1.5],
      [1.1, 0.4, 1.5],
      [-1.1, 0.4, -1.5],
      [1.1, 0.4, -1.5],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32),
        wheelMaterial,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });
  }

  addLights(carGroup) {
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0x442200,
    });
    const headlightLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16),
      headlightMaterial,
    );
    headlightLeft.position.set(-0.8, 0.9, 2.4);
    carGroup.add(headlightLeft);

    const headlightRight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16),
      headlightMaterial,
    );
    headlightRight.position.set(0.8, 0.9, 2.4);
    carGroup.add(headlightRight);
  }

  // Limpar todos os labels
  clearAllLabels() {
    // Limpar labels 2D
    if (this.partLabels.length > 0) {
      this.partLabels.forEach((label) => {
        if (label.parent) {
          label.parent.remove(label);
        }
      });
      this.partLabels = [];
    }

    // Limpar objetos 3D
    if (this.partObjects) {
      this.partObjects.forEach((obj) => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
      });
      this.partObjects = [];
    }

    // Limpar highlight
    this.clearHighlight();
  }

  updatePartLabels(carData, job) {
    console.log("🏷️ Atualizando labels...");

    // Limpar labels existentes
    this.clearAllLabels();

    if (!this.currentCar || !carData || !job) {
      console.log("❌ Sem dados para criar labels");
      return;
    }

    // Array para guardar os objetos 3D das peças (para poder destacar)
    this.partObjects = [];

    Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
      if (carData.parts[partName]) {
        const condition = Math.min(
          100,
          Math.round(carData.parts[partName].condition),
        );
        const targetCondition = Math.min(
          100,
          Math.round(job.targetConditions[partName]),
        );
        const displayName = PART_TRANSLATIONS[partName].display;

        // CRIAR LABEL 2D
        const labelDiv = document.createElement("div");
        labelDiv.className = "part-label";
        if (gameState?.selectedPart === partName) {
          labelDiv.classList.add("selected");
        }

        // Mostrar apenas 100% se a peça estiver perfeita
        let displayText = "";
        if (condition === 100) {
          displayText = `${displayName}: 100% ✨`;
          labelDiv.style.backgroundColor = "#4CAF50";
          labelDiv.style.border = "3px solid gold";
        } else {
          displayText = `${displayName}: ${condition}% / ${targetCondition}%`;

          if (condition >= targetCondition) {
            labelDiv.style.backgroundColor = "#00aa00";
          } else if (condition >= targetCondition * 0.7) {
            labelDiv.style.backgroundColor = "#ffaa00";
          } else {
            labelDiv.style.backgroundColor = "#ff0000";
          }
        }

        labelDiv.textContent = displayText;

        labelDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectPart(partName);
        });

        try {
          const label = new CSS2DObject(labelDiv);
          label.position.set(pos[0], pos[1] + 0.5, pos[2]);
          this.currentCar.add(label);
          this.partLabels.push(label);

          // ===== CRIAR OBJETO 3D DA PEÇA (para destacar) =====
          // Adicionar um pequeno cubo invisível para detecção de clique e highlight
          const partGeometry = new THREE.SphereGeometry(0.2, 8);
          const partMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.0, // Invisível por padrão
            emissive: 0x442200,
          });
          const partObject = new THREE.Mesh(partGeometry, partMaterial);
          partObject.position.set(pos[0], pos[1] + 0.5, pos[2]);
          partObject.userData = { partName, isHighlight: false };

          this.currentCar.add(partObject);

          // Guardar referência
          if (!this.partObjects) this.partObjects = [];
          this.partObjects.push(partObject);
        } catch (error) {
          console.error(`❌ Erro ao criar label para ${partName}:`, error);
        }
      }
    });
  }

  // Efeito de partículas para reparo
  createRepairEffect(position) {
    if (!position) return;

    const particleCount = 15;
    const particles = [];
    const colors = [0xffaa00, 0xff6b00, 0xff4400];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4);
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        emissive: 0x331100,
      });
      const particle = new THREE.Mesh(geometry, material);

      // Posição inicial com pequeno desvio
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.3;
      particle.position.y += (Math.random() - 0.5) * 0.3;
      particle.position.z += (Math.random() - 0.5) * 0.3;

      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.08,
        ),
        life: 0.8 + Math.random() * 0.4,
      };

      this.scene.add(particle);
      particles.push(particle);
    }

    // Animar partículas
    const animateParticles = () => {
      let alive = false;

      particles.forEach((particle) => {
        particle.userData.life -= 0.015;

        if (particle.userData.life > 0) {
          alive = true;

          // Mover partícula
          particle.position.x += particle.userData.velocity.x;
          particle.position.y += particle.userData.velocity.y;
          particle.position.z += particle.userData.velocity.z;

          // Desacelerar
          particle.userData.velocity.x *= 0.98;
          particle.userData.velocity.y *= 0.98;
          particle.userData.velocity.z *= 0.98;

          // Reduzir tamanho
          particle.scale.setScalar(particle.userData.life);

          // Reduzir opacidade
          if (particle.material) {
            particle.material.opacity = particle.userData.life;
            particle.material.transparent = true;
          }
        } else {
          // Remover partícula morta
          if (particle.parent) {
            this.scene.remove(particle);
          }
        }
      });

      if (alive) {
        requestAnimationFrame(animateParticles);
      }
    };

    animateParticles();
  }

  // Efeito de brilho ao selecionar peça
  highlightPart(partName) {
    // Verificar se há um carro
    if (!this.currentCar) {
      console.log("⚠️ Sem carro para destacar parte");
      return;
    }

    // Encontrar a posição da peça
    const pos = PART_POSITIONS[partName];
    if (!pos) return;

    // Remover anel existente se houver
    if (this.highlightRing) {
      if (this.currentCar) {
        this.currentCar.remove(this.highlightRing);
      }
      this.highlightRing = null;
    }

    // Criar um anel de brilho
    const ringGeometry = new THREE.TorusGeometry(0.3, 0.02, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0x442200,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(pos[0], pos[1] + 0.5, pos[2]);
    ring.rotation.x = Math.PI / 2;

    this.highlightRing = ring;
    this.currentCar.add(ring);

    // Animar o anel
    let time = 0;
    const animateRing = () => {
      // Verificar se o carro ainda existe e a peça ainda está selecionada
      if (
        !this.currentCar ||
        !this.highlightRing ||
        gameState?.selectedPart !== partName
      ) {
        // Remover o anel se existir
        if (this.highlightRing && this.currentCar) {
          this.currentCar.remove(this.highlightRing);
        }
        this.highlightRing = null;
        return;
      }

      time += 0.05;
      if (this.highlightRing) {
        this.highlightRing.scale.setScalar(1 + Math.sin(time) * 0.1);
        this.highlightRing.material.opacity = 0.3 + Math.sin(time) * 0.2;
      }

      requestAnimationFrame(animateRing);
    };

    animateRing();
  }

  // método para limpar o highlight quando necessário
  clearHighlight() {
    // Limpar anel
    if (this.highlightRing && this.currentCar) {
      this.currentCar.remove(this.highlightRing);
      this.highlightRing = null;
    }

    // Resetar objetos 3D
    if (this.partObjects) {
      this.partObjects.forEach((obj) => {
        obj.material.opacity = 0.0;
        obj.scale.set(1, 1, 1);
        obj.material.emissive.setHex(0x442200);
      });
    }
  }

  // Modificar selectPart para incluir animação
  selectPart(partName) {
    if (!gameState) return;

    console.log("🎯 Selecionando peça:", partName);
    gameState.selectedPart = partName;

    // Atualizar labels 2D
    this.partLabels.forEach((label) => {
      if (label.element) {
        label.element.classList.remove("selected");
        if (
          label.element.textContent.includes(
            PART_TRANSLATIONS[partName].display,
          )
        ) {
          label.element.classList.add("selected");
        }
      }
    });

    // ===== DESTACAR PEÇA SELECIONADA =====
    // Resetar todos os objetos de peça
    if (this.partObjects) {
      this.partObjects.forEach((obj) => {
        obj.material.opacity = 0.0;
        obj.scale.set(1, 1, 1);
        obj.userData.isHighlight = false;
      });

      // Encontrar e destacar a peça selecionada
      const selectedObj = this.partObjects.find(
        (obj) => obj.userData.partName === partName,
      );
      if (selectedObj) {
        selectedObj.material.opacity = 0.3; // Fica semi-visível
        selectedObj.scale.set(1.5, 1.5, 1.5); // Aumenta de tamanho
        selectedObj.userData.isHighlight = true;

        // Adicionar animação de brilho
        this.highlightPart3D(selectedObj);
      }
    }

    // Remover highlight anterior
    this.clearHighlight();

    // Adicionar novo highlight (anel)
    this.highlightPart(partName);
  }

  // Highlight 3D da peça
  highlightPart3D(partObject) {
    if (!partObject) return;

    let time = 0;
    const animate = () => {
      if (
        !partObject ||
        !partObject.parent ||
        !gameState?.selectedPart === partObject.userData.partName
      ) {
        return;
      }

      time += 0.05;

      // Efeito de pulsação
      const pulse = 1.5 + Math.sin(time) * 0.2;
      partObject.scale.set(pulse, pulse, pulse);

      // Efeito de brilho
      partObject.material.emissive.setHSL(0.1 + Math.sin(time) * 0.05, 1, 0.3);

      requestAnimationFrame(animate);
    };

    animate();
  }

  // Detectar clique no modelo 3D
  onMouseClick(event) {
    // Calcular posição do mouse em coordenadas normalizadas (-1 a 1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.currentCar) return;

    // Atualizar o raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Verificar interseções com o carro
    const intersects = this.raycaster.intersectObject(this.currentCar, true);

    if (intersects.length > 0) {
      // Encontrar qual parte foi clicada baseado na posição
      const clickPoint = intersects[0].point;

      // Calcular distância para cada posição de peça
      let closestPart = null;
      let minDistance = 0.8; // Distância máxima para considerar

      Object.entries(PART_POSITIONS).forEach(([partName, pos]) => {
        // Posição global da peça
        const partPos = new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]);

        // Distância do clique até a peça
        const distance = clickPoint.distanceTo(partPos);

        if (distance < minDistance) {
          minDistance = distance;
          closestPart = partName;
        }
      });

      if (closestPart) {
        console.log("👆 Peça selecionada pelo clique:", closestPart);
        this.selectPart(closestPart);

        // Feedback visual - efeito de partícula no local do clique
        this.createClickEffect(clickPoint);
      }
    }
  }

  // Efeito visual de clique
  createClickEffect(position) {
    const particleCount = 5;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 4);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0x442200,
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.2;
      particle.position.y += (Math.random() - 0.5) * 0.2;
      particle.position.z += (Math.random() - 0.5) * 0.2;

      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          Math.random() * 0.05,
          (Math.random() - 0.5) * 0.05,
        ),
        life: 0.5,
      };

      this.scene.add(particle);

      // Animação simples
      const animate = () => {
        particle.userData.life -= 0.02;

        if (particle.userData.life > 0) {
          particle.position.x += particle.userData.velocity.x;
          particle.position.y += particle.userData.velocity.y;
          particle.position.z += particle.userData.velocity.z;
          particle.scale.setScalar(particle.userData.life);

          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
        }
      };

      animate();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}
