#!/bin/bash

# garantir-globais.sh - Garante que todos os arquivos exportem globalmente

echo "================================="
echo "🌐 GARANTINDO EXPOSIÇÃO GLOBAL"
echo "================================="

# Função para adicionar exposição global a um arquivo
add_global_export() {
    local file=$1
    local classname=$2
    
    if [ -f "$file" ]; then
        echo "📄 Processando $file..."
        
        # Verificar se já tem exposição global
        if ! grep -q "window.$classname" "$file"; then
            cat >> "$file" << EOF

// Expor globalmente
if (typeof window !== 'undefined') {
    window.$classname = $classname;
    console.log('🌐 $classname disponível globalmente');
}
EOF
            echo "   ✅ Global adicionado para $classname"
        else
            echo "   ⏭️  Global já existe para $classname"
        fi
    else
        echo "⚠️ Arquivo não encontrado: $file"
    fi
}

# Lista de arquivos e suas classes
declare -A classes=(
    ["src/garage/Scene3D.js"]="Scene3D"
    ["src/ui/UIManager.js"]="UIManager"
    ["src/core/Database.js"]="Database"
    ["src/systems/upgrade-system.js"]="UpgradeSystem"
    ["src/systems/achievements/AchievementSystem.js"]="AchievementSystem"
    ["src/systems/audio.js"]="AudioManager"
    ["src/systems/Inventory.js"]="Inventory"
    ["src/systems/specializations.js"]="SpecializationSystem"
    ["src/garage/Garage.js"]="GarageSystem"
    ["src/systems/customers/CustomerSystem.js"]="CustomerSystem"
    ["src/systems/challenges/DailyChallenges.js"]="DailyChallenges"
    ["src/cars/Job.js"]="Job"
    ["src/cars/Car.js"]="CustomerCar"
    ["src/systems/market/used-parts-market.js"]="UsedPartsMarket"
    ["src/systems/career-mode.js"]="CareerMode"
)

for file in "${!classes[@]}"; do
    add_global_export "$file" "${classes[$file]}"
done

echo ""
echo "✅ Processo concluído!"
echo "⚠️  Recarregue a página e execute verificar-globais.js novamente"