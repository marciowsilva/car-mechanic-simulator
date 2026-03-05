#!/bin/bash

# corrigir-todos-imports.sh

echo "================================="
echo "🔧 CORRIGINDO TODOS OS IMPORTS"
echo "================================="

# 1. Corrigir upgrade-system.js
if [ -f "src/systems/upgrade-system.js" ]; then
    echo "📄 Corrigindo src/systems/upgrade-system.js"
    sed -i 's|from '\''\./constants\.js'\''|from '\''/src/utils/constants.js'\''|g' src/systems/upgrade-system.js
    sed -i 's|from '\''\./game\.js'\''|from '\''/src/core/Game.js'\''|g' src/systems/upgrade-system.js
fi

# 2. Corrigir AchievementSystem.js
if [ -f "src/systems/achievements/AchievementSystem.js" ]; then
    echo "📄 Corrigindo src/systems/achievements/AchievementSystem.js"
    sed -i 's|from '\''\./game\.js'\''|from '\''/src/core/Game.js'\''|g' src/systems/achievements/AchievementSystem.js
fi

# 3. Corrigir Job.js
if [ -f "src/cars/Job.js" ]; then
    echo "📄 Corrigindo src/cars/Job.js"
    sed -i 's|from '\''\./constants\.js'\''|from '\''/src/utils/constants.js'\''|g' src/cars/Job.js
    sed -i 's|from '\''\./game\.js'\''|from '\''/src/core/Game.js'\''|g' src/cars/Job.js
fi

# 4. Corrigir Scene3D.js
if [ -f "src/garage/Scene3D.js" ]; then
    echo "📄 Corrigindo src/garage/Scene3D.js"
    sed -i 's|from '\''\./garage-layout\.js'\''|from '\''/src/garage/GarageLayout.js'\''|g' src/garage/Scene3D.js
    sed -i 's|from '\''\./car-models\.js'\''|from '\''/src/cars/CarModels.js'\''|g' src/garage/Scene3D.js
    sed -i 's|from '\''\./game\.js'\''|from '\''/src/core/Game.js'\''|g' src/garage/Scene3D.js
    sed -i 's|from '\''\./car-model-loader\.js'\''|from '\''/src/cars/CarModelLoader.js'\''|g' src/garage/Scene3D.js
fi

echo ""
echo "✅ Correções aplicadas!"