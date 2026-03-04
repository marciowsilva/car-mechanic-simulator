#!/bin/bash

# resolver-duplicatas.sh - Ajuda a resolver arquivos duplicados

compare_files() {
    echo ""
    echo "📊 Comparando $1 e $2"
    echo "----------------------------------------"
    
    if [ -f "$1" ] && [ -f "$2" ]; then
        size1=$(wc -l < "$1")
        size2=$(wc -l < "$2")
        date1=$(stat -c %y "$1" 2>/dev/null || stat -f %Sm "$1" 2>/dev/null)
        date2=$(stat -c %y "$2" 2>/dev/null || stat -f %Sm "$2" 2>/dev/null)
        
        echo "Arquivo 1: $1"
        echo "  Linhas: $size1"
        echo "  Data: $date1"
        echo ""
        echo "Arquivo 2: $2"
        echo "  Linhas: $size2"
        echo "  Data: $date2"
        echo ""
        
        if [ $size1 -gt $size2 ]; then
            echo "👉 Sugestão: Manter $1 (maior)"
            echo "   Comando: rm $2"
        elif [ $size2 -gt $size1 ]; then
            echo "👉 Sugestão: Manter $2 (maior)"
            echo "   Comando: rm $1"
        else
            echo "👉 Mesmo tamanho, verificar datas"
            if [[ "$date1" > "$date2" ]]; then
                echo "   Manter $1 (mais recente)"
            else
                echo "   Manter $2 (mais recente)"
            fi
        fi
    else
        echo "Um dos arquivos não existe"
    fi
}

echo "================================="
echo "🔄 ANÁLISE DE DUPLICATAS"
echo "================================="

# Verificar duplicatas comuns
compare_files "src/cars/Car.js" "src/cars/car.js"
compare_files "src/cars/CarModels.js" "src/cars/car-models.js"
compare_files "src/cars/CarModelLoader.js" "src/cars/car-model-loader.js"
compare_files "src/garage/Scene3D.js" "src/garage/scene3d.js"
compare_files "src/ui/UIManager.js" "src/ui/ui.js"

# Sistemas
compare_files "src/systems/achievement-system.js" "src/systems/achievements/AchievementSystem.js"
compare_files "src/systems/customer-system.js" "src/systems/customersystem.js"
compare_files "src/systems/tournament-system.js" "src/systems/tournaments.js"