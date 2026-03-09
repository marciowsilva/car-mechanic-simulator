// src/garage/MinimalGarage.js - Versão mínima e garantida

import * as THREE from 'three';

export class MinimalGarage {
    constructor(container) {
        console.log('🏢 Criando garagem mínima...');
        
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        
        // Câmera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 3, 8);
        this.camera.lookAt(0, 1, 0);
        
        // Renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);
        
        // Luzes
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);
        
        // Chão
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
        
        // Criar 1 elevador (teste)
        this.createTestLift();
        
        // Iniciar animação
        this.animate();
    }
    
    createTestLift() {
        console.log('🔧 Criando elevador de teste...');
        
        // Um cubo simples para testar
        const geometry = new THREE.BoxGeometry(2, 0.5, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const lift = new THREE.Mesh(geometry, material);
        lift.position.set(0, 0.25, 0);
        this.scene.add(lift);
        
        console.log('✅ Elevador adicionado à cena');
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}