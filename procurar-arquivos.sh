#!/bin/bash

# procurar-arquivos.sh - Procura arquivos faltantes em todo o projeto

echo "================================="
echo "🔍 PROCURANDO ARQUIVOS FALTANTES"
echo "================================="
echo ""

# Lista de arquivos que estão faltando
missing_files=(
    "CarModelLoader.js"
    "CarParts.js"
    "Job.js"
    "Scene3D.js"
    "daily-challenges.js"
    "used-parts-market.js"
    "career-mode.js"
    "specializations.js"
    "upgrade-system.js"
    "audio.js"
    "tournament-system.js"
    "tournaments.js"
    "sedan.glb"
    "hatch.glb"
    "suv.glb"
    "pickup.glb"
    "sports.glb"
    "classic.glb"
)

echo "🔎 Procurando em todas as pastas do projeto..."

for file in "${missing_files[@]}"; do
    echo -n "📄 $file: "
    
    # Procurar o arquivo em qualquer lugar (exceto node_modules e .git)
    found=$(find . -type f -name "$file" 2>/dev/null | grep -v "node_modules" | grep -v "\.git")
    
    if [ -n "$found" ]; then
        echo "✅ ENCONTRADO EM:"
        echo "$found" | sed 's/^/   /'
    else
        echo "❌ NÃO ENCONTRADO"
    fi
done

echo ""
echo "🔎 Procurando por arquivos similares (nomes parecidos):"

# Procurar por possíveis variantes
find . -type f -name "*challenge*" -o -name "*market*" -o -name "*career*" -o -name "*specialization*" -o -name "*upgrade*" -o -name "*audio*" -o -name "*tournament*" 2>/dev/null | grep -v "node_modules" | grep -v "\.git"