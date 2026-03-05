#!/bin/bash

# adicionar-globais.sh - Adiciona exposição global aos arquivos

echo "================================="
echo "🌐 ADICIONANDO EXPOSIÇÃO GLOBAL"
echo "================================="

# Arquivos para modificar
arquivos=(
    "src/garage/Scene3D.js"
    "src/ui/UIManager.js"
    "src/systems/Inventory.js"
    "src/systems/upgrade-system.js"
    "src/systems/achievements/AchievementSystem.js"
    "src/systems/customers/CustomerSystem.js"
    "src/systems/challenges/DailyChallenges.js"
    "src/systems/market/used-parts-market.js"
    "src/cars/Job.js"
    "src/cars/Car.js"
)

for arquivo in "${arquivos[@]}"; do
    if [ -f "$arquivo" ]; then
        echo "📄 Processando $arquivo..."
        
        # Extrair nome da classe (assume que a classe tem o mesmo nome do arquivo)
        nome_classe=$(basename "$arquivo" .js | sed -r 's/(^|-)([a-z])/\U\2/g')
        
        # Adicionar exposição global
        cat >> "$arquivo" << EOF

// Expor globalmente
if (typeof window !== 'undefined') {
    window.${nome_classe} = ${nome_classe};
    console.log('🌐 ${nome_classe} disponível globalmente');
}
EOF
        echo "   ✅ Global adicionado"
    else
        echo "⚠️ Arquivo não encontrado: $arquivo"
    fi
done

echo ""
echo "✅ Processo concluído!"