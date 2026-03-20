/**
 * WeatherSystem.js
 * Sistema de clima com efeitos visuais (Three.js) e impacto no gameplay.
 *
 * Climas suportados: clear, cloudy, rain, heavyRain, fog, storm
 *
 * Efeitos:
 *  - Visual: partículas de chuva, fog, alteração da iluminação, sombras
 *  - Gameplay: demanda de serviços aumenta em dias de chuva/frio,
 *              tempo de secagem de pintura aumenta em dias úmidos,
 *              clientes pagam mais em dias ruins (pressa para consertar)
 *
 * Integração: importar em Game.js
 */

import * as THREE from 'three';

// ─── Definição dos Climas ─────────────────────────────────────────────────────

export const WEATHER_TYPES = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  HEAVY_RAIN: 'heavyRain',
  FOG: 'fog',
  STORM: 'storm',
};

// Configuração visual de cada clima
const WEATHER_CONFIGS = {
  clear: {
    label: 'Ensolarado',
    emoji: '☀️',
    ambientIntensity: 1.0,
    ambientColor: 0xfff5e0,
    skyColor: 0x87ceeb,
    fogDensity: 0,
    fogColor: 0x87ceeb,
    rainParticles: 0,
    windStrength: 0.1,
    // Gameplay
    demandMultiplier: 1.0,
    dryingTimeMultiplier: 1.0,
    tipMultiplier: 1.0,
    description: 'Dia perfeito para trabalhar na garagem!',
  },
  cloudy: {
    label: 'Nublado',
    emoji: '☁️',
    ambientIntensity: 0.7,
    ambientColor: 0xd0d8e8,
    skyColor: 0x8896a8,
    fogDensity: 0.01,
    fogColor: 0xc0c8d4,
    rainParticles: 0,
    windStrength: 0.2,
    demandMultiplier: 1.1,
    dryingTimeMultiplier: 1.2,
    tipMultiplier: 1.0,
    description: 'Clima fechado. Clientes chegam mais cedo.',
  },
  rain: {
    label: 'Chuva',
    emoji: '🌧️',
    ambientIntensity: 0.5,
    ambientColor: 0xa0b0c0,
    skyColor: 0x5a6a78,
    fogDensity: 0.03,
    fogColor: 0x8090a0,
    rainParticles: 300,
    windStrength: 0.5,
    demandMultiplier: 1.4,
    dryingTimeMultiplier: 1.8,
    tipMultiplier: 1.2,
    description: 'Chuva aumenta problemas com freios e pneus.',
  },
  heavyRain: {
    label: 'Chuva Forte',
    emoji: '⛈️',
    ambientIntensity: 0.3,
    ambientColor: 0x607080,
    skyColor: 0x304050,
    fogDensity: 0.06,
    fogColor: 0x506070,
    rainParticles: 800,
    windStrength: 1.0,
    demandMultiplier: 1.8,
    dryingTimeMultiplier: 2.5,
    tipMultiplier: 1.5,
    description: 'Chuva pesada! Alta demanda por reparos urgentes.',
  },
  fog: {
    label: 'Neblina',
    emoji: '🌫️',
    ambientIntensity: 0.4,
    ambientColor: 0xc8c8c8,
    skyColor: 0xa0a0a0,
    fogDensity: 0.08,
    fogColor: 0xd0d0d0,
    rainParticles: 0,
    windStrength: 0.05,
    demandMultiplier: 1.3,
    dryingTimeMultiplier: 1.5,
    tipMultiplier: 1.1,
    description: 'Neblina densa. Acidentes aumentam a demanda.',
  },
  storm: {
    label: 'Tempestade',
    emoji: '🌩️',
    ambientIntensity: 0.2,
    ambientColor: 0x404860,
    skyColor: 0x202838,
    fogDensity: 0.05,
    fogColor: 0x304050,
    rainParticles: 1200,
    windStrength: 2.0,
    demandMultiplier: 2.2,
    dryingTimeMultiplier: 3.0,
    tipMultiplier: 2.0,
    description: '⚠️ Tempestade! Emergências em massa. Bônus máximo.',
  },
};

// Probabilidade de transição entre climas (ordem: clear, cloudy, rain, heavyRain, fog, storm)
const TRANSITION_MATRIX = {
  clear:     { clear: 0.5, cloudy: 0.35, rain: 0.1,  heavyRain: 0.02, fog: 0.02, storm: 0.01 },
  cloudy:    { clear: 0.3, cloudy: 0.35, rain: 0.2,  heavyRain: 0.08, fog: 0.05, storm: 0.02 },
  rain:      { clear: 0.1, cloudy: 0.25, rain: 0.35, heavyRain: 0.2,  fog: 0.05, storm: 0.05 },
  heavyRain: { clear: 0.05,cloudy: 0.15, rain: 0.35, heavyRain: 0.25, fog: 0.05, storm: 0.15 },
  fog:       { clear: 0.25,cloudy: 0.35, rain: 0.15, heavyRain: 0.05, fog: 0.15, storm: 0.05 },
  storm:     { clear: 0.05,cloudy: 0.1,  rain: 0.3,  heavyRain: 0.35, fog: 0.05, storm: 0.15 },
};

// ─── WeatherSystem ────────────────────────────────────────────────────────────

export class WeatherSystem {
  /**
   * @param {Object} options
   * @param {THREE.Scene} options.scene
   * @param {THREE.Camera} options.camera
   * @param {string} options.initialWeather - key de WEATHER_TYPES
   */
  constructor({ scene, camera, initialWeather = WEATHER_TYPES.CLEAR }) {
    this._scene = scene;
    this._camera = camera;

    this._currentWeather = initialWeather;
    this._targetWeather = initialWeather;
    this._transitioning = false;
    this._transitionProgress = 0;
    this._transitionDuration = 5.0; // segundos

    // Luzes
    this._ambientLight = null;
    this._directionalLight = null;

    // Chuva
    this._rainParticles = null;
    this._rainGeometry = null;
    this._rainVelocities = null;

    // Lightning
    this._lightningLight = null;
    this._lightningTimer = 0;

    // Transição suave de cores do sky
    this._renderer = null;

    this._listeners = {};
    this._clock = new THREE.Clock();

    // Cache dos configs para interpolação
    this._fromConfig = WEATHER_CONFIGS[initialWeather];
    this._toConfig = WEATHER_CONFIGS[initialWeather];

    // Auto-transição climática
    this._autoTransitionTimer = 0;
    this._autoTransitionInterval = 300; // segundos de jogo entre mudanças automáticas
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * @param {THREE.WebGLRenderer} renderer
   */
  init(renderer) {
    this._renderer = renderer;
    this._findOrCreateLights();
    this._createLightningLight();
    this._applyWeatherImmediate(this._currentWeather);
    this._buildWeatherUI();
    console.log('[WeatherSystem] Inicializado com clima:', this._currentWeather);
  }

  dispose() {
    this._removeRainParticles();
    this._weatherUI?.remove();
  }

  // ── Update Loop ────────────────────────────────────────────────────────────

  update() {
    const delta = this._clock.getDelta();

    // Transição suave entre climas
    if (this._transitioning) {
      this._transitionProgress += delta / this._transitionDuration;
      if (this._transitionProgress >= 1) {
        this._transitionProgress = 1;
        this._transitioning = false;
        this._currentWeather = this._targetWeather;
        this._fromConfig = WEATHER_CONFIGS[this._currentWeather];
        this._emit('weatherChange', {
          weather: this._currentWeather,
          config: this._fromConfig,
        });
      }
      this._interpolateLighting(this._transitionProgress);
    }

    // Animação das partículas de chuva
    if (this._rainParticles) {
      this._animateRain(delta);
    }

    // Relâmpagos em tempestades
    if (this._currentWeather === WEATHER_TYPES.STORM || this._targetWeather === WEATHER_TYPES.STORM) {
      this._updateLightning(delta);
    }

    // Auto-transição
    this._autoTransitionTimer += delta;
    if (this._autoTransitionTimer >= this._autoTransitionInterval) {
      this._autoTransitionTimer = 0;
      this._triggerAutoTransition();
    }
  }

  // ── Controle de Clima ──────────────────────────────────────────────────────

  /**
   * Transiciona para um novo clima gradualmente.
   * @param {string} weatherType - key de WEATHER_TYPES
   * @param {number} duration - duração da transição em segundos
   */
  setWeather(weatherType, duration = 5.0) {
    if (!WEATHER_CONFIGS[weatherType]) {
      console.warn('[WeatherSystem] Clima desconhecido:', weatherType);
      return;
    }
    if (weatherType === this._currentWeather && !this._transitioning) return;

    this._fromConfig = this._getCurrentInterpolatedConfig();
    this._toConfig = WEATHER_CONFIGS[weatherType];
    this._targetWeather = weatherType;
    this._transitionDuration = duration;
    this._transitionProgress = 0;
    this._transitioning = true;

    // Atualiza partículas de chuva
    this._updateRainParticles(this._toConfig.rainParticles);

    this._emit('weatherTransitionStart', { from: this._currentWeather, to: weatherType });
    this._updateUI();

    console.log(`[WeatherSystem] Mudando clima: ${this._currentWeather} → ${weatherType}`);
  }

  /**
   * Define o clima imediatamente (sem transição).
   */
  _applyWeatherImmediate(weatherType) {
    const config = WEATHER_CONFIGS[weatherType];
    if (!config) return;

    if (this._ambientLight) {
      this._ambientLight.intensity = config.ambientIntensity;
      this._ambientLight.color.setHex(config.ambientColor);
    }
    if (this._directionalLight) {
      this._directionalLight.intensity = config.ambientIntensity * 1.2;
    }
    if (this._renderer) {
      this._renderer.setClearColor(config.skyColor, 1);
    }
    this._scene.fog = config.fogDensity > 0
      ? new THREE.FogExp2(config.fogColor, config.fogDensity)
      : null;

    this._updateRainParticles(config.rainParticles);
    this._currentWeather = weatherType;
    this._fromConfig = config;
    this._toConfig = config;
    this._updateUI();
  }

  // ── Gameplay Getters ───────────────────────────────────────────────────────

  get currentWeather() { return this._currentWeather; }
  get currentConfig() { return WEATHER_CONFIGS[this._currentWeather]; }

  /** Multiplicador de demanda de serviços baseado no clima atual. */
  get demandMultiplier() {
    return this._getCurrentInterpolatedConfig().demandMultiplier ?? 1;
  }

  /** Multiplicador de tempo de secagem de pintura. */
  get dryingTimeMultiplier() {
    return this._getCurrentInterpolatedConfig().dryingTimeMultiplier ?? 1;
  }

  /** Multiplicador de gorjeta por clima ruim. */
  get tipMultiplier() {
    return this._getCurrentInterpolatedConfig().tipMultiplier ?? 1;
  }

  isRaining() {
    return [WEATHER_TYPES.RAIN, WEATHER_TYPES.HEAVY_RAIN, WEATHER_TYPES.STORM].includes(this._currentWeather);
  }

  // ── Luzes ──────────────────────────────────────────────────────────────────

  _findOrCreateLights() {
    this._scene.traverse((obj) => {
      if (obj.isAmbientLight && !this._ambientLight) this._ambientLight = obj;
      if (obj.isDirectionalLight && !this._directionalLight) this._directionalLight = obj;
    });

    if (!this._ambientLight) {
      this._ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      this._scene.add(this._ambientLight);
    }
    if (!this._directionalLight) {
      this._directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      this._directionalLight.position.set(5, 10, 5);
      this._scene.add(this._directionalLight);
    }
  }

  _createLightningLight() {
    this._lightningLight = new THREE.PointLight(0xaabbff, 0, 50);
    this._lightningLight.position.set(0, 10, 0);
    this._scene.add(this._lightningLight);
  }

  _interpolateLighting(t) {
    const from = this._fromConfig;
    const to = this._toConfig;

    const eased = this._easeInOut(t);

    if (this._ambientLight) {
      this._ambientLight.intensity = from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * eased;
      const fromColor = new THREE.Color(from.ambientColor);
      const toColor = new THREE.Color(to.ambientColor);
      this._ambientLight.color.lerpColors(fromColor, toColor, eased);
    }

    if (this._directionalLight) {
      this._directionalLight.intensity = (from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * eased) * 1.2;
    }

    if (this._renderer) {
      const fromSky = new THREE.Color(from.skyColor);
      const toSky = new THREE.Color(to.skyColor);
      const blended = fromSky.lerp(toSky, eased);
      this._renderer.setClearColor(blended, 1);
    }

    // Fog
    const fogDensity = from.fogDensity + (to.fogDensity - from.fogDensity) * eased;
    if (fogDensity > 0) {
      const fromFog = new THREE.Color(from.fogColor);
      const toFog = new THREE.Color(to.fogColor);
      this._scene.fog = new THREE.FogExp2(fromFog.lerp(toFog, eased).getHex(), fogDensity);
    } else {
      this._scene.fog = null;
    }
  }

  // ── Chuva ──────────────────────────────────────────────────────────────────

  _updateRainParticles(targetCount) {
    if (targetCount > 0 && !this._rainParticles) {
      this._createRainParticles(targetCount);
    } else if (targetCount === 0 && this._rainParticles) {
      this._removeRainParticles();
    } else if (this._rainParticles) {
      // Recria com nova quantidade
      this._removeRainParticles();
      if (targetCount > 0) this._createRainParticles(targetCount);
    }
  }

  _createRainParticles(count) {
    const positions = new Float32Array(count * 3);
    this._rainVelocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      this._rainVelocities[i] = 3 + Math.random() * 4;
    }

    this._rainGeometry = new THREE.BufferGeometry();
    this._rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this._rainParticles = new THREE.Points(this._rainGeometry, material);
    this._scene.add(this._rainParticles);
  }

  _animateRain(delta) {
    if (!this._rainGeometry) return;
    const positions = this._rainGeometry.attributes.position.array;
    const count = positions.length / 3;
    const config = WEATHER_CONFIGS[this._targetWeather];
    const windX = config?.windStrength ?? 0;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= this._rainVelocities[i] * delta;
      positions[i * 3]     += windX * delta * 0.5;

      // Reposiciona partícula quando cai abaixo do chão
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = 10 + Math.random() * 4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    this._rainGeometry.attributes.position.needsUpdate = true;
  }

  _removeRainParticles() {
    if (this._rainParticles) {
      this._scene.remove(this._rainParticles);
      this._rainGeometry?.dispose();
      this._rainParticles.material?.dispose();
      this._rainParticles = null;
      this._rainGeometry = null;
    }
  }

  // ── Relâmpagos ─────────────────────────────────────────────────────────────

  _updateLightning(delta) {
    this._lightningTimer -= delta;
    if (this._lightningTimer <= 0) {
      this._lightningTimer = 4 + Math.random() * 8;
      this._triggerLightning();
    }
  }

  _triggerLightning() {
    if (!this._lightningLight) return;
    let t = 0;
    const flash = () => {
      t += 0.05;
      this._lightningLight.intensity = Math.max(0, Math.sin(t * 20) * 5 * Math.exp(-t * 3));
      if (t < 1.5) requestAnimationFrame(flash);
    };
    flash();
  }

  // ── Auto-transição ─────────────────────────────────────────────────────────

  _triggerAutoTransition() {
    const matrix = TRANSITION_MATRIX[this._currentWeather];
    if (!matrix) return;

    const rand = Math.random();
    let cumulative = 0;
    for (const [weather, prob] of Object.entries(matrix)) {
      cumulative += prob;
      if (rand <= cumulative) {
        if (weather !== this._currentWeather) {
          this.setWeather(weather, 8.0);
        }
        break;
      }
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  _buildWeatherUI() {
    document.getElementById('weather-widget')?.remove();

    if (!document.getElementById('weather-styles')) {
      const style = document.createElement('style');
      style.id = 'weather-styles';
      style.textContent = `
        #weather-widget {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: white;
          font-family: 'Courier New', monospace;
          z-index: 1000;
          min-width: 160px;
          backdrop-filter: blur(8px);
          transition: border-color 0.5s;
        }
        #weather-widget .w-header { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        #weather-widget .w-main { font-size: 22px; display: flex; align-items: center; gap: 8px; }
        #weather-widget .w-label { font-size: 13px; color: #ddd; margin-top: 2px; }
        #weather-widget .w-effects { font-size: 10px; color: #aaa; margin-top: 6px; }
        #weather-widget .w-effect { padding: 2px 0; }
        #weather-widget .up { color: #ff6b6b; }
        #weather-widget .down { color: #51cf66; }
      `;
      document.head.appendChild(style);
    }

    const widget = document.createElement('div');
    widget.id = 'weather-widget';
    document.body.appendChild(widget);
    this._weatherUI = widget;
    this._updateUI();
  }

  _updateUI() {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;

    const config = WEATHER_CONFIGS[this._targetWeather];
    if (!config) return;

    const demandUp = config.demandMultiplier > 1;
    const tipUp = config.tipMultiplier > 1;

    widget.innerHTML = `
      <div class="w-header">🌤 Clima Atual</div>
      <div class="w-main">
        <span>${config.emoji}</span>
        <div>
          <div class="w-label">${config.label}</div>
        </div>
      </div>
      <div class="w-effects">
        <div class="w-effect ${demandUp ? 'up' : 'down'}">
          📋 Demanda: ${demandUp ? '+' : ''}${Math.round((config.demandMultiplier - 1) * 100)}%
        </div>
        <div class="w-effect ${tipUp ? 'up' : 'down'}">
          💰 Gorjetas: ${tipUp ? '+' : ''}${Math.round((config.tipMultiplier - 1) * 100)}%
        </div>
        <div class="w-effect" style="color:#aaa">
          🎨 Secagem: ${config.dryingTimeMultiplier}x
        </div>
      </div>
    `;

    // Cor da borda muda com o clima
    const borderColors = { clear: '#f4d03f', cloudy: '#888', rain: '#3498db', heavyRain: '#2980b9', fog: '#aaa', storm: '#e74c3c' };
    widget.style.borderColor = borderColors[this._targetWeather] ?? 'rgba(255,255,255,0.1)';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _getCurrentInterpolatedConfig() {
    if (!this._transitioning) return WEATHER_CONFIGS[this._currentWeather];
    const t = this._transitionProgress;
    const from = this._fromConfig;
    const to = this._toConfig;
    return {
      demandMultiplier: from.demandMultiplier + (to.demandMultiplier - from.demandMultiplier) * t,
      dryingTimeMultiplier: from.dryingTimeMultiplier + (to.dryingTimeMultiplier - from.dryingTimeMultiplier) * t,
      tipMultiplier: from.tipMultiplier + (to.tipMultiplier - from.tipMultiplier) * t,
    };
  }

  _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data = {}) {
    (this._listeners[event] ?? []).forEach((cb) => cb(data));
  }
}
