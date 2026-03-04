#!/bin/bash

# mover-arquivos-corretos.sh - Move arquivos para os lugares corretos

echo "================================="
echo "📦 MOVENDO ARQUIVOS PARA LOCAIS CORRETOS"
echo "================================="
echo ""

# Função para mover com confirmação
move_with_check() {
    if [ -f "$1" ]; then
        echo "📄 Movendo: $1 → $2"
        mkdir -p "$(dirname "$2")"
        mv "$1" "$2"
        echo "   ✅ Movido"
    else
        echo "⚠️  Arquivo não encontrado: $1"
    fi
}

# Mover arquivos de cars (se encontrados em outros lugares)
move_with_check "./src/car-model-loader.js" "./src/cars/CarModelLoader.js"
move_with_check "./src/car-parts.js" "./src/cars/CarParts.js"
move_with_check "./src/job.js" "./src/cars/Job.js"

# Mover arquivos de garage
move_with_check "./src/scene3d.js" "./src/garage/Scene3D.js"

# Mover arquivos de systems
move_with_check "./src/daily-challenges.js" "./src/systems/daily-challenges.js"
move_with_check "./src/used-parts-market.js" "./src/systems/used-parts-market.js"
move_with_check "./src/career-mode.js" "./src/systems/career-mode.js"
move_with_check "./src/specializations.js" "./src/systems/specializations.js"
move_with_check "./src/upgrade-system.js" "./src/systems/upgrade-system.js"
move_with_check "./src/audio.js" "./src/systems/audio.js"
move_with_check "./src/tournament-system.js" "./src/systems/tournament-system.js"
move_with_check "./src/tournaments.js" "./src/systems/tournaments.js"

# Mover assets
if [ -d "./models" ]; then
    echo ""
    echo "📁 Movendo modelos 3D..."
    mkdir -p ./src/assets/models
    mv ./models/*.glb ./src/assets/models/ 2>/dev/null
    echo "   ✅ Modelos movidos"
fi

echo ""
echo "✅ Processo concluído!"