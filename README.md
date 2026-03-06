# Car Mechanic Simulator

📁 ESTRUTURA DO PROJETO

src/
├── assets/ # Recursos (modelos 3D, texturas, sons)
|
├── cars/ # Lógica dos carros e peças
│ ├── Car.js
│ ├── CarModels.js
│ ├── Job.js
│ ├── CarModelLoader.js
│ └── CarParts.js
│
├── core/ # Núcleo do jogo (Game, Database)
│ ├── Game.js
│ ├── Database.js
│ └── Exports.js
│
├── garage/ # Cena 3D e elementos da garagem
│ ├── Scene3D.js
│ ├── Garage.js
│ ├── GarageLayout.js
│ └── SimpleScene3D.js
│
├── systems/ # Sistemas de jogo (clientes, conquistas, etc)
│ ├── Inventory.js
│ ├── audio.js
│ ├── upgrade-system.js
│ ├── specializations.js
│ ├── UpgradeManager.js
│ ├── career-mode.js
│ │
│ ├── achievements/
│ │ ├── AchievementSystem.js
│ │ └── achievements-advanced.js
│ │
│ ├── customers/
│ │ └── CustomerSystem.js
│ │
│ ├── challenges/
│ │ └── DailyChallenges.js
│ │
│ └── market/
│ └── used-parts-market.js
│
├── ui/ # Interface do usuário
│ ├── index.html
│ ├── style.css
│ ├── UIManager.js
│ └── UpgradePanel.js
│
└── utils/ # Utilitários e scripts
└── constants.js

## 🚀 Como executar

Abra `src/ui/index.html` no navegador
