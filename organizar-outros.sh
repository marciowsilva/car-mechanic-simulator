#!/bin/bash

# organizar-outros.sh - Move arquivos da pasta outros para locais corretos

echo "================================="
echo "📦 ORGANIZANDO PASTA OUTROS"
echo "================================="
echo ""

# Criar diretórios necessários
mkdir -p src/systems/tournaments
mkdir -p src/systems/achievements
mkdir -p src/systems/customers
mkdir -p src/systems/market
mkdir -p src/utils/scripts

# Mover arquivos para seus lugares corretos
mv src/outros/audio.js src/systems/audio.js 2>/dev/null && echo "✅ audio.js → src/systems/"
mv src/outros/job.js src/cars/Job.js 2>/dev/null && echo "✅ job.js → src/cars/Job.js"
mv src/outros/specializations.js src/systems/specializations.js 2>/dev/null && echo "✅ specializations.js → src/systems/"
mv src/outros/upgrade-system.js src/systems/upgrade-system.js 2>/dev/null && echo "✅ upgrade-system.js → src/systems/"
mv src/outros/used-parts-market.js src/systems/market/used-parts-market.js 2>/dev/null && echo "✅ used-parts-market.js → src/systems/market/"

# Scripts de teste/utils vão para src/utils/scripts/
mv src/outros/download-models.js src/utils/scripts/download-models.js 2>/dev/null && echo "✅ download-models.js → src/utils/scripts/"
mv src/outros/test-models.js src/utils/scripts/test-models.js 2>/dev/null && echo "✅ test-models.js → src/utils/scripts/"

# Versões antigas do scene3d (podem ser deletadas ou movidas para backup)
if [ -f "src/outros/scene3d-old.js" ]; then
    mkdir -p src/garage/backup
    mv src/outros/scene3d-old.js src/garage/backup/ 2>/dev/null
    echo "✅ scene3d-old.js movido para backup"
fi

if [ -f "src/outros/scene3d.js" ]; then
    # Verificar se já existe um Scene3D.js em garage
    if [ ! -f "src/garage/Scene3D.js" ]; then
        mv src/outros/scene3d.js src/garage/Scene3D.js
        echo "✅ scene3d.js → src/garage/Scene3D.js"
    else
        mv src/outros/scene3d.js src/garage/backup/
        echo "⚠️ scene3d.js movido para backup (Scene3D.js já existe)"
    fi
fi

# Remover pasta outros se estiver vazia
rmdir src/outros 2>/dev/null && echo "✅ Pasta src/outros removida"

echo ""
echo "✅ Organização concluída!"