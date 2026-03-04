#!/bin/bash

# atualizar-imports-final.sh - Atualiza todos os caminhos de import

echo "================================="
echo "🔄 ATUALIZANDO IMPORTS"
echo "================================="
echo ""

# Lista de substituições
declare -A replacements=(
    ["from '\\.\\./car-model-loader"]="from '../cars/CarModelLoader"
    ["from '\\.\\./car-parts"]="from '../cars/CarParts"
    ["from '\\.\\./job"]="from '../cars/Job"
    ["from '\\.\\./scene3d"]="from '../garage/Scene3D"
    ["from '\\.\\./daily-challenges"]="from '../systems/daily-challenges"
    ["from '\\.\\./used-parts-market"]="from '../systems/used-parts-market"
    ["from '\\.\\./career-mode"]="from '../systems/career-mode"
    ["from '\\.\\./specializations"]="from '../systems/specializations"
    ["from '\\.\\./upgrade-system"]="from '../systems/upgrade-system"
    ["from '\\.\\./audio"]="from '../systems/audio"
    ["from '\\.\\./tournament-system"]="from '../systems/tournament-system"
)

echo "📝 Processando arquivos JavaScript..."

find src -name "*.js" -type f | while read file; do
    # Fazer backup
    cp "$file" "$file.bak"
    
    modified=0
    for old in "${!replacements[@]}"; do
        new="${replacements[$old]}"
        if grep -q "$old" "$file"; then
            echo "   🔄 $file: $old → $new"
            sed -i "s|$old|$new|g" "$file"
            modified=1
        fi
    done
    
    if [ $modified -eq 0 ]; then
        # Restaurar se não mudou
        mv "$file.bak" "$file" 2>/dev/null
    fi
done

echo ""
echo "✅ Imports atualizados!"