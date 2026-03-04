#!/bin/bash

# testar-jogo.sh - Testa se o jogo carrega

echo "================================="
echo "🎮 TESTANDO O JOGO"
echo "================================="
echo ""

# Verificar se index.html existe
if [ -f "src/ui/index.html" ]; then
    echo "✅ index.html encontrado"
    
    # Abrir no navegador (Linux)
    if command -v xdg-open &> /dev/null; then
        xdg-open "src/ui/index.html"
    # Mac
    elif command -v open &> /dev/null; then
        open "src/ui/index.html"
    # Windows
    elif command -v start &> /dev/null; then
        start "src/ui/index.html"
    else
        echo "📁 Abra manualmente: src/ui/index.html"
    fi
else
    echo "❌ index.html não encontrado em src/ui/"
    echo "Criando um básico..."
    
    cat > src/ui/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Car Mechanic Simulator</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="game-container"></div>
    
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.128.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.128.0/examples/jsm/"
            }
        }
    </script>
    
    <script type="module" src="../core/Game.js"></script>
</body>
</html>
EOF
    echo "✅ index.html criado"
fi

echo ""
echo "📊 Verificando erros comuns:"

# Verificar imports circulares
echo "🔍 Procurando imports circulares..."
find src -name "*.js" -exec grep -l "from '\.\." {} \; | while read file; do
    echo "   📄 $file"
done

echo ""
echo "✅ Teste concluído!"
echo "👉 Verifique o console do navegador para erros"