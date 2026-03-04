#!/bin/bash

# setup-models.sh - Script de instalação para Linux/Mac

echo "================================="
echo "🚗 CONFIGURAÇÃO DE MODELOS 3D"
echo "================================="
echo ""

# Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p models/cars/textures
mkdir -p temp

echo "   ✅ Diretórios criados"
echo ""

# Verificar dependências
echo "🔍 Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js não encontrado"
    echo "   📦 Instale Node.js em: https://nodejs.org"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js $NODE_VERSION encontrado"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "   ❌ npm não encontrado"
    exit 1
else
    echo "   ✅ npm encontrado"
fi

# Verificar curl
if ! command -v curl &> /dev/null; then
    echo "   ⚠️  curl não encontrado (opcional)"
else
    echo "   ✅ curl encontrado"
fi

echo ""

# Verificar espaço em disco
SPACE_AVAILABLE=$(df -k . | awk 'NR==2 {print $4}')
SPACE_NEEDED=$((100 * 1024)) # 100MB estimado

if [ $SPACE_AVAILABLE -lt $SPACE_NEEDED ]; then
    echo "❌ Espaço em disco insuficiente"
    echo "   Disponível: $((SPACE_AVAILABLE / 1024))MB"
    echo "   Necessário: $((SPACE_NEEDED / 1024))MB"
    exit 1
else
    echo "💾 Espaço em disco OK"
    echo "   Disponível: $((SPACE_AVAILABLE / 1024))MB"
fi

echo ""

# Executar script Node.js
echo "🚀 Executando download dos modelos..."
echo ""

node download-models.js

# Limpar arquivos temporários
echo ""
echo "🧹 Limpando arquivos temporários..."
rm -rf temp
echo "   ✅ Limpeza concluída"

echo ""
echo "✅ Configuração finalizada!"