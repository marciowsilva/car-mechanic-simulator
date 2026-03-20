/**
 * NightEmergencyMode.js
 * Modo de emergência noturno: iluminação dramaticamente alterada,
 * clientes desesperados chegam tarde da noite com bônus de gorjeta,
 * e a garagem fica com iluminação de workshop noturno.
 *
 * Integração: importar em Game.js
 * Requer acesso à cena Three.js (Scene3D / OptimizedGarage) e CustomerSystem.
 */

import * as THREE from 'three';

// ─── Configuração ─────────────────────────────────────────────────────────────

const NIGHT_CONFIG = {
  // Horário em que o modo noturno começa (em "horas de jogo" 0-24)
  startHour: 22,
  endHour: 6,

  // Multiplicador de gorjeta em emergências noturnas
  tipMultiplier: 2.5,

  // Chance de um cliente de emergência aparecer por hora noturna (0-1)
  emergencySpawnChance: 0.35,

  // Iluminação da garagem no modo noturno
  ambientLightIntensity: 0.15,
  ambientLightColor: 0x1a1a3e,

  // Luz de trabalho sobre o carro
  workLampColor: 0xffe8b0,
  workLampIntensity: 2.5,
  workLampDistance: 6,

  // Luzes de neon/emergência
  emergencyLightColor: 0xff3300,
  emergencyLightIntensity: 0.8,

  // Fog noturno
  fogColor: 0x050510,
  fogNear: 10,
  fogFar: 30,
};

// Tipos de emergências noturnas com bônus de gorjeta
export const EMERGENCY_JOB_TYPES = [
  {
    id: 'flat_tire_night',
    title: 'Pneu Furado - Emergência',
    description: 'Cliente preso na estrada com pneu furado às 2h da manhã.',
    urgency: 'critical',
    tipBonus: 150,
    timeLimit: 600, // 10 minutos de jogo
    emoji: '🛞',
  },
  {
    id: 'dead_battery_night',
    title: 'Bateria Morta - SOS',
    description: 'Motorista sozinho com bateria descarregada no posto abandonado.',
    urgency: 'critical',
    tipBonus: 120,
    timeLimit: 480,
    emoji: '🔋',
  },
  {
    id: 'overheating_night',
    title: 'Motor Superaquecendo',
    description: 'Carro fumegando na beira da estrada. Precisa de ajuda urgente!',
    urgency: 'high',
    tipBonus: 180,
    timeLimit: 720,
    emoji: '🌡️',
  },
  {
    id: 'brake_failure_night',
    title: 'Freios Falhando - URGENTE',
    description: 'Motorista com freios falhos, com medo de rodar mais. Emergência total.',
    urgency: 'critical',
    tipBonus: 250,
    timeLimit: 900,
    emoji: '⚠️',
  },
  {
    id: 'lock_out_night',
    title: 'Chave Trancada no Carro',
    description: 'Família trancada fora do carro no frio da madrugada.',
    urgency: 'medium',
    tipBonus: 90,
    timeLimit: 300,
    emoji: '🔑',
  },
];

// ─── NightEmergencyMode ───────────────────────────────────────────────────────

export class NightEmergencyMode {
  /**
   * @param {Object} options
   * @param {THREE.Scene} options.scene
   * @param {Object} options.gameTime - { hour: number } (hora do jogo 0-24)
   * @param {Object} options.customerSystem - instância de CustomerSystem
   * @param {Object} options.uiManager - instância de UIManager
   */
  constructor({ scene, gameTime, customerSystem, uiManager }) {
    this._scene = scene;
    this._gameTime = gameTime;
    this._customerSystem = customerSystem;
    this._uiManager = uiManager;

    this._isNightMode = false;
    this._isEmergencyActive = false;

    // Referências às luzes criadas
    this._originalAmbientLight = null;
    this._workLamp = null;
    this._emergencyLight1 = null;
    this._emergencyLight2 = null;
    this._nightFog = null;
    this._originalFog = null;

    // Stars / partículas de chuva fina (visual de madrugada)
    this._nightParticles = null;

    // Listeners
    this._listeners = {};

    // Timer de spawning de emergências
    this._emergencyCheckInterval = null;

    // Estado da UI
    this._emergencyAlert = null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    this._findExistingLights();
    this._buildEmergencyAlertUI();
    console.log('[NightEmergencyMode] Inicializado.');
  }

  dispose() {
    this.deactivateNightMode();
    clearInterval(this._emergencyCheckInterval);
    this._emergencyAlert?.remove();
  }

  // ── Update Loop ────────────────────────────────────────────────────────────

  /**
   * Deve ser chamado no update do Game.js com a hora atual do jogo.
   * @param {number} gameHour - 0 a 23.99
   */
  update(gameHour) {
    const shouldBeNight = this._isNightHour(gameHour);

    if (shouldBeNight && !this._isNightMode) {
      this.activateNightMode();
    } else if (!shouldBeNight && this._isNightMode) {
      this.deactivateNightMode();
    }
  }

  // ── Ativação do Modo Noturno ───────────────────────────────────────────────

  activateNightMode() {
    if (this._isNightMode) return;
    this._isNightMode = true;

    this._applyNightLighting();
    this._applyNightFog();
    this._createNightParticles();
    this._startEmergencySpawner();

    this._emit('nightStart');
    this._showNightToast('🌙 Modo Noturno Ativado — Emergências com bônus de gorjeta!');

    console.log('[NightEmergencyMode] Modo noturno ativado.');
  }

  deactivateNightMode() {
    if (!this._isNightMode) return;
    this._isNightMode = false;

    this._restoreDayLighting();
    this._removeNightFog();
    this._removeNightParticles();
    clearInterval(this._emergencyCheckInterval);

    this._emit('nightEnd');
    console.log('[NightEmergencyMode] Modo diurno restaurado.');
  }

  // ── Iluminação ─────────────────────────────────────────────────────────────

  _findExistingLights() {
    this._scene.traverse((obj) => {
      if (obj.isAmbientLight) this._originalAmbientLight = obj;
    });
  }

  _applyNightLighting() {
    // Escurece luz ambiente
    if (this._originalAmbientLight) {
      this._originalAmbientLight._dayIntensity = this._originalAmbientLight.intensity;
      this._originalAmbientLight._dayColor = this._originalAmbientLight.color.clone();
      this._originalAmbientLight.intensity = NIGHT_CONFIG.ambientLightIntensity;
      this._originalAmbientLight.color.setHex(NIGHT_CONFIG.ambientLightColor);
    }

    // Luz de trabalho (lâmpada sobre o carro)
    if (!this._workLamp) {
      this._workLamp = new THREE.SpotLight(
        NIGHT_CONFIG.workLampColor,
        NIGHT_CONFIG.workLampIntensity,
        NIGHT_CONFIG.workLampDistance,
        Math.PI / 4,
        0.5
      );
      this._workLamp.position.set(0, 5, 0);
      this._workLamp.target.position.set(0, 0, 0);
      this._workLamp.castShadow = true;
      this._scene.add(this._workLamp);
      this._scene.add(this._workLamp.target);
    }
    this._workLamp.visible = true;

    // Luz de emergência piscante (vermelha)
    if (!this._emergencyLight1) {
      this._emergencyLight1 = new THREE.PointLight(NIGHT_CONFIG.emergencyLightColor, 0, 8);
      this._emergencyLight1.position.set(-4, 3, 0);
      this._scene.add(this._emergencyLight1);
    }
    if (!this._emergencyLight2) {
      this._emergencyLight2 = new THREE.PointLight(NIGHT_CONFIG.emergencyLightColor, 0, 8);
      this._emergencyLight2.position.set(4, 3, 0);
      this._scene.add(this._emergencyLight2);
    }
    this._emergencyLight1.visible = true;
    this._emergencyLight2.visible = true;
    this._startEmergencyLightPulse();
  }

  _restoreDayLighting() {
    if (this._originalAmbientLight?._dayIntensity !== undefined) {
      this._originalAmbientLight.intensity = this._originalAmbientLight._dayIntensity;
      this._originalAmbientLight.color.copy(this._originalAmbientLight._dayColor);
    }
    if (this._workLamp) this._workLamp.visible = false;
    if (this._emergencyLight1) this._emergencyLight1.visible = false;
    if (this._emergencyLight2) this._emergencyLight2.visible = false;
  }

  _startEmergencyLightPulse() {
    let t = 0;
    const pulse = () => {
      if (!this._isNightMode) return;
      t += 0.05;
      const intensity = this._isEmergencyActive
        ? Math.abs(Math.sin(t * 3)) * NIGHT_CONFIG.emergencyLightIntensity
        : 0;

      if (this._emergencyLight1) this._emergencyLight1.intensity = intensity;
      if (this._emergencyLight2) this._emergencyLight2.intensity = intensity * 0.6;

      requestAnimationFrame(pulse);
    };
    pulse();
  }

  // ── Fog ────────────────────────────────────────────────────────────────────

  _applyNightFog() {
    this._originalFog = this._scene.fog;
    this._scene.fog = new THREE.Fog(
      NIGHT_CONFIG.fogColor,
      NIGHT_CONFIG.fogNear,
      NIGHT_CONFIG.fogFar
    );
  }

  _removeNightFog() {
    this._scene.fog = this._originalFog;
  }

  // ── Partículas Noturnas ────────────────────────────────────────────────────

  _createNightParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this._nightParticles = new THREE.Points(geometry, material);
    this._scene.add(this._nightParticles);
  }

  _removeNightParticles() {
    if (this._nightParticles) {
      this._scene.remove(this._nightParticles);
      this._nightParticles.geometry.dispose();
      this._nightParticles.material.dispose();
      this._nightParticles = null;
    }
  }

  // ── Emergências ────────────────────────────────────────────────────────────

  _startEmergencySpawner() {
    clearInterval(this._emergencyCheckInterval);
    // Verifica a cada 3 minutos reais se uma emergência deve aparecer
    this._emergencyCheckInterval = setInterval(() => {
      if (!this._isNightMode) return;
      if (Math.random() < NIGHT_CONFIG.emergencySpawnChance) {
        this._spawnEmergency();
      }
    }, 3 * 60 * 1000);
  }

  _spawnEmergency() {
    const jobType = EMERGENCY_JOB_TYPES[Math.floor(Math.random() * EMERGENCY_JOB_TYPES.length)];
    this._isEmergencyActive = true;

    // Cria job de emergência no CustomerSystem se disponível
    if (this._customerSystem?.addEmergencyJob) {
      this._customerSystem.addEmergencyJob({
        ...jobType,
        tipMultiplier: NIGHT_CONFIG.tipMultiplier,
        isNightEmergency: true,
        expiresIn: jobType.timeLimit,
      });
    }

    this._showEmergencyAlert(jobType);
    this._emit('emergency', { job: jobType });

    // Desativa o estado de emergência após o time limit
    setTimeout(() => {
      this._isEmergencyActive = false;
    }, jobType.timeLimit * 1000);
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  _buildEmergencyAlertUI() {
    if (!document.getElementById('night-emergency-styles')) {
      const style = document.createElement('style');
      style.id = 'night-emergency-styles';
      style.textContent = `
        #emergency-alert {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1a0000, #3d0000);
          border: 2px solid #ff3300;
          border-radius: 12px;
          padding: 16px 24px;
          color: white;
          font-family: 'Courier New', monospace;
          z-index: 9999;
          min-width: 320px;
          text-align: center;
          box-shadow: 0 0 30px rgba(255,51,0,0.5), 0 0 60px rgba(255,51,0,0.2);
          animation: emergency-pulse 0.5s ease-in-out infinite alternate;
          display: none;
        }
        #emergency-alert.visible { display: block; }
        #emergency-alert .alert-title { color: #ff3300; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
        #emergency-alert .alert-desc { color: #ffcccc; font-size: 12px; margin-bottom: 8px; }
        #emergency-alert .alert-bonus { color: #ffdd00; font-size: 12px; font-weight: bold; }
        #emergency-alert .alert-close {
          position: absolute;
          top: 6px; right: 10px;
          background: none;
          border: none;
          color: #ff3300;
          cursor: pointer;
          font-size: 16px;
        }
        @keyframes emergency-pulse {
          from { box-shadow: 0 0 20px rgba(255,51,0,0.5); }
          to { box-shadow: 0 0 40px rgba(255,51,0,0.8), 0 0 80px rgba(255,51,0,0.3); }
        }
        #night-toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10,10,30,0.95);
          border: 1px solid rgba(100,100,255,0.4);
          border-radius: 8px;
          padding: 10px 20px;
          color: #aaaaff;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          z-index: 9998;
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        #night-toast.visible { opacity: 1; }
      `;
      document.head.appendChild(style);
    }

    const alert = document.createElement('div');
    alert.id = 'emergency-alert';
    alert.innerHTML = `
      <button class="alert-close" id="emergency-close">✕</button>
      <div class="alert-title" id="alert-title"></div>
      <div class="alert-desc" id="alert-desc"></div>
      <div class="alert-bonus" id="alert-bonus"></div>
    `;
    document.body.appendChild(alert);
    this._emergencyAlert = alert;

    document.getElementById('emergency-close')?.addEventListener('click', () => {
      alert.classList.remove('visible');
    });

    // Toast
    const toast = document.createElement('div');
    toast.id = 'night-toast';
    document.body.appendChild(toast);
  }

  _showEmergencyAlert(jobType) {
    const alert = this._emergencyAlert;
    if (!alert) return;

    document.getElementById('alert-title').textContent = `${jobType.emoji} ${jobType.title}`;
    document.getElementById('alert-desc').textContent = jobType.description;
    document.getElementById('alert-bonus').textContent =
      `💰 Bônus de Gorjeta: +R$${jobType.tipBonus} • Urgência: ${jobType.urgency.toUpperCase()}`;

    alert.classList.add('visible');

    setTimeout(() => alert.classList.remove('visible'), 12000);
  }

  _showNightToast(message) {
    const toast = document.getElementById('night-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _isNightHour(hour) {
    const { startHour, endHour } = NIGHT_CONFIG;
    if (startHour > endHour) {
      // Período passa da meia-noite: ex 22 → 6
      return hour >= startHour || hour < endHour;
    }
    return hour >= startHour && hour < endHour;
  }

  // ── Eventos ────────────────────────────────────────────────────────────────

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data = {}) {
    (this._listeners[event] ?? []).forEach((cb) => cb(data));
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get isNightMode() { return this._isNightMode; }
  get isEmergencyActive() { return this._isEmergencyActive; }
}
