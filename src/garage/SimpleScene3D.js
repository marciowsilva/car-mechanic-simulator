// src/garage/SimpleScene3D.js - Versão simplificada para teste

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class SimpleScene3D {
  constructor(container) {

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
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.setupLights();
    this.createFloor();
    this.createTestCar();

    this.animate();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.receiveShadow = true;
    this.scene.add(dirLight);
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xff6b00, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  createTestCar() {
    const carGroup = new THREE.Group();

    // Carroceria
    const bodyGeo = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Cabine
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.4, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, -0.3);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);

    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const positions = [
      [-0.8, 0.3, 1.2],
      [0.8, 0.3, 1.2],
      [-0.8, 0.3, -1.2],
      [0.8, 0.3, -1.2],
    ];

    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });

    carGroup.position.set(0, 0, 0);
    this.car = carGroup;
    this.scene.add(carGroup);
  }

  createRepairEffect(position) {
    // Efeito simples de partículas
    const particles = [];
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4);
      const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      this.scene.add(particle);
      particles.push(particle);
    }

    // Animar partículas
    let time = 0;
    const animate = () => {
      time += 0.1;
      particles.forEach((p, i) => {
        p.position.y += 0.02;
        p.scale.setScalar(1 - time * 0.1);
      });
      if (time < 2) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach((p) => this.scene.remove(p));
      }
    };
    animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  createRepairEffect(partName) {
    // Posições aproximadas das peças
    const positions = {
      motor: [0, 1.0, 1.0],
      transmissao: [0, 0.8, 0],
      freios: [0.5, 0.3, 1.5],
      suspensao: [-0.5, 0.3, 1.0],
      bateria: [0.3, 0.8, 1.2],
      alternador: [-0.3, 0.8, 1.2],
    };

    const pos = positions[partName];
    if (!pos || !this.car) return;

    // Criar partículas
    const particleCount = 10;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
      });
      const particle = new THREE.Mesh(geometry, material);

      // Posição inicial no local da peça
      particle.position.set(
        pos[0] + (Math.random() - 0.5) * 0.5,
        pos[1] + (Math.random() - 0.5) * 0.5,
        pos[2] + (Math.random() - 0.5) * 0.5,
      );

      // Velocidade aleatória
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          Math.random() * 0.05,
          (Math.random() - 0.5) * 0.05,
        ),
        life: 1.0,
      };

      this.scene.add(particle);
      particles.push(particle);
    }

    // Animar partículas
    const animateParticles = () => {
      let alive = false;

      particles.forEach((particle) => {
        particle.userData.life -= 0.02;

        if (particle.userData.life > 0) {
          alive = true;
          particle.position.x += particle.userData.velocity.x;
          particle.position.y += particle.userData.velocity.y;
          particle.position.z += particle.userData.velocity.z;
          particle.scale.setScalar(particle.userData.life);
        } else {
          this.scene.remove(particle);
        }
      });

      if (alive) {
        requestAnimationFrame(animateParticles);
      }
    };

    animateParticles();
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.SimpleScene3D = SimpleScene3D;
}
