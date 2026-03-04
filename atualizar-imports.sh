#!/bin/bash

# atualizar-imports.sh - Atualiza caminhos de import em todos os arquivos

echo "================================="
echo "🔄 ATUALIZANDO IMPORTS"
echo "================================="
echo ""

# Mapeamento de nomes antigos para novos
declare -A replacements=(
    # Format: ["old/path"]="new/path"
    ["car.js"]="cars/Car.js"
    ["car-models.js"]="cars/CarModels.js"
    ["car-model-loader.js"]="cars/CarModelLoader.js"
    ["scene3d.js"]="garage/Scene3D.js"
    ["ui.js"]="ui/UIManager.js"
    ["achievement-system.js"]="systems/achievements/AchievementSystem.js"
    ["customer-system.js"]="systems/customers/CustomerSystem.js"
    ["tournament-system.js"]="systems/tournaments/TournamentSystem.js"
)

# Encontrar todos os arquivos .js
find src -name "*.js" -type f | while read file; do
    echo "📝 Verificando: $file"
    
    # Fazer backup
    cp "$file" "$file.bak"
    
    # Aplicar substituições
    changed=0
    for old in "${!replacements[@]}"; do
        new="${replacements[$old]}"
        
        # Procurar por imports do arquivo antigo
        if grep -q "from ['\"]\\.*/$old" "$file"; then
            echo "   🔄 Substituindo: $old → $new"
            sed -i "s|from ['\"]\\.*/$old|from '../$new|g" "$file"
            changed=1
        fi
    done
    
    if [ $changed -eq 1 ]; then
        echo "   ✅ Atualizado"
    else
        # Restaurar se não mudou
        mv "$file.bak" "$file" 2>/dev/null
    fi
done

echo ""
echo "✅ Imports atualizados!"
echo "⚠️  Verifique se há erros testando o jogo"