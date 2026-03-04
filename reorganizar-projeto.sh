#!/bin/bash

# reorganizar-projeto.sh - Script completo e seguro

echo "================================="
echo "🔄 REORGANIZAÇÃO DO PROJETO"
echo "================================="
echo ""

# 1. Backup
echo "📦 Criando backup..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r *.js *.css *.html models textures sounds $BACKUP_DIR/ 2>/dev/null || true
echo "✅ Backup criado em $BACKUP_DIR"
echo ""

# 2. Criar estrutura
echo "📁 Criando nova estrutura..."
mkdir -p src/{core,garage,cars,systems,ui,utils,assets/{models,textures,sounds}}
echo "✅ Estrutura criada"
echo ""

# 3. Listar arquivos encontrados
echo "📋 Arquivos encontrados:"
ls *.js *.css *.html 2>/dev/null || echo "Nenhum arquivo encontrado na raiz"
echo ""

# 4. Perguntar se quer continuar
read -p "❓ Deseja continuar com a migração? (s/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "❌ Operação cancelada"
    exit 1
fi

# 5. Mover arquivos (com verificação)
echo ""
echo "📦 Movendo arquivos..."

# Função para mover com verificação
move_file() {
    if [ -f "$1" ]; then
        mv "$1" "$2"
        echo "   ✅ Movido: $1 → $2"
    else
        echo "   ⚠️ Arquivo não encontrado: $1"
    fi
}

# Mover arquivos core
move_file "game.js" "src/core/Game.js"
move_file "database.js" "src/core/Database.js"
move_file "state.js" "src/core/State.js"

# Mover arquivos de carros
move_file "car.js" "src/cars/Car.js"
move_file "car-models.js" "src/cars/CarModels.js"
move_file "car-parts.js" "src/cars/CarParts.js"

# Mover arquivos da garagem
move_file "garage.js" "src/garage/Garage.js"
move_file "garage-layout.js" "src/garage/GarageLayout.js"

# Mover sistemas
move_file "inventory.js" "src/systems/Inventory.js"
move_file "customers.js" "src/systems/CustomerSystem.js"
move_file "daily-challenges.js" "src/systems/DailyChallenges.js"
move_file "achievements.js" "src/systems/Achievements.js"
move_file "economy.js" "src/systems/Economy.js"
move_file "skills.js" "src/systems/Skills.js"

# Mover UI
move_file "ui.js" "src/ui/UIManager.js"
move_file "style.css" "src/ui/style.css"
move_file "index.html" "src/ui/index.html"

# Mover utils
move_file "constants.js" "src/utils/constants.js"
move_file "helpers.js" "src/utils/helpers.js"
move_file "logger.js" "src/utils/logger.js"

# Mover assets
if [ -d "models" ]; then
    mv models/* src/assets/models/ 2>/dev/null
    echo "   ✅ Modelos movidos"
fi

if [ -d "textures" ]; then
    mv textures/* src/assets/textures/ 2>/dev/null
    echo "   ✅ Texturas movidas"
fi

if [ -d "sounds" ]; then
    mv sounds/* src/assets/sounds/ 2>/dev/null
    echo "   ✅ Sons movidos"
fi

echo ""
echo "✅ Migração concluída!"
echo ""
echo "📁 Estrutura final:"
find src -type d -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
echo ""
echo "⚠️ PRÓXIMOS PASSOS:"
echo "1. Atualizar imports em todos os arquivos"
echo "2. Testar o jogo"
echo "3. Corrigir possíveis erros de caminho"