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

    // Verificar se as importações funcionaram
    if (typeof CSS2DObject === "undefined") {
      console.error("❌ CSS2DObject não está disponível!");
    }
    if (typeof CSS2DRenderer === "undefined") {
      console.error("❌ CSS2DRenderer não está disponível!");
    }

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

    // CSS2 Renderer
    try {
      this.labelRenderer = new CSS2DRenderer();
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      this.labelRenderer.domElement.style.position = "absolute";
      this.labelRenderer.domElement.style.top = "0px";
      this.labelRenderer.domElement.style.left = "0px";
      this.labelRenderer.domElement.style.pointerEvents = "none";
      container.appendChild(this.labelRenderer.domElement);
      console.log("✅ CSS2DRenderer criado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao criar CSS2DRenderer:", error);
    }

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
    this.partObjects = [];
    this.normalLabels = [];

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
    if (this.normalLabels) {
      this.normalLabels.forEach((item) => {
        if (item.normal && item.normal.parent) {
          item.normal.parent.remove(item.normal);
        }
        if (item.selected && item.selected.parent) {
          item.selected.parent.remove(item.selected);
        }
      });
      this.normalLabels = [];
    }

    if (this.partObjects) {
      this.partObjects.forEach((obj) => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
      });
      this.partObjects = [];
    }
  }

  updatePartLabels(carData, job) {
    console.log("🏷️ Atualizando labels...");

    // Limpar labels existentes
    this.clearAllLabels();

    if (!this.currentCar || !carData || !job) {
      console.log("❌ Sem dados para criar labels");
      return;
    }

    this.partObjects = [];
    this.normalLabels = [];

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

        // Determinar cor
        let bgColor = "";
        let borderColor = "#ff6b00";
        let textColor = "white";

        if (condition === 100) {
          bgColor = "#4CAF50";
          borderColor = "gold";
        } else if (condition >= targetCondition) {
          bgColor = "#00aa00";
        } else if (condition >= targetCondition * 0.7) {
          bgColor = "#ffaa00";
          textColor = "black";
        } else {
          bgColor = "#ff0000";
        }

        // Texto
        let displayText =
          condition === 100
            ? `${displayName}: 100% ✨`
            : `${displayName}: ${condition}% / ${targetCondition}%`;

        // ===== LABEL NORMAL =====
        const normalDiv = document.createElement("div");
        normalDiv.className = "part-label part-label-normal";
        normalDiv.textContent = displayText;
        normalDiv.style.backgroundColor = bgColor;
        normalDiv.style.color = textColor;
        normalDiv.style.border = `2px solid ${borderColor}`;
        normalDiv.style.padding = "4px 8px";
        normalDiv.style.borderRadius = "12px";
        normalDiv.style.fontSize = "12px";
        normalDiv.style.fontWeight = "bold";
        normalDiv.style.whiteSpace = "nowrap";
        normalDiv.style.cursor = "pointer";
        normalDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
        normalDiv.style.pointerEvents = "auto";

        normalDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectPart(partName);
        });

        // ===== LABEL SELECIONADO =====
        const selectedDiv = document.createElement("div");
        selectedDiv.className = "part-label part-label-selected";
        selectedDiv.textContent = displayText;
        selectedDiv.style.backgroundColor = bgColor;
        selectedDiv.style.color = textColor;
        selectedDiv.style.border = `4px solid white`;
        selectedDiv.style.padding = "6px 10px";
        selectedDiv.style.borderRadius = "14px";
        selectedDiv.style.fontSize = "14px";
        selectedDiv.style.fontWeight = "bold";
        selectedDiv.style.whiteSpace = "nowrap";
        selectedDiv.style.cursor = "pointer";
        selectedDiv.style.boxShadow =
          "0 0 30px currentColor, 0 0 60px currentColor";
        selectedDiv.style.opacity = "0";
        selectedDiv.style.pointerEvents = "none";
        selectedDiv.style.zIndex = "1000";

        try {
          // Verificar se CSS2DObject está disponível
          if (typeof CSS2DObject === "undefined") {
            throw new Error("CSS2DObject não está disponível");
          }

          // Posição base
          const baseY = pos[1] + 0.5;

          // Label normal
          const normalLabel = new CSS2DObject(normalDiv);
          normalLabel.position.set(pos[0], baseY, pos[2]);
          normalLabel.userData = {
            partName,
            type: "normal",
            baseY,
            pos: { x: pos[0], y: baseY, z: pos[2] },
          };

          // Label selecionado
          const selectedLabel = new CSS2DObject(selectedDiv);
          selectedLabel.position.set(pos[0], baseY, pos[2]);
          selectedLabel.userData = {
            partName,
            type: "selected",
            baseY,
            pos: { x: pos[0], y: baseY, z: pos[2] },
          };

          // Adicionar ambos ao carro
          this.currentCar.add(normalLabel);
          this.currentCar.add(selectedLabel);

          // Guardar referências
          this.normalLabels.push({
            partName,
            normal: normalLabel,
            selected: selectedLabel,
            baseY,
          });

          // Objeto 3D para highlight
          const partGeometry = new THREE.SphereGeometry(0.25, 8);
          const partMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.0,
          });
          const partObject = new THREE.Mesh(partGeometry, partMaterial);
          partObject.position.set(pos[0], baseY, pos[2]);
          partObject.userData = { partName };

          this.currentCar.add(partObject);
          this.partObjects.push(partObject);
        } catch (error) {
          console.error(`❌ Erro ao criar label para ${partName}:`, error);
        }
      }
    });

    // Após criar todos os labels, garantir que a seleção seja restaurada corretamente
    setTimeout(() => {
      if (gameState?.selectedPart) {
        console.log("🔄 Restaurando seleção:", gameState.selectedPart);
        this.selectPart(gameState.selectedPart);
      }
    }, 200);
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

  // MÉTODO: Destacar a peça selecionada (separado do selectPart)
  highlightSelectedPart(partName) {
    if (!partName || !this.currentCar) return;

    console.log("✨ Destacando peça:", partName);

    // ===== 1. Resetar todos os labels =====
    this.labelObjects.forEach((label) => {
      if (label.element) {
        // Resetar estilos
        label.element.style.borderWidth = "2px";
        label.element.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
        label.element.style.transform = "none";
        label.element.style.zIndex = "auto";
        label.element.classList.remove("selected");
      }

      // Voltar à posição original
      if (label.userData) {
        label.position.y = label.userData.baseY;
        label.position.z = label.userData.position?.z || 0;
      }

      label.userData.isSelected = false;
    });

    // ===== 2. Encontrar e destacar o label selecionado =====
    const selectedLabel = this.labelObjects.find(
      (l) => l.userData?.partName === partName,
    );

    if (selectedLabel && selectedLabel.element) {
      // Salvar posição original
      const baseY = selectedLabel.userData.baseY;

      // ===== SOLUÇÃO: Mover para FRENTE no eixo Z também =====
      // Além de subir, vamos trazer para frente no eixo Z
      selectedLabel.position.y = baseY + 0.5; // Sobe mais um pouco
      selectedLabel.position.z = 0.5; // Traz para frente (ajuste conforme necessidade)

      // Aplicar estilos
      selectedLabel.element.style.borderWidth = "4px";
      selectedLabel.element.style.boxShadow =
        "0 0 30px currentColor, 0 0 60px currentColor";
      selectedLabel.element.style.transform = "scale(1.2)"; // Scale suave
      selectedLabel.element.style.zIndex = "1000";
      selectedLabel.element.classList.add("selected");

      selectedLabel.userData.isSelected = true;

      // ===== 3. Garantir que este label seja o último na ordem =====
      // Remover e readicionar para ficar por último (renderiza por cima)
      if (this.currentCar) {
        this.currentCar.remove(selectedLabel);
        this.currentCar.add(selectedLabel);
      }
    }

    // ===== 4. Destacar objeto 3D =====
    this.partObjects.forEach((obj) => {
      if (obj.userData?.partName === partName) {
        obj.material.opacity = 0.3;
        obj.scale.set(2.0, 2.0, 2.0);
        // Também trazer para frente
        obj.position.z = 0.3;
      } else {
        obj.material.opacity = 0.0;
        obj.scale.set(1, 1, 1);
        obj.position.z = 0;
      }
    });

    // ===== 5. Anel de destaque =====
    this.clearHighlight();
    this.createHighlightRing(partName);
  }

  createHighlightRing(partName) {
    const pos = PART_POSITIONS[partName];
    if (!pos || !this.currentCar) return;

    // Remover anel anterior
    if (this.highlightRing) {
      this.currentCar.remove(this.highlightRing);
    }

    // Criar novo anel
    const ringGeometry = new THREE.TorusGeometry(0.4, 0.03, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0x442200,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    // Posicionar o anel também na frente
    ring.position.set(pos[0], pos[1] + 0.7, 0.4);
    ring.rotation.x = Math.PI / 2;

    this.currentCar.add(ring);
    this.highlightRing = ring;

    // Animação simples
    this.animateRing(ring);
  }

  animateRing(ring) {
    if (!ring) return;

    let time = 0;
    const animate = () => {
      if (!ring.parent || !this.highlightRing) return;

      time += 0.05;
      ring.scale.setScalar(1 + Math.sin(time) * 0.1);
      ring.material.opacity = 0.4 + Math.sin(time) * 0.2;

      requestAnimationFrame(animate);
    };

    animate();
  }

  // método para limpar o highlight quando necessário
  clearHighlight() {
    if (this.highlightRing && this.currentCar) {
      this.currentCar.remove(this.highlightRing);
      this.highlightRing = null;
    }
  }

  // Modificar selectPart para incluir animação
  selectPart(partName) {
    if (!gameState || !this.normalLabels) return;

    console.log("🎯 Selecionando peça:", partName);
    gameState.selectedPart = partName;

    // Primeiro, resetar todos os labels
    this.normalLabels.forEach((item) => {
      if (item.normal && item.normal.element) {
        item.normal.element.style.opacity = "1";
        item.normal.element.style.pointerEvents = "auto";
        item.normal.element.style.zIndex = "auto";
      }
      if (item.selected && item.selected.element) {
        item.selected.element.style.opacity = "0";
        item.selected.element.style.pointerEvents = "none";
        item.selected.element.style.zIndex = "auto";
      }
    });

    // Destacar o selecionado
    const selectedItem = this.normalLabels.find(
      (item) => item.partName === partName,
    );

    if (selectedItem) {
      // Esconder o normal
      if (selectedItem.normal && selectedItem.normal.element) {
        selectedItem.normal.element.style.opacity = "0";
        selectedItem.normal.element.style.pointerEvents = "none";
      }

      // Mostrar o selecionado
      if (selectedItem.selected && selectedItem.selected.element) {
        selectedItem.selected.element.style.opacity = "1";
        selectedItem.selected.element.style.pointerEvents = "auto";
        selectedItem.selected.element.style.zIndex = "1000";
      }

      // ===== SOLUÇÃO: Reordenar na cena =====
      // Remover e readicionar o label selecionado para que ele fique por último
      if (this.currentCar && selectedItem.selected) {
        // Guardar posição
        const pos = selectedItem.selected.position.clone();

        // Remover da cena
        this.currentCar.remove(selectedItem.selected);

        // Readicionar (vai para o final da lista de renderização)
        this.currentCar.add(selectedItem.selected);

        // Restaurar posição
        selectedItem.selected.position.copy(pos);
      }

      // Destacar objeto 3D
      this.partObjects.forEach((obj) => {
        if (obj.userData?.partName === partName) {
          obj.material.opacity = 0.3;
          obj.scale.set(1.8, 1.8, 1.8);

          // Também reordenar o objeto 3D
          if (this.currentCar) {
            const pos = obj.position.clone();
            this.currentCar.remove(obj);
            this.currentCar.add(obj);
            obj.position.copy(pos);
          }
        } else {
          obj.material.opacity = 0.0;
          obj.scale.set(1, 1, 1);
        }
      });
    }

    // Atualizar UI
    if (gameState.currentCar && gameState.currentJob) {
      const condition = gameState.currentCar.parts[partName]?.condition;
      const target = gameState.currentJob.targetConditions[partName];
      if (condition && target) {
        const info = document.getElementById("interaction-info");
        if (info) {
          info.textContent = `🔧 ${PART_TRANSLATIONS[partName].display}: ${Math.round(condition)}% / Meta: ${Math.round(target)}%`;
        }
      }
    }
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

  // Método para atualizar aparência da garagem

  updateGarageAppearance(appearance) {
    // Atualizar cor e tamanho da garagem baseado no nível
    console.log("🏢 Atualizando aparência da garagem:", appearance);

    // Aqui você pode modificar os objetos 3D da garagem
    // Por exemplo: aumentar tamanho, adicionar placas, etc.
  }
}
