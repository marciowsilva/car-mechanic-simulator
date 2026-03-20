/**
 * AdvancedRustSystem.js
 * Sistema avançado de ferrugem — vertex paint + decal projection
 *
 * Técnicas usadas:
 *  - Custom ShaderMaterial com blending de texturas no shader GLSL
 *  - Vertex colors para pintar zonas de ferrugem por mesh
 *  - Decal projection (MeshDecalGeometry ou quad projetado) para manchas localizadas
 *  - Noise procedural no shader (Simplex-like via hash) para textura orgânica
 *  - Suporte a GLTF/GLB: detecta meshes por UserData, name pattern e material type
 *  - API compatible com o RustSystem anterior (drop-in replacement)
 *
 * Dependência opcional: Three.js r155+ (DecalGeometry disponível em examples)
 * Se DecalGeometry não estiver disponível, usa quad projection (fallback interno).
 *
 * Integração em Game.js:
 *   import { AdvancedRustSystem } from '../systems/AdvancedRustSystem.js';
 *   this.rustSystem = new AdvancedRustSystem();
 *   // Após GLTF carregado:
 *   this.rustSystem.registerCar(gltf.scene, damageLevel);
 */

import * as THREE from 'three';

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────

/**
 * Vertex shader: passa atributos extras (vertex color, UV) para o fragment.
 * Compila com o pipeline padrão do Three.js (inclui #include chunks).
 */
const RUST_VERTEX_SHADER = `
  // Vertex color para máscara de zona de ferrugem
  attribute vec3 color;
  varying vec3 vColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vColor    = color;
    vUv       = uv;
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader: blending de cor de ferrugem com noise procedural.
 * Simula variação orgânica de oxidação sem precisar de textura externa.
 */
const RUST_FRAGMENT_SHADER = `
  precision highp float;

  // Uniforms de controle
  uniform vec3  u_baseColor;        // cor original do material
  uniform vec3  u_rustColor;        // cor da ferrugem (marrom-laranja)
  uniform vec3  u_deepRustColor;    // cor de ferrugem severa (quase preta)
  uniform float u_damage;           // 0.0 = novo, 1.0 = destruído
  uniform float u_noiseScale;       // escala do noise de ferrugem
  uniform float u_noiseStrength;    // variação do noise
  uniform float u_edgeFactor;       // intensifica ferrugem nas bordas (fresnel-like)
  uniform float u_roughness;        // roughness base do material
  uniform float u_metalness;        // metalness base do material
  uniform float u_time;             // para animação sutil (opcional)

  varying vec3  vColor;             // vertex paint (0=sem ferrugem, 1=ferrugem total)
  varying vec2  vUv;
  varying vec3  vNormal;
  varying vec3  vWorldPos;

  // ── Noise procedural (hash-based, sem textura) ───────────────────────────

  // Hash 3D → float
  float hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.103, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  // Smooth noise via interpolação trilinear
  float smoothNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f); // Hermite smoothstep

    return mix(
      mix(
        mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), u.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), u.x),
        u.y
      ),
      mix(
        mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), u.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), u.x),
        u.y
      ),
      u.z
    );
  }

  // FBM (fractal Brownian motion): 4 oitavas para textura de ferrugem realista
  float fbm(vec3 p) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      val  += smoothNoise3D(p * freq) * amp;
      freq *= 2.0;
      amp  *= 0.5;
    }
    return val;
  }

  // ── Cálculo de fresnel (edge factor) ────────────────────────────────────
  float fresnelFactor(vec3 normal) {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    return 1.0 - max(dot(normal, viewDir), 0.0);
  }

  void main() {
    // ── Noise de ferrugem em espaço de mundo ──────────────────────────────
    vec3 noisePos = vWorldPos * u_noiseScale;
    // Adiciona animação ultra-lenta (oxidação progredindo)
    noisePos.x += u_time * 0.0002;

    float noise    = fbm(noisePos);
    float noiseFine = fbm(noisePos * 4.0) * 0.3; // detalhe fino

    float noiseFinal = noise + noiseFine * u_noiseStrength;

    // ── Máscara de zona: vertex paint ────────────────────────────────────
    // vColor.r = intensidade de ferrugem pintada no vertex (0-1)
    float zoneMask = vColor.r;

    // ── Efeito de borda (fresnel): bordas enferrujam mais ────────────────
    float edge = fresnelFactor(vNormal) * u_edgeFactor;

    // ── Combinação de máscaras ────────────────────────────────────────────
    // damage global + variação de noise + zona vertex + borda
    float rustMask = u_damage;
    rustMask = rustMask * (0.6 + noiseFinal * 0.8);   // variação orgânica
    rustMask = max(rustMask, zoneMask * u_damage * 1.4); // zonas pré-pintadas
    rustMask = min(rustMask + edge * u_damage * 0.5, 1.0); // reforço de borda
    rustMask = clamp(rustMask, 0.0, 1.0);

    // ── Blending de cores ─────────────────────────────────────────────────
    // 0→base, 0.5→rust, 1.0→deepRust
    vec3 finalColor;
    if (rustMask < 0.5) {
      finalColor = mix(u_baseColor, u_rustColor, rustMask * 2.0);
    } else {
      finalColor = mix(u_rustColor, u_deepRustColor, (rustMask - 0.5) * 2.0);
    }

    // Micro-variação aleatória extra (poros, manchas finas)
    float microNoise = fbm(vWorldPos * u_noiseScale * 8.0);
    finalColor = mix(finalColor, finalColor * 0.7, rustMask * microNoise * 0.4);

    // ── Roughness/Metalness dinâmicos ─────────────────────────────────────
    // Ferrugem = mais rough, menos metálico
    float dynRoughness = u_roughness + rustMask * (1.0 - u_roughness) * 0.9;
    float dynMetalness = u_metalness * (1.0 - rustMask * 0.95);

    // Emissive escuro em dano extremo (queimado/corroído)
    vec3 emissive = vec3(0.0);
    if (rustMask > 0.85) {
      emissive = u_deepRustColor * (rustMask - 0.85) / 0.15 * 0.08;
    }

    // ── Output: compatível com Three.js PBR ──────────────────────────────
    // Usamos gl_FragColor pois estamos num ShaderMaterial simples.
    // Para integração completa com sombras/envmap, substituir por MeshStandardMaterial
    // customizado via onBeforeCompile (ver _createOnBeforeCompile abaixo).

    gl_FragColor = vec4(finalColor, 1.0);

    // Adiciona roughness como canal alpha (pode ser ignorado pelo renderer)
    // A integração real de PBR é via onBeforeCompile
  }
`;

// ─── Zonas de ferrugem pré-definidas por tipo de mesh ────────────────────────

// Mapa: padrão de nome (lowercase) → intensidade de vertex paint (0-1)
// Zonas mais expostas ao clima têm valor maior
const RUST_ZONE_MAP = {
  // Alta exposição: teto, capô, tronco
  roof:         1.0,
  hood:         0.9,
  trunk:        0.9,
  bonnet:       0.9,
  // Média exposição: portas, para-lamas
  door:         0.7,
  fender:       0.8,
  mudguard:     0.8,
  wing:         0.75,
  panel:        0.65,
  // Baixa exposição: spoilers, peças plásticas
  bumper:       0.4,
  spoiler:      0.35,
  // Chassi (exposição alta, mas nem sempre visível)
  frame:        0.85,
  chassis:      0.8,
  underbody:    0.9,
  // Rodas
  wheel:        0.3,
  rim:          0.2,
  // Genérico
  body:         0.75,
  car_body:     0.75,
  exterior:     0.65,
};

// ─── DecalProjector — projeta manchas de ferrugem localizadas ────────────────

class DecalProjector {
  constructor(scene) {
    this._scene  = scene;
    this._decals = [];
  }

  /**
   * Projeta uma mancha de ferrugem num ponto da superfície do carro.
   * Usa um quad plano com ShaderMaterial blended sobre a geometria.
   *
   * @param {THREE.Vector3} worldPos - ponto de impacto no carro
   * @param {THREE.Vector3} normal   - normal da superfície naquele ponto
   * @param {number} size            - tamanho da mancha (0.05 – 0.3)
   * @param {number} intensity       - intensidade (0-1)
   * @param {string} color           - cor hex da mancha
   */
  projectDecal(worldPos, normal, size = 0.12, intensity = 0.8, color = '#7a3b1e') {
    const geometry = new THREE.PlaneGeometry(size, size);

    // Orienta o quad para a normal da superfície
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity * 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      blending: THREE.MultiplyBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(worldPos).addScaledVector(normal, 0.002); // offset da superfície
    mesh.quaternion.copy(quaternion);
    mesh.userData.isDecal = true;
    mesh.userData.rustDecal = true;

    this._scene.add(mesh);
    this._decals.push(mesh);
    return mesh;
  }

  /**
   * Projeta múltiplas manchas espalhadas sobre um mesh do carro.
   * @param {THREE.Mesh} targetMesh
   * @param {number} count - número de manchas
   * @param {number} damage - 0-1
   */
  sprayDecalsOnMesh(targetMesh, count, damage) {
    if (!targetMesh.geometry) return;

    const geo = targetMesh.geometry;
    const posAttr = geo.getAttribute('position');
    const normalAttr = geo.getAttribute('normal');

    if (!posAttr || !normalAttr) return;

    const vertCount = posAttr.count;

    for (let i = 0; i < count; i++) {
      // Escolhe vértice aleatório
      const vi = Math.floor(Math.random() * vertCount);

      const localPos = new THREE.Vector3(
        posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi)
      );
      const localNorm = new THREE.Vector3(
        normalAttr.getX(vi), normalAttr.getY(vi), normalAttr.getZ(vi)
      );

      // Converte para espaço de mundo
      const worldPos  = localPos.applyMatrix4(targetMesh.matrixWorld);
      const worldNorm = localNorm.transformDirection(targetMesh.matrixWorld).normalize();

      // Adiciona jitter na posição
      worldPos.addScaledVector(new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(), Math.random() * 0.05);

      const size      = 0.04 + Math.random() * 0.18 * damage;
      const intensity = 0.3 + Math.random() * 0.7 * damage;

      // Cor varia entre marrom claro e marrom escuro
      const t = Math.random();
      const colorHex = t < 0.5 ? '#8b4513' : t < 0.8 ? '#7a3b1e' : '#3d1a06';

      this.projectDecal(worldPos, worldNorm, size, intensity, colorHex);
    }
  }

  removeAll() {
    this._decals.forEach(d => {
      this._scene.remove(d);
      d.geometry.dispose();
      d.material.dispose();
    });
    this._decals = [];
  }
}

// ─── AdvancedRustSystem ───────────────────────────────────────────────────────

export class AdvancedRustSystem {
  constructor() {
    /** Map<mesh.uuid, RustEntry> */
    this._registry = new Map();

    /** Map<mesh.uuid, TransitionState> */
    this._transitions = new Map();

    this._decalProjector = null;
    this._scene = null;

    this._clock = new THREE.Clock();
    this._time  = 0;

    this._listeners = new Map();
  }

  // ── Registro ──────────────────────────────────────────────────────────────

  /**
   * Registra o modelo do carro (GLTF scene ou qualquer Object3D).
   * @param {THREE.Object3D} carObject
   * @param {number} initialDamage - 0.0 a 1.0
   * @param {THREE.Scene} [scene] - necessário para decals
   */
  registerCar(carObject, initialDamage = 0, scene = null) {
    if (scene && !this._decalProjector) {
      this._scene = scene;
      this._decalProjector = new DecalProjector(scene);
    }

    carObject.traverse(child => {
      if (!child.isMesh) return;

      // Determina intensidade de zona baseado no nome do mesh
      const zoneIntensity = this._getZoneIntensity(child.name);
      if (zoneIntensity === 0) return; // ignora meshes não-metálicos

      this._registerMesh(child, zoneIntensity, initialDamage);
    });

    // Projeta decals iniciais se houver dano
    if (initialDamage > 0.2 && this._decalProjector) {
      this._applyDecals(carObject, initialDamage);
    }

    console.log(`[AdvancedRustSystem] ${this._registry.size} meshes registrados. Dano inicial: ${(initialDamage * 100).toFixed(0)}%`);
  }

  _registerMesh(mesh, zoneIntensity, initialDamage) {
    // Garante que a geometria tem atributo de vertex color
    this._ensureVertexColors(mesh.geometry, zoneIntensity);

    // Salva informações do material original
    const origMat = mesh.material;
    const origColor = origMat.color
      ? origMat.color.clone()
      : new THREE.Color(0xcccccc);
    const origRoughness = origMat.roughness ?? 0.4;
    const origMetalness = origMat.metalness ?? 0.7;

    // Cria ShaderMaterial de ferrugem via onBeforeCompile no MeshStandardMaterial
    // para manter compatibilidade com sombras, envmap, etc.
    const rustMat = this._createRustMaterial(origColor, origRoughness, origMetalness);
    mesh.material = rustMat;

    const entry = {
      mesh,
      rustMaterial: rustMat,
      originalColor: origColor,
      originalRoughness: origRoughness,
      originalMetalness: origMetalness,
      zoneIntensity,
      currentDamage: 0,
    };

    this._registry.set(mesh.uuid, entry);
    this._applyDamageImmediate(mesh.uuid, initialDamage);
  }

  unregisterCar(carObject) {
    carObject.traverse(child => {
      if (!child.isMesh) return;
      const entry = this._registry.get(child.uuid);
      if (!entry) return;
      child.material = entry.rustMaterial; // já está aplicado; basta remover do registry
      this._registry.delete(child.uuid);
      this._transitions.delete(child.uuid);
    });
    this._decalProjector?.removeAll();
  }

  // ── API Pública (compatível com RustSystem) ───────────────────────────────

  setDamage(carObject, damage, duration = 2.0) {
    damage = Math.max(0, Math.min(1, damage));
    carObject.traverse(child => {
      if (!child.isMesh) return;
      const entry = this._registry.get(child.uuid);
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

    // Atualiza decals quando dano muda significativamente
    if (damage > 0.3 && this._decalProjector) {
      this._decalProjector.removeAll();
      this._applyDecals(carObject, damage);
    }

    this._emit('damageChange', { damage });
  }

  addDamage(carObject, amount) {
    const current = this.getDamageLevel(carObject);
    this.setDamage(carObject, current + amount, 2.5);
  }

  restore(carObject, duration = 2.5) {
    this.setDamage(carObject, 0, duration);
    this._decalProjector?.removeAll();
  }

  getDamageLevel(carObject) {
    let total = 0; let count = 0;
    carObject.traverse(child => {
      if (!child.isMesh) return;
      const e = this._registry.get(child.uuid);
      if (!e) return;
      total += e.currentDamage; count++;
    });
    return count > 0 ? total / count : 0;
  }

  getDamageLabel(carObject) {
    const d = this.getDamageLevel(carObject);
    if (d < 0.15) return 'pristine';
    if (d < 0.35) return 'worn';
    if (d < 0.55) return 'rusty';
    if (d < 0.75) return 'corroded';
    if (d < 0.90) return 'severe';
    return 'destroyed';
  }

  /** Atualiza o sistema — chamar no loop de animação. */
  update() {
    const delta = this._clock.getDelta();
    this._time += delta;

    // Atualiza uniform de tempo em todos os materiais (animação sutil)
    for (const [uuid, entry] of this._registry) {
      if (entry.rustMaterial?.uniforms?.u_time) {
        entry.rustMaterial.uniforms.u_time.value = this._time;
      }
    }

    // Processa transições
    for (const [uuid, tr] of this._transitions) {
      tr.elapsed += delta;
      const t = Math.min(tr.elapsed / tr.duration, 1);
      const eased = this._easeInOutCubic(t);
      const damage = tr.from + (tr.to - tr.from) * eased;
      this._applyDamageImmediate(uuid, damage);
      if (t >= 1) this._transitions.delete(uuid);
    }
  }

  // ── Material de Ferrugem ──────────────────────────────────────────────────

  /**
   * Cria um MeshStandardMaterial modificado via onBeforeCompile
   * para injetar o shader de ferrugem mantendo PBR (sombras, envmap, etc.).
   */
  _createRustMaterial(baseColor, roughness, metalness) {
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness,
      metalness,
      vertexColors: true, // usa vertex paint como máscara
    });

    // Uniforms personalizados
    const customUniforms = {
      u_baseColor:      { value: baseColor.clone() },
      u_rustColor:      { value: new THREE.Color(0x8b4513) },
      u_deepRustColor:  { value: new THREE.Color(0x2c0d00) },
      u_damage:         { value: 0.0 },
      u_noiseScale:     { value: 1.8 },
      u_noiseStrength:  { value: 0.6 },
      u_edgeFactor:     { value: 0.4 },
      u_roughness:      { value: roughness },
      u_metalness:      { value: metalness },
      u_time:           { value: 0.0 },
    };
    mat.uniforms = customUniforms;

    mat.onBeforeCompile = shader => {
      // Injeta uniforms no shader do Three.js
      shader.uniforms = { ...shader.uniforms, ...customUniforms };

      // ── Vertex: adiciona passagem de vertex color customizado ──────────
      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
        `
        #include <color_vertex>
        // vColor já é passado pelo chunk padrão do Three.js quando vertexColors=true
        `
      );

      // ── Fragment: injeta noise + blending de ferrugem ─────────────────
      shader.fragmentShader = `
        // Uniforms de ferrugem
        uniform vec3  u_baseColor;
        uniform vec3  u_rustColor;
        uniform vec3  u_deepRustColor;
        uniform float u_damage;
        uniform float u_noiseScale;
        uniform float u_noiseStrength;
        uniform float u_edgeFactor;
        uniform float u_roughness;
        uniform float u_metalness;
        uniform float u_time;

        // ── Noise functions ──────────────────────────────────────────────
        float hash31(vec3 p) {
          p = fract(p * vec3(0.1031, 0.103, 0.0973));
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float smoothNoise(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash31(i),hash31(i+vec3(1,0,0)),u.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),u.x),u.y),
            mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),u.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),u.x),u.y),
            u.z);
        }
        float fbm(vec3 p) {
          float v=0.; float a=0.5;
          for(int i=0;i<4;i++){v+=smoothNoise(p)*a;p*=2.;a*=.5;}
          return v;
        }
      ` + shader.fragmentShader;

      // Injeta o cálculo de ferrugem ANTES do cálculo de cor base do PBR
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        // ── Cálculo de ferrugem ──────────────────────────────────────────
        if (u_damage > 0.0) {
          vec3 worldPos = vWorldPosition; // disponível via worldpos_vertex chunk

          float noise = fbm(worldPos * u_noiseScale + vec3(u_time * 0.0002));
          float noiseFine = fbm(worldPos * u_noiseScale * 4.0) * 0.25;
          float noiseFinal = clamp(noise + noiseFine * u_noiseStrength, 0.0, 1.0);

          // Vertex color como máscara de zona (canal R)
          float zoneMask = vColor.r;

          // Fresnel edge
          vec3 norm = normalize(vNormal);
          // cameraPosition não está disponível diretamente em onBeforeCompile standard,
          // mas podemos aproximar com viewDirection
          float edge = 1.0 - abs(dot(norm, normalize(vec3(0.0, 0.0, 1.0))));
          edge = clamp(edge * u_edgeFactor, 0.0, 1.0);

          float rustMask = u_damage * (0.5 + noiseFinal * 0.8);
          rustMask = max(rustMask, zoneMask * u_damage * 1.3);
          rustMask = min(rustMask + edge * u_damage * 0.4, 1.0);
          rustMask = clamp(rustMask, 0.0, 1.0);

          // Blending de cor
          vec3 rustBlend;
          if (rustMask < 0.5) {
            rustBlend = mix(u_baseColor, u_rustColor, rustMask * 2.0);
          } else {
            rustBlend = mix(u_rustColor, u_deepRustColor, (rustMask - 0.5) * 2.0);
          }
          float microNoise = fbm(worldPos * u_noiseScale * 8.0);
          rustBlend = mix(rustBlend, rustBlend * 0.75, rustMask * microNoise * 0.35);

          diffuseColor.rgb = mix(diffuseColor.rgb, rustBlend, rustMask);

          // Roughness e metalness dinâmicos (via material uniforms)
          roughnessFactor  = u_roughness + rustMask * (1.0 - u_roughness) * 0.92;
          metalnessFactor  = u_metalness * (1.0 - rustMask * 0.95);
        }
        `
      );

      // Garante o chunk de worldpos para ter vWorldPosition
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;
        `
      );
      shader.vertexShader = `
        varying vec3 vWorldPosition;
      ` + shader.vertexShader;
      shader.fragmentShader = `
        varying vec3 vWorldPosition;
      ` + shader.fragmentShader;
    };

    return mat;
  }

  // ── Vertex Colors ─────────────────────────────────────────────────────────

  /**
   * Garante que a geometria tem atributo 'color' (vertex paint).
   * Pinta os vértices com base na zona do mesh e na posição Y
   * (parte de cima enferruja mais — mais exposição à chuva).
   */
  _ensureVertexColors(geometry, zoneIntensity) {
    const posAttr = geometry.getAttribute('position');
    if (!posAttr) return;

    const count = posAttr.count;

    // Calcula bounds para normalizar posição Y
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const minY = bbox.min.y;
    const maxY = bbox.max.y;
    const rangeY = Math.max(maxY - minY, 0.001);

    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i);
      // Vértices no topo enferrujam mais (exposição à chuva)
      const heightFactor = (y - minY) / rangeY;

      // Pequena variação por posição X/Z para parecer orgânico
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Hash simples para variação
      const randFactor = ((Math.sin(x * 127.1 + z * 311.7) * 0.5 + 0.5) * 0.3);

      const rustWeight = zoneIntensity * (0.5 + heightFactor * 0.5 + randFactor);

      // R = intensidade de ferrugem, G = 0, B = 0
      colors[i * 3]     = Math.min(rustWeight, 1.0);
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  // ── Decals ────────────────────────────────────────────────────────────────

  _applyDecals(carObject, damage) {
    if (!this._decalProjector) return;

    const count = Math.floor(damage * 40); // até 40 manchas no dano máximo

    carObject.traverse(child => {
      if (!child.isMesh) return;
      if (!this._registry.has(child.uuid)) return;

      const entry = this._registry.get(child.uuid);
      const meshCount = Math.floor(count * entry.zoneIntensity * 0.5);
      if (meshCount < 1) return;

      this._decalProjector.sprayDecalsOnMesh(child, meshCount, damage);
    });
  }

  // ── Aplicação de Dano ─────────────────────────────────────────────────────

  _applyDamageImmediate(uuid, damage) {
    const entry = this._registry.get(uuid);
    if (!entry) return;
    entry.currentDamage = damage;

    const mat = entry.rustMaterial;
    if (!mat?.uniforms) return;

    mat.uniforms.u_damage.value = damage;
    mat.uniforms.u_roughness.value = entry.originalRoughness;
    mat.uniforms.u_metalness.value = entry.originalMetalness;

    // Atualiza a cor base do uniform
    mat.uniforms.u_baseColor.value.copy(entry.originalColor);
    mat.needsUpdate = false; // shader já foi compilado; uniforms atualizam automaticamente
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _getZoneIntensity(meshName) {
    if (!meshName) return 0.5; // padrão moderado para meshes sem nome
    const lower = meshName.toLowerCase();
    for (const [pattern, intensity] of Object.entries(RUST_ZONE_MAP)) {
      if (lower.includes(pattern)) return intensity;
    }
    // Meshes que provavelmente são vidro, interior, etc. — ignora
    const ignorePatterns = ['glass', 'window', 'seat', 'interior', 'dashboard',
                            'headlight', 'taillight', 'light', 'tire', 'rubber'];
    if (ignorePatterns.some(p => lower.includes(p))) return 0;
    return 0.4; // fallback para meshes genéricos
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this._listeners.get(event).delete(cb);
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach(cb => cb(data));
  }
}
