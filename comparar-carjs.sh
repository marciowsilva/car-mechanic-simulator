#!/bin/bash

# comparar-carjs.sh - Compara as duas versões de Car.js

echo "================================="
echo "🔍 COMPARANDO ARQUIVOS CAR.JS"
echo "================================="
echo ""

if [ -f "src/cars/Car.js" ] && [ -f "src/cars/car.js" ]; then
    echo "📊 src/cars/Car.js:"
    echo "   Linhas: $(wc -l < src/cars/Car.js)"
    echo "   Tamanho: $(du -h src/cars/Car.js | cut -f1)"
    echo "   Última modificação: $(stat -c %y src/cars/Car.js 2>/dev/null || stat -f %Sm src/cars/Car.js 2>/dev/null)"
    echo ""
    
    echo "📊 src/cars/car.js:"
    echo "   Linhas: $(wc -l < src/cars/car.js)"
    echo "   Tamanho: $(du -h src/cars/car.js | cut -f1)"
    echo "   Última modificação: $(stat -c %y src/cars/car.js 2>/dev/null || stat -f %Sm src/cars/car.js 2>/dev/null)"
    echo ""
    
    # Verificar qual tem mais conteúdo
    lines1=$(wc -l < src/cars/Car.js)
    lines2=$(wc -l < src/cars/car.js)
    
    if [ $lines1 -gt $lines2 ]; then
        echo "👉 src/cars/Car.js é MAIOR ($lines1 linhas)"
        echo "   Comando para remover o outro: rm src/cars/car.js"
    elif [ $lines2 -gt $lines1 ]; then
        echo "👉 src/cars/car.js é MAIOR ($lines2 linhas)"
        echo "   Comando para remover o outro: rm src/cars/Car.js"
    else
        echo "👉 Mesmo tamanho. Verifique as datas de modificação."
    fi
else
    echo "❌ Um dos arquivos não existe"
fi