#!/bin/bash

# organizar-sistemas.sh - Organiza systems em subpastas

echo "================================="
echo "📦 ORGANIZANDO SISTEMAS"
echo "================================="
echo ""

# Criar estrutura de subpastas
mkdir -p src/systems/achievements
mkdir -p src/systems/customers
mkdir -p src/systems/tournaments
mkdir -p src/systems/market
mkdir -p src/systems/challenges

# Mover arquivos para subpastas apropriadas

# Achievements
if [ -f "src/systems/achievement-system.js" ]; then
    mv src/systems/achievement-system.js src/systems/achievements/AchievementSystem.js
    echo "✅ achievement-system.js → src/systems/achievements/AchievementSystem.js"
fi

if [ -f "src/systems/achievements-advanced.js" ]; then
    mv src/systems/achievements-advanced.js src/systems/achievements/AdvancedAchievements.js
    echo "✅ achievements-advanced.js → src/systems/achievements/AdvancedAchievements.js"
fi

# Customers (escolher a versão principal)
if [ -f "src/systems/CustomerSystem.js" ] && [ -f "src/systems/customer-system.js" ]; then
    # Comparar tamanhos para decidir qual manter
    size1=$(wc -l < src/systems/CustomerSystem.js)
    size2=$(wc -l < src/systems/customer-system.js)
    
    if [ $size1 -gt $size2 ]; then
        echo "📊 CustomerSystem.js é maior ($size1 linhas)"
        mv src/systems/CustomerSystem.js src/systems/customers/CustomerSystem.js
        echo "✅ CustomerSystem.js → src/systems/customers/"
        rm src/systems/customer-system.js 2>/dev/null
        echo "🗑️  customer-system.js removido (duplicata)"
    else
        echo "📊 customer-system.js é maior ($size2 linhas)"
        mv src/systems/customer-system.js src/systems/customers/CustomerSystem.js
        echo "✅ customer-system.js → src/systems/customers/CustomerSystem.js"
        rm src/systems/CustomerSystem.js 2>/dev/null
        echo "🗑️  CustomerSystem.js removido (duplicata)"
    fi
elif [ -f "src/systems/CustomerSystem.js" ]; then
    mv src/systems/CustomerSystem.js src/systems/customers/CustomerSystem.js
    echo "✅ CustomerSystem.js → src/systems/customers/"
elif [ -f "src/systems/customer-system.js" ]; then
    mv src/systems/customer-system.js src/systems/customers/CustomerSystem.js
    echo "✅ customer-system.js → src/systems/customers/CustomerSystem.js"
fi

# Challenges
if [ -f "src/systems/DailyChallenges.js" ]; then
    mv src/systems/DailyChallenges.js src/systems/challenges/DailyChallenges.js
    echo "✅ DailyChallenges.js → src/systems/challenges/"
fi

# Inventory
if [ -f "src/systems/Inventory.js" ]; then
    mv src/systems/Inventory.js src/systems/inventory/Inventory.js 2>/dev/null || \
    mv src/systems/Inventory.js src/systems/Inventory.js
    echo "✅ Inventory.js mantido em src/systems/"
fi

echo ""
echo "✅ Sistemas organizados!"