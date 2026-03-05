#!/bin/bash

# corrigir-imports.sh - Corrige todos os caminhos de import

echo "================================="
echo "🔄 CORRIGINDO IMPORTS"
echo "================================="
echo ""

# Mapeamento de nomes de arquivos para caminhos absolutos
declare -A paths=(
    ["database.js"]="/src/core/Database.js"
    ["upgrade-system.js"]="/src/systems/upgrade-system.js"
    ["achievement-system.js"]="/src/systems/achievements/AchievementSystem.js"
    ["audio.js"]="/src/systems/audio.js"
    ["inventory.js"]="/src/systems/Inventory.js"
    ["specializations.js"]="/src/systems/specializations.js"
    ["garage.js"]="/src/garage/Garage.js"
    ["customer-system.js"]="/src/systems/customers/CustomerSystem.js"
    ["customersystem.js"]="/src/systems/customers/CustomerSystem.js"
    ["daily-challenges.js"]="/src/systems/challenges/DailyChallenges.js"
    ["job.js"]="/src/cars/Job.js"
    ["car.js"]="/src/cars/Car.js"
    ["scene3d.js"]="/src/garage/Scene3D.js"
    ["ui.js"]="/src/ui/UIManager.js"
    ["used-parts-market.js"]="/src/systems/market/used-parts-market.js"
    ["career-mode.js"]="/src/systems/career-mode.js"
    ["constants.js"]="/src/utils/constants.js"
)

# Arquivos para corrigir
files=(
    "src/core/Game.js"
    "src/ui/UIManager.js"
    "src/garage/Scene3D.js"
    "src/cars/Car.js"
    "src/systems/Inventory.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 Corrigindo $file..."
        
        # Fazer backup
        cp "$file" "$file.bak"
        
        # Aplicar substituições
        for old in "${!paths[@]}"; do
            new="${paths[$old]}"
            # Procurar por imports do tipo "./arquivo.js" e "../arquivo.js"
            sed -i "s|from ['\"]\\.*/$old['\"]|from '$new'|g" "$file"
            sed -i "s|from ['\"]\\.\\./.*/$old['\"]|from '$new'|g" "$file"
        done
        
        echo "   ✅ Corrigido"
    else
        echo "⚠️ Arquivo não encontrado: $file"
    fi
done

echo ""
echo "✅ Imports corrigidos!"