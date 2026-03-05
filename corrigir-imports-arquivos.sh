#!/bin/bash

# corrigir-imports-arquivos.sh

echo "================================="
echo "🔧 CORRIGINDO IMPORTS NOS ARQUIVOS PROBLEMÁTICOS"
echo "================================="

# Arquivos para corrigir
arquivos=(
    "src/systems/upgrade-system.js"
    "src/systems/achievements/AchievementSystem.js"
    "src/cars/Job.js"
    "src/garage/Scene3D.js"
    "src/ui/UIManager.js"
    "src/systems/market/used-parts-market.js"
)

# Mapeamento de caminhos relativos para absolutos
declare -A mapa=(
    ["./game.js"]="/src/core/Game.js"
    ["../core/Game.js"]="/src/core/Game.js"
    ["./constants.js"]="/src/utils/constants.js"
    ["../utils/constants.js"]="/src/utils/constants.js"
    ["./Database.js"]="/src/core/Database.js"
    ["../core/Database.js"]="/src/core/Database.js"
    ["./car.js"]="/src/cars/Car.js"
    ["../cars/Car.js"]="/src/cars/Car.js"
    ["./Job.js"]="/src/cars/Job.js"
    ["./Scene3D.js"]="/src/garage/Scene3D.js"
    ["../garage/Scene3D.js"]="/src/garage/Scene3D.js"
    ["./UIManager.js"]="/src/ui/UIManager.js"
    ["./Inventory.js"]="/src/systems/Inventory.js"
    ["../systems/Inventory.js"]="/src/systems/Inventory.js"
)

for arquivo in "${arquivos[@]}"; do
    if [ -f "$arquivo" ]; then
        echo "📄 Corrigindo $arquivo..."
        
        # Fazer backup
        cp "$arquivo" "$arquivo.bak"
        
        # Aplicar substituições
        for relativo in "${!mapa[@]}"; do
            absoluto="${mapa[$relativo]}"
            sed -i "s|from ['\"]$relativo['\"]|from '$absoluto'|g" "$arquivo"
        done
        
        echo "   ✅ Corrigido (backup em $arquivo.bak)"
    else
        echo "⚠️ Arquivo não encontrado: $arquivo"
    fi
done

echo ""
echo "✅ Correções concluídas!"