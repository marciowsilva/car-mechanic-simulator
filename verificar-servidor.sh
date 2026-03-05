#!/bin/bash

# verificar-servidor.sh - Verifica se o servidor está configurado corretamente

echo "================================="
echo "🔍 VERIFICANDO CONFIGURAÇÃO DO SERVIDOR"
echo "================================="
echo ""

# Verificar se o VS Code está instalado
if ! command -v code &> /dev/null; then
    echo "⚠️  VS Code não encontrado no PATH"
else
    echo "✅ VS Code encontrado"
fi

# Verificar extensão Live Server
echo ""
echo "📦 Verificando extensão Live Server..."
if code --list-extensions | grep -q "ritwickdey.liveserver"; then
    echo "✅ Live Server instalado"
else
    echo "❌ Live Server NÃO instalado"
    echo "   Instale com: ext install ritwickdey.liveserver"
fi

# Verificar arquivo de configuração
echo ""
echo "📁 Verificando configuração..."
if [ -f ".vscode/settings.json" ]; then
    echo "✅ .vscode/settings.json existe"
    echo "   Conteúdo:"
    cat .vscode/settings.json | sed 's/^/   /'
else
    echo "❌ .vscode/settings.json NÃO existe"
    echo "   Criando configuração padrão..."
    
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
    "liveServer.settings.root": "/",
    "liveServer.settings.mount": [
        ["/src", "/src"]
    ],
    "liveServer.settings.port": 5501,
    "liveServer.settings.host": "127.0.0.1",
    "liveServer.settings.wait": 100,
    "liveServer.settings.fullReload": true
}
EOF
    echo "✅ Configuração criada"
fi

# Verificar arquivos necessários
echo ""
echo "📋 Verificando arquivos necessários..."
if [ -f "src/core/Game.js" ]; then
    echo "✅ src/core/Game.js existe"
else
    echo "❌ src/core/Game.js NÃO existe"
fi

if [ -f "src/ui/index.html" ]; then
    echo "✅ src/ui/index.html existe"
else
    echo "❌ src/ui/index.html NÃO existe"
fi

# Testar se o servidor está rodando
echo ""
echo "🌐 Testando servidor (se estiver rodando)..."
if curl -s http://127.0.0.1:5501/src/ui/index.html > /dev/null; then
    echo "✅ Servidor respondendo em http://127.0.0.1:5501"
else
    echo "❌ Servidor não está respondendo"
    echo "   Abra o VS Code e inicie o Live Server"
fi

echo ""
echo "================================="
echo "📝 INSTRUÇÕES:"
echo "================================="
echo "1. Abra o VS Code na raiz do projeto"
echo "2. Pressione Ctrl+Shift+P"
echo "3. Digite 'Live Server: Open with Live Server'"
echo "4. Selecione src/ui/index.html"
echo ""
echo "✅ Diagnóstico concluído!"