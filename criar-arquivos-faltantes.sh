#!/bin/bash

# criar-arquivos-faltantes.sh - Cria arquivos essenciais que estão faltando

echo "================================="
echo "📝 CRIANDO ARQUIVOS FALTANTES"
echo "================================="
echo ""

# Criar arquivos em src/cars/
if [ ! -f "src/cars/CarParts.js" ]; then
    cat > src/cars/CarParts.js << 'EOF'
// src/cars/CarParts.js
export class CarPart {
    constructor(type, condition = 100) {
        this.type = type;
        this.condition = condition;
        this.maxCondition = 100;
        this.isBroken = false;
    }

    damage(amount) {
        this.condition = Math.max(0, this.condition - amount);
        if (this.condition <= 0) this.isBroken = true;
    }

    repair(amount) {
        if (!this.isBroken) {
            this.condition = Math.min(this.maxCondition, this.condition + amount);
        }
    }

    replace() {
        this.condition = this.maxCondition;
        this.isBroken = false;
    }
}
EOF
    echo "✅ src/cars/CarParts.js criado"
fi

# Criar Scene3D.js se não existir
if [ ! -f "src/garage/Scene3D.js" ] && [ ! -f "src/garage/scene3d.js" ]; then
    cat > src/garage/Scene3D.js << 'EOF'
// src/garage/Scene3D.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.setupLights();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
EOF
    echo "✅ src/garage/Scene3D.js criado"
fi

# Criar daily-challenges.js se não existir
if [ ! -f "src/systems/challenges/DailyChallenges.js" ] && [ ! -f "src/systems/DailyChallenges.js" ]; then
    mkdir -p src/systems/challenges
    cat > src/systems/challenges/DailyChallenges.js << 'EOF'
// src/systems/challenges/DailyChallenges.js
export class DailyChallenges {
    constructor() {
        this.challenges = [];
        this.loadChallenges();
    }

    loadChallenges() {
        this.challenges = [
            { id: 1, name: 'Reparar 3 motores', reward: 500, progress: 0, target: 3 },
            { id: 2, name: 'Ganhar R$ 2000', reward: 300, progress: 0, target: 2000 }
        ];
    }

    updateProgress(challengeId, amount) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (challenge) {
            challenge.progress += amount;
            if (challenge.progress >= challenge.target) {
                return challenge.reward;
            }
        }
        return 0;
    }
}
EOF
    echo "✅ src/systems/challenges/DailyChallenges.js criado"
fi

echo ""
echo "✅ Arquivos faltantes criados!"