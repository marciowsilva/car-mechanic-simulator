#!/bin/bash

# validar-final.sh - Validação final da estrutura

echo "================================="
echo "✅ VALIDAÇÃO FINAL"
echo "================================="
echo ""

echo "📁 ESTRUTURA FINAL:"
echo "==================="

# Contar arquivos por pasta
echo "src/cars/: $(ls -1 src/cars/*.js 2>/dev/null | wc -l) arquivos"
echo "src/core/: $(ls -1 src/core/*.js 2>/dev/null | wc -l) arquivos"
echo "src/garage/: $(ls -1 src/garage/*.js 2>/dev/null | wc -l) arquivos"
echo "src/systems/: $(ls -1 src/systems/*.js 2>/dev/null | wc -l) arquivos (raiz)"
echo "src/systems/achievements/: $(ls -1 src/systems/achievements/*.js 2>/dev/null | wc -l) arquivos"
echo "src/systems/customers/: $(ls -1 src/systems/customers/*.js 2>/dev/null | wc -l) arquivos"
echo "src/systems/challenges/: $(ls -1 src/systems/challenges/*.js 2>/dev/null | wc -l) arquivos"
echo "src/systems/market/: $(ls -1 src/systems/market/*.js 2>/dev/null | wc -l) arquivos"
echo "src/ui/: $(ls -1 src/ui/*.js 2>/dev/null | wc -l) arquivos"
echo "src/utils/: $(ls -1 src/utils/*.js 2>/dev/null | wc -l) arquivos"
echo "src/assets/models/cars/: $(ls -1 src/assets/models/cars/*.glb 2>/dev/null | wc -l) modelos"

echo ""
echo "📋 LISTA COMPLETA DE ARQUIVOS:"
echo "================================"
find src -type f -name "*.js" -o -name "*.glb" | sort | sed 's/^/   /'

echo ""
echo "✅ Validação concluída!"