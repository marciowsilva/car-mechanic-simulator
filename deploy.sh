#!/bin/bash

# Configurações
EXTENSAO=".meulog"
DATA_ATUAL=$(date +"%d-%m-%Y_%H-%M-%S")
NOME_ARQUIVO="${DATA_ATUAL}${EXTENSAO}"

# Função para exibir Caixa de Mensagem (Pop-up) no Windows
exibir_popup() {
    local titulo=$1
    local mensagem=$2
    local icone=$3 # Pode ser 'Information', 'Error', 'Warning'

    powershell.exe -NoProfile -Command "
        [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;
        [System.Windows.Forms.MessageBox]::Show(\"$mensagem\", \"$titulo\", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::$icone);
    "
}

abortar() {
    echo "❌ ERRO CRÍTICO: $1"
    exibir_popup "Falha no Git!" "Ocorreu um erro em: $1. O processo foi interrompido." "Error"
    exit 1
}

# --- Início do Fluxo ---

echo "🧹 Removendo arquivos *$EXTENSAO..."
rm -f *"$EXTENSAO"

echo "📝 Criando log: $NOME_ARQUIVO"
echo "Check-in: $DATA_ATUAL" > "$NOME_ARQUIVO"

echo "📦 Committing..."
git add .
git commit -m "Auto-deploy: $DATA_ATUAL" --allow-empty

echo "📤 Subindo Desenvolvimento..."
git push || abortar "Push Desenvolvimento"

echo "🔄 Fazendo Merge para Master..."
git checkout master || abortar "Checkout Master"
git merge desenvolvimento --no-edit || abortar "Merge"

echo "🚀 Enviando para o GitHub (Master)..."
git push origin master || abortar "Push Master"

echo "🌿 Voltando para Desenvolvimento..."
git checkout desenvolvimento || abortar "Retorno para Desenvolvimento"

echo "🔍 Diferença final:"
git diff master..desenvolvimento

# Pop-up Final de Sucesso
exibir_popup "Sucesso!" "O deploy foi concluído e os arquivos estão no GitHub." "Information"

echo "✨ Script finalizado com sucesso!"