# Integração das 5 Features Novas — `Game.js`

Adicione os imports e inicializações abaixo no seu `src/core/Game.js` existente.

---

## 1. Imports (adicionar no topo do arquivo)

```js
import { RustSystem }         from '../systems/RustSystem.js';
import { GarageRadio }        from '../systems/GarageRadio.js';
import { NightEmergencyMode } from '../systems/NightEmergencyMode.js';
import { WeatherSystem }      from '../systems/WeatherSystem.js';
import { ReputationSystem }   from '../systems/ReputationSystem.js';
```

---

## 2. Inicialização (dentro de `init()` ou `start()`)

```js
async init() {
  // ... seu código existente ...

  // ── Ferrugem ──────────────────────────────────────────────────────────────
  this.rustSystem = new RustSystem();
  // Após carregar o modelo do carro:
  //   this.rustSystem.registerCar(carObject, job.carDamage ?? 0);
  //   this.rustSystem.setDamage(carObject, 0.6, 2.0); // 60% dano com 2s de transição

  // ── Rádio ─────────────────────────────────────────────────────────────────
  this.garageRadio = new GarageRadio(this.soundSystem);
  this.garageRadio.init();
  this.garageRadio.on('stationChange', ({ station }) => {
    console.log('[Radio] Sintonizado em:', station.name);
  });

  // ── Modo Noturno ──────────────────────────────────────────────────────────
  this.nightMode = new NightEmergencyMode({
    scene: this.scene3D.scene,          // THREE.Scene
    gameTime: this.gameTime,            // { hour: number }
    customerSystem: this.customerSystem,
    uiManager: this.uiManager,
  });
  this.nightMode.init();
  this.nightMode.on('emergency', ({ job }) => {
    console.log('[Night] Emergência chegou:', job.title);
  });

  // ── Clima ─────────────────────────────────────────────────────────────────
  this.weatherSystem = new WeatherSystem({
    scene: this.scene3D.scene,
    camera: this.scene3D.camera,
    initialWeather: 'clear',
  });
  this.weatherSystem.init(this.scene3D.renderer);
  this.weatherSystem.on('weatherChange', ({ weather, config }) => {
    console.log('[Weather] Clima mudou para:', config.label);
    // Aplica multiplicadores no CustomerSystem se quiser:
    // this.customerSystem.setDemandMultiplier(this.weatherSystem.demandMultiplier);
  });

  // ── Reputação ─────────────────────────────────────────────────────────────
  this.reputationSystem = new ReputationSystem();
  this.reputationSystem.init();
  // Carrega do save se existir:
  // this.reputationSystem.load(this.database.get('reputation'));

  this.reputationSystem.on('levelUp', ({ level }) => {
    this.uiManager?.showNotification(`🏆 Nível: ${level.label}! ${level.description}`);
  });
}
```

---

## 3. Update Loop (dentro de `update(delta)`)

```js
update(delta) {
  // ... seu código existente ...

  this.rustSystem?.update();
  this.nightMode?.update(this.gameTime.hour);
  this.weatherSystem?.update();
}
```

---

## 4. Integrações de Gameplay

### Ao completar um job com sucesso:
```js
onJobComplete(job, quality) {
  // Reputação
  const points = Math.round(quality * 50); // ex: qualidade 0-1 → 0-50 pts
  this.reputationSystem?.addReputation(points, {
    rating: Math.round(quality * 5),
    comment: quality > 0.8 ? 'Serviço excelente!' : 'Serviço satisfatório.',
    clientName: job.clientName,
  });

  // Gorjeta extra por clima ruim / noite
  const weatherTip  = this.weatherSystem?.tipMultiplier ?? 1;
  const nightTip    = this.nightMode?.isNightMode ? 1.5 : 1;
  const repTip      = 1 + (this.reputationSystem?.tipBonus ?? 0);
  const finalPay    = job.basePay * weatherTip * nightTip * repTip;
  this.database.addMoney(finalPay);

  // Desconto em peças pela reputação
  const discount = this.reputationSystem?.partDiscount ?? 0;
  // Usar discount em compras de peças
}
```

### Ao carregar um carro danificado:
```js
onCarLoaded(carObject, damageLevel = 0) {
  this.rustSystem?.registerCar(carObject, damageLevel);
}
```

### Ao restaurar/pintar um carro:
```js
onCarRestored(carObject) {
  this.rustSystem?.restore(carObject, 2.5); // 2.5s de animação
}
```

### Ao salvar o jogo:
```js
save() {
  this.database.set('reputation', this.reputationSystem?.serialize());
  // ... resto do save ...
}
```

---

## 5. API Pública dos Sistemas

### RustSystem
| Método | Descrição |
|--------|-----------|
| `registerCar(obj, damage)` | Registra carro para ferrugem |
| `setDamage(obj, 0-1, duration)` | Define dano com transição |
| `addDamage(obj, amount)` | Incrementa dano |
| `restore(obj, duration)` | Restaura para novo |
| `getDamageLevel(obj)` | Retorna nível médio de dano |
| `getDamageLabel(obj)` | Retorna label do estágio |

### GarageRadio
| Método | Descrição |
|--------|-----------|
| `turnOn(stationId?)` | Liga o rádio |
| `turnOff()` | Desliga |
| `toggle()` | Alterna |
| `tuneToStation(station)` | Sintoniza uma estação |
| `nextStation()` / `prevStation()` | Navega entre estações |
| `setVolume(0-1)` | Volume |

### NightEmergencyMode
| Método/Prop | Descrição |
|-------------|-----------|
| `update(gameHour)` | Atualiza (chamar no loop) |
| `isNightMode` | `true` se for noite |
| `isEmergencyActive` | `true` se há emergência ativa |
| `on('emergency', cb)` | Evento quando emergência chega |
| `on('nightStart', cb)` | Evento quando anoitece |

### WeatherSystem
| Método/Prop | Descrição |
|-------------|-----------|
| `setWeather(type, duration)` | Muda o clima |
| `update()` | Atualiza (chamar no loop) |
| `demandMultiplier` | Multiplicador de demanda |
| `tipMultiplier` | Multiplicador de gorjeta |
| `dryingTimeMultiplier` | Multiplicador de secagem |
| `isRaining()` | `true` se estiver chovendo |

### ReputationSystem
| Método/Prop | Descrição |
|-------------|-----------|
| `addReputation(pts, review)` | Adiciona pontos |
| `penalize(pts, reason)` | Penaliza |
| `points` | Total de pontos |
| `currentLevel` | Objeto do nível atual |
| `stars` | Estrelas (1-5) |
| `progressToNext` | Progresso para próximo nível (0-1) |
| `partDiscount` | Desconto em peças (0-0.25) |
| `tipBonus` | Bônus de gorjeta (0-0.5) |
| `serialize()` / `load(data)` | Save/Load |
