# Guia de Integração — GarageRadio + AdvancedRustSystem

## Arquivos novos

```
src/systems/GarageRadio.js           ← Rádio completo
src/systems/AdvancedRustSystem.js    ← Ferrugem avançada (substitui RustSystem.js)
```

---

## 1. GarageRadio — `src/core/Game.js`

### Imports

```js
import { GarageRadio } from '../systems/GarageRadio.js';
```

### Inicialização (dentro de `init()`)

```js
// Passa o Database do projeto para persistência de estação/volume
this.radio = new GarageRadio(this.database);
this.radio.init();

// Opcional: conecta ao masterGain do SoundSystem para controle de volume global
// this.radio.connectToMaster(this.soundSystem.masterGain);

// Listener de eventos
this.radio.on('stationChange', ({ station }) => {
  console.log('Rádio: agora em', station.name, station.freq, 'FM');
  // Ex: exibir notificação na UI
  // this.uiManager.showToast(`📻 ${station.emoji} ${station.name}`);
});

this.radio.on('toggle', ({ isOn }) => {
  console.log('Rádio:', isOn ? 'ligado' : 'desligado');
});

this.radio.on('volumeChange', ({ volume }) => {
  // Sincroniza com controle de áudio geral se necessário
});
```

### IMPORTANTE — ativar o rádio requer interação do usuário

O Web Audio API só pode ser iniciado após um evento de clique/toque.
O `GarageRadio` já cuida disso internamente: o `turnOn()` chama
`AudioContext.resume()` automaticamente. Não é necessário nenhum
tratamento extra.

### API do GarageRadio

```js
// Ligar (com estação opcional)
this.radio.turnOn();
this.radio.turnOn('rock_garage');

// Desligar
this.radio.turnOff();

// Alternar
this.radio.toggle();

// Navegar entre estações
this.radio.nextStation();
this.radio.prevStation();

// Volume (0.0 – 1.0)
this.radio.setVolume(0.7);

// Conectar a gainNode externo (SoundSystem)
this.radio.connectToMaster(gainNode);

// Remover da cena
this.radio.dispose();

// Getters
this.radio.isOn            // boolean
this.radio.currentStation  // objeto de STATIONS ou null
this.radio.volume          // 0-1
```

### IDs das estações

| ID                 | Nome              | Gênero      |
|--------------------|-------------------|-------------|
| `rock_garage`      | Garage Rock FM    | Rock        |
| `jazz_smooth`      | Jazz Suave 101    | Jazz        |
| `country_roads`    | Country Roads     | Country     |
| `eletro_turbo`     | Eletro Turbo      | Electronic  |
| `bolero_mecanico`  | Bolero Mecânico   | Latino      |

---

## 2. AdvancedRustSystem — substituindo o RustSystem anterior

### Imports

```js
// SUBSTITUI: import { RustSystem } from '../systems/RustSystem.js';
import { AdvancedRustSystem } from '../systems/AdvancedRustSystem.js';
```

### Inicialização

```js
this.rustSystem = new AdvancedRustSystem();
```

### Após carregar o modelo GLTF

```js
// No callback do GLTFLoader:
loader.load('src/assets/models/car.glb', (gltf) => {
  const carScene = gltf.scene;
  this.scene.add(carScene);

  // Registra o carro com nível de dano inicial e referência à cena (para decals)
  this.rustSystem.registerCar(
    carScene,
    job.carDamageLevel ?? 0,  // 0.0 – 1.0
    this.scene                // THREE.Scene para projeção de decals
  );
});
```

### No loop de animação (`update()`)

```js
update(delta) {
  // ... código existente ...
  this.rustSystem.update();
}
```

### Ao concluir um reparo / pintura

```js
onCarRestored(carObject) {
  this.rustSystem.restore(carObject, 2.5); // 2.5s de transição
}
```

### Ao deteriorar o carro (ex: passou muitos dias parado)

```js
onGameDayPassed(carObject) {
  this.rustSystem.addDamage(carObject, 0.03); // +3% por dia
}
```

### Ao definir dano manualmente

```js
this.rustSystem.setDamage(carObject, 0.7, 2.0);  // 70% de dano em 2s
this.rustSystem.setDamage(carObject, 0, 0);        // imediato, sem animação
```

### Obter estado

```js
const level = this.rustSystem.getDamageLevel(carObject); // 0.0 – 1.0
const label = this.rustSystem.getDamageLabel(carObject);
// → 'pristine' | 'worn' | 'rusty' | 'corroded' | 'severe' | 'destroyed'
```

### Ao trocar de carro na garagem

```js
this.rustSystem.unregisterCar(oldCarObject);
this.rustSystem.registerCar(newCarObject, newDamageLevel, this.scene);
```

---

## 3. Integração entre os dois sistemas

```js
// Quando o carro está muito danificado, o rádio pode "comentar"
this.rustSystem.on('damageChange', ({ damage }) => {
  if (damage > 0.8 && this.radio.isOn) {
    // Ex: pausar o rádio e tocar efeito de emergência
    // this.soundSystem.playEffect('alarm');
  }
});
```

---

## 4. Database.js — O que é salvo

O `GarageRadio` chama `database.set('radio_state', {...})` e
`database.get('radio_state')` automaticamente.

Se o seu `Database.js` usa uma API diferente de `get/set`, ajuste no
construtor:

```js
// GarageRadio.js — _saveState()
this._db.set?.('radio_state', { ... });   // ← troque pelo método real

// GarageRadio.js — _loadState()
const state = this._db.get?.('radio_state');  // ← troque pelo método real
```

---

## 5. Notas técnicas — AdvancedRustSystem

### Vertex Colors no GLTF
Se o modelo GLTF já tiver vertex colors, eles serão **sobrescritos**
pela máscara de zona calculada automaticamente. Para preservar os
originais, comente a linha `geometry.setAttribute('color', ...)` em
`_ensureVertexColors()` e use apenas os que já existem.

### onBeforeCompile e shadows
O `onBeforeCompile` é chamado na primeira compilação e em cada
mudança de material. Para garantir que as sombras funcionem
corretamente com o shader customizado, ative:

```js
carMesh.castShadow    = true;
carMesh.receiveShadow = true;
```

Os chunks `#include <shadowmap_vertex>` e `#include <shadowmap_fragment>`
já são injetados automaticamente pelo Three.js no pipeline de
`MeshStandardMaterial`.

### Decals e performance
Cada chamada a `registerCar` com dano > 0.2 projeta quads de decal.
Em cenas com muitos carros simultâneos, limitar `count` em
`_applyDecals()` ou desabilitar decals:

```js
// Para desabilitar decals (economiza draw calls):
this.rustSystem._decalProjector = null;
```
