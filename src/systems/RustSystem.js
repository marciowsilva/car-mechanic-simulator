/**
 * RustSystem.js
 * Sistema de dano visual por ferrugem usando Three.js MeshStandardMaterial
 * com blending de cor/roughness/metalness por nível de dano.
 *
 * Integração: importar em OptimizedGarage.js e Game.js
 *
 * Níveis de dano: 0 (novo) → 1 (destruído)
 * Zonas afetadas: capô, portas, para-lamas, chassi (configurável por mesh name)
 */

import * as THREE from 'three';

// ─── Configuração de aparência por nível de dano ────────────────────────────

const RUST_STAGES = [
  // [minDamage, maxDamage, config]
  { min: 0.00, max: 0.20, label: 'pristine',  color: null,              roughness: 0.4, metalness: 0.8, envMapIntensity: 1.0 },
  { min: 0.20, max: 0.40, label: 'worn',      color: 0x8a7060,          roughness: 0.6, metalness: 0.5, envMapIntensity: 0.7 },
  { min: 0.40, max: 0.65, label: 'rusty',     color: 0x7a3b1e,          roughness: 0.85, metalness: 0.2, envMapIntensity: 0.3 },
  { min: 0.65, max: 0.85, label: 'corroded',  color: 0x5c2a0e,          roughness: 0.95, metalness: 0.1, envMapIntensity: 0.1 },
  { min: 0.85, max: 1.00, label: 'destroyed', color: 0x3d1a06,          roughness: 1.0,  metalness: 0.0, envMapIntensity: 0.0 },
];

// Partes do carro que recebem ferrugem (baseado no nome do mesh no modelo 3D)
const RUST_AFFECTED_PARTS = [
  'hood', 'door', 'fender', 'trunk', 'roof',
  'bumper', 'chassis', 'frame', 'panel',
  // Padrões alternativos usados em modelos genéricos
  'body', 'car_body', 'exterior',
];

// ─── RustSystem ──────────────────────────────────────────────────────────────

export class RustSystem {
  constructor() {
    /** Map<mesh.uuid, { originalMaterial, currentDamage }> */
    this._meshRegistry = new Map();

    /** Map de transições ativas para animação suave */
    this._transitions = new Map();

    /** Partícula de poeira/ferrugem (opcional, lazy-init) */
    this._particleSystem = null;

    this._clock = new THREE.Clock();
  }

  // ── Registro ──────────────────────────────────────────────────────────────

  /**
   * Registra um Object3D (carro) para rastreamento de dano.
   * Deve ser chamado após o modelo ser carregado na cena.
   * @param {THREE.Object3D} carObject
   * @param {number} initialDamage - 0.0 a 1.0
   */
  registerCar(carObject, initialDamage = 0) {
    carObject.traverse((child) => {
      if (!child.isMesh) return;
      if (!this._isRustAffected(child.name)) return;

      // Clona o material para não afetar outros objetos que compartilhem o mesmo
      const clonedMaterial = child.material.clone
        ? child.material.clone()
        : new THREE.MeshStandardMaterial().copy(child.material);

      child.material = clonedMaterial;

      this._meshRegistry.set(child.uuid, {
        mesh: child,
        originalColor: clonedMaterial.color ? clonedMaterial.color.clone() : new THREE.Color(0xffffff),
        originalRoughness: clonedMaterial.roughness ?? 0.4,
        originalMetalness: clonedMaterial.metalness ?? 0.8,
        originalEnvMapIntensity: clonedMaterial.envMapIntensity ?? 1.0,
        currentDamage: 0,
      });

      // Aplica dano inicial sem animação
      this._applyDamageImmediate(child.uuid, initialDamage);
    });

    console.log(`[RustSystem] Registrados ${this._meshRegistry.size} meshes para ferrugem.`);
  }

  /**
   * Remove o carro do sistema (ex: ao trocar de carro na garagem).
   * @param {THREE.Object3D} carObject
   */
  unregisterCar(carObject) {
    carObject.traverse((child) => {
      if (!child.isMesh) return;
      const entry = this._meshRegistry.get(child.uuid);
      if (!entry) return;

      // Restaura material original
      child.material.color?.set(entry.originalColor);
      child.material.roughness = entry.originalRoughness;
      child.material.metalness = entry.originalMetalness;
      child.material.envMapIntensity = entry.originalEnvMapIntensity;
      child.material.needsUpdate = true;

      this._meshRegistry.delete(child.uuid);
      this._transitions.delete(child.uuid);
    });
  }

  // ── Dano ─────────────────────────────────────────────────────────────────

  /**
   * Define o nível de dano do carro com transição animada.
   * @param {THREE.Object3D} carObject
   * @param {number} damage - 0.0 a 1.0
   * @param {number} duration - duração da transição em segundos (0 = imediato)
   */
  setDamage(carObject, damage, duration = 1.5) {
    damage = Math.max(0, Math.min(1, damage));

    carObject.traverse((child) => {
      if (!child.isMesh) return;
      const entry = this._meshRegistry.get(child.uuid);
      if (!entry) return;

      if (duration <= 0) {
        this._applyDamageImmediate(child.uuid, damage);
      } else {
        this._transitions.set(child.uuid, {
          from: entry.currentDamage,
          to: damage,
          elapsed: 0,
          duration,
        });
      }
    });
  }

  /**
   * Incrementa o dano gradualmente (para simular deterioração com o tempo).
   * @param {THREE.Object3D} carObject
   * @param {number} amount - quanto adicionar (ex: 0.05 por dia de jogo)
   */
  addDamage(carObject, amount) {
    carObject.traverse((child) => {
      if (!child.isMesh) return;
      const entry = this._meshRegistry.get(child.uuid);
      if (!entry) return;
      const newDamage = Math.min(1, entry.currentDamage + amount);
      this.setDamage(carObject, newDamage, 2.0);
    });
  }

  /**
   * Restaura o carro para novo (dano 0) — simula pintura/restauração.
   * @param {THREE.Object3D} carObject
   * @param {number} duration
   */
  restore(carObject, duration = 2.0) {
    this.setDamage(carObject, 0, duration);
  }

  /**
   * Retorna o nível de dano médio do carro (0-1).
   * @param {THREE.Object3D} carObject
   * @returns {number}
   */
  getDamageLevel(carObject) {
    let total = 0;
    let count = 0;
    carObject.traverse((child) => {
      if (!child.isMesh) return;
      const entry = this._meshRegistry.get(child.uuid);
      if (!entry) return;
      total += entry.currentDamage;
      count++;
    });
    return count > 0 ? total / count : 0;
  }

  /**
   * Retorna o label do estágio atual ('pristine', 'worn', 'rusty', etc.)
   */
  getDamageLabel(carObject) {
    const level = this.getDamageLevel(carObject);
    const stage = this._getStage(level);
    return stage?.label ?? 'unknown';
  }

  // ── Update Loop ───────────────────────────────────────────────────────────

  /**
   * Deve ser chamado no loop de animação (requestAnimationFrame).
   */
  update() {
    const delta = this._clock.getDelta();

    for (const [uuid, transition] of this._transitions) {
      transition.elapsed += delta;
      const t = Math.min(transition.elapsed / transition.duration, 1);
      const easedT = this._easeInOutCubic(t);
      const damage = transition.from + (transition.to - transition.from) * easedT;

      this._applyDamageImmediate(uuid, damage);

      if (t >= 1) {
        this._transitions.delete(uuid);
      }
    }
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  _isRustAffected(meshName) {
    if (!meshName) return false;
    const lower = meshName.toLowerCase();
    return RUST_AFFECTED_PARTS.some((part) => lower.includes(part));
  }

  _getStage(damage) {
    return RUST_STAGES.find((s) => damage >= s.min && damage <= s.max) ?? RUST_STAGES[RUST_STAGES.length - 1];
  }

  /**
   * Interpola entre o estágio atual e o próximo para transições suaves.
   */
  _interpolatedConfig(damage) {
    const stageIndex = RUST_STAGES.findIndex((s) => damage >= s.min && damage <= s.max);
    if (stageIndex < 0) return RUST_STAGES[RUST_STAGES.length - 1];

    const stage = RUST_STAGES[stageIndex];
    const nextStage = RUST_STAGES[stageIndex + 1];

    if (!nextStage) return stage;

    const rangeSize = stage.max - stage.min;
    const t = rangeSize > 0 ? (damage - stage.min) / rangeSize : 0;

    return {
      color: stage.color !== null
        ? this._lerpColor(stage.color, nextStage.color ?? stage.color, t)
        : null,
      roughness: stage.roughness + (nextStage.roughness - stage.roughness) * t,
      metalness: stage.metalness + (nextStage.metalness - stage.metalness) * t,
      envMapIntensity: stage.envMapIntensity + (nextStage.envMapIntensity - stage.envMapIntensity) * t,
    };
  }

  _applyDamageImmediate(uuid, damage) {
    const entry = this._meshRegistry.get(uuid);
    if (!entry) return;

    entry.currentDamage = damage;
    const { mesh, originalColor, originalRoughness, originalMetalness } = entry;
    const mat = mesh.material;
    const config = this._interpolatedConfig(damage);

    if (mat.color && config.color !== null) {
      const rustColor = new THREE.Color(config.color);
      // Blend entre cor original e cor de ferrugem baseado no dano
      mat.color.lerpColors(originalColor, rustColor, Math.min(damage * 1.5, 1));
    }

    mat.roughness = originalRoughness + (config.roughness - originalRoughness) * damage;
    mat.metalness = originalMetalness + (config.metalness - originalMetalness) * damage;

    if (mat.envMapIntensity !== undefined) {
      mat.envMapIntensity = config.envMapIntensity;
    }

    // Adiciona emissive escuro em dano extremo (para parecer queimado/corroído)
    if (mat.emissive && damage > 0.8) {
      const intensity = (damage - 0.8) / 0.2;
      mat.emissive.setHex(0x1a0a00);
      mat.emissiveIntensity = intensity * 0.3;
    } else if (mat.emissive) {
      mat.emissiveIntensity = 0;
    }

    mat.needsUpdate = true;
  }

  _lerpColor(colorA, colorB, t) {
    const a = new THREE.Color(colorA);
    const b = new THREE.Color(colorB);
    return a.lerp(b, t).getHex();
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
