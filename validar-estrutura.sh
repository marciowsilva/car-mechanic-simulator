#!/bin/bash

# validar-estrutura.sh - Script de validação completa

echo "================================="
echo "🔍 VALIDAÇÃO DA ESTRUTURA DO PROJETO"
echo "================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
total=0
ok=0
warning=0
error=0

# Função para verificar arquivo
check_file() {
    total=$((total+1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ OK:${NC} $1"
        ok=$((ok+1))
    else
        echo -e "${RED}❌ FALTANDO:${NC} $1"
        error=$((error+1))
    fi
}

# Função para verificar possível duplicata
check_duplicate() {
    # Verifica se os dois caminhos apontam para o mesmo arquivo (mesmo inode)
    if [ -f "$1" ] && [ -f "$2" ]; then
        inode1=$(ls -i "$1" 2>/dev/null | awk '{print $1}')
        inode2=$(ls -i "$2" 2>/dev/null | awk '{print $1}')
        
        if [ "$inode1" != "$inode2" ]; then
            echo -e "${YELLOW}⚠️ DUPLICATA REAL:${NC} $1 e $2 (inodes diferentes: $inode1 vs $inode2)"
            warning=$((warning+1))
        else
            echo -e "${GREEN}ℹ️  MESMO ARQUIVO:${NC} $1 e $2 (inode: $inode1) - ignorado"
        fi
    fi
}

echo "📁 Verificando pasta src/cars/..."
check_file "src/cars/Car.js"
check_file "src/cars/CarModels.js"
check_file "src/cars/CarModelLoader.js"
check_file "src/cars/CarParts.js"
check_file "src/cars/Job.js"

# Verificar possíveis duplicatas em cars
check_duplicate "src/cars/Car.js" "src/cars/car.js"
check_duplicate "src/cars/CarModels.js" "src/cars/car-models.js"
check_duplicate "src/cars/CarModelLoader.js" "src/cars/car-model-loader.js"

echo ""
echo "📁 Verificando pasta src/core/..."
check_file "src/core/Game.js"
check_file "src/core/Database.js"

echo ""
echo "📁 Verificando pasta src/garage/..."
check_file "src/garage/Garage.js"
check_file "src/garage/GarageLayout.js"
check_file "src/garage/Scene3D.js"
check_duplicate "src/garage/Scene3D.js" "src/garage/scene3d.js"

echo ""
echo "📁 Verificando pasta src/systems/..."

# Verificar arquivos principais em systems
check_file "src/systems/inventory.js"
check_file "src/systems/daily-challenges.js"
check_file "src/systems/used-parts-market.js"
check_file "src/systems/career-mode.js"
check_file "src/systems/specializations.js"
check_file "src/systems/upgrade-system.js"
check_file "src/systems/audio.js"

# Verificar subpastas
echo ""
echo "📁 Verificando subsystems..."

# Achievements
if [ -d "src/systems/achievements" ]; then
    check_file "src/systems/achievements/AchievementSystem.js"
else
    check_file "src/systems/achievement-system.js"
fi

# Customers
if [ -d "src/systems/customers" ]; then
    check_file "src/systems/customers/CustomerSystem.js"
else
    check_file "src/systems/customer-system.js"
    check_file "src/systems/customersystem.js"
fi

# Tournaments
if [ -d "src/systems/tournaments" ]; then
    check_file "src/systems/tournaments/TournamentSystem.js"
else
    check_file "src/systems/tournament-system.js"
    check_file "src/systems/tournaments.js"
fi

echo ""
echo "📁 Verificando pasta src/ui/..."
check_file "src/ui/index.html"
check_file "src/ui/style.css"
check_file "src/ui/UIManager.js"
check_duplicate "src/ui/UIManager.js" "src/ui/ui.js"

echo ""
echo "📁 Verificando pasta src/assets/..."
check_file "src/assets/models/sedan.glb"
check_file "src/assets/models/hatch.glb"
check_file "src/assets/models/suv.glb"
check_file "src/assets/models/pickup.glb"
check_file "src/assets/models/sports.glb"
check_file "src/assets/models/classic.glb"

echo ""
echo "================================="
echo "📊 RESUMO DA VALIDAÇÃO"
echo "================================="
echo -e "${GREEN}✅ OK: $ok${NC}"
echo -e "${YELLOW}⚠️  Avisos (duplicatas): $warning${NC}"
echo -e "${RED}❌ Erros (arquivos faltando): $error${NC}"
echo "================================="

if [ $warning -gt 0 ] || [ $error -gt 0 ]; then
    echo ""
    echo "🔧 PRÓXIMOS PASSOS RECOMENDADOS:"
    
    if [ $warning -gt 0 ]; then
        echo "1. Resolver arquivos duplicados (manter o mais completo)"
    fi
    
    if [ $error -gt 0 ]; then
        echo "2. Criar ou mover arquivos faltantes"
    fi
    
    echo "3. Atualizar imports após renomeações"
    echo "4. Testar o jogo"
fi