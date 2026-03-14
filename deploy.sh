#!/bin/bash

# Configurações
EXTENSAO=".meulog"
DATA_ATUAL=$(date +"%d-%m-%Y_%H-%M-%S")
NOME_ARQUIVO="${DATA_ATUAL}${EXTENSAO}"
LIMITE_MB=99

exibir_popup() {
    local titulo=$1
    local mensagem=$2
    local icone=$3
    powershell.exe -NoProfile -Command "
        [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;
        [System.Windows.Forms.MessageBox]::Show(\"$mensagem\", \"$titulo\", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::$icone);
    "
}

abortar() {
    echo "❌ ERRO CRÍTICO: $1"
    exibir_popup "Falha no Git!" "Erro em: $1" "Error"
    exit 1
}

# --- NOVA FUNÇÃO: VERIFICAR ARQUIVOS GRANDES ---
verificar_arquivos_grandes() {
    echo "🔍 Verificando se existem arquivos maiores que ${LIMITE_MB}MB..."
    # Busca arquivos maiores que o limite, ignorando a pasta .git
    ARQUIVOS_PESADOS=$(find . -type f -not -path '*/.*' -size +"${LIMITE_MB}M")

    if [ ! -z "$ARQUIVOS_PESADOS" ]; then
        echo "⚠️ ATENÇÃO: Arquivos pesados detectados!"
        echo "$ARQUIVOS_PESADOS"
        exibir_popup "Arquivo muito grande!" "Detectamos arquivos maiores que ${LIMITE_MB}MB:\n$ARQUIVOS_PESADOS\n\nRemova-os ou use Git LFS antes de prosseguir." "Warning"
        exit 1
    fi
}

# --- Início do Fluxo ---

# 1. Verificar arquivos antes de qualquer coisa
verificar_arquivos_grandes

# 2. Limpeza
echo "🧹 Removendo arquivos *$EXTENSAO..."
rm -f *"$EXTENSAO"

# 3. Criação do Log
echo "📝 Criando log: $NOME_ARQUIVO"
echo "Check-in: $DATA_ATUAL" > "$NOME_ARQUIVO"

# 4. Git Flow
echo "📦 Committing..."
git add .
git commit -m "Auto-deploy: $DATA_ATUAL" --allow-empty

echo "📤 Subindo Desenvolvimento..."
git push || abortar "Push Desenvolvimento (Verifique se há arquivos grandes no histórico)"
echo "🚀 Enviando para o GitHub (Desenvolvimento)..."
git push origin desenvolvimento || abortar "Push Desenvolvimento"

echo "🔄 Fazendo Merge para Master..."
git checkout master || abortar "Checkout Master"
git merge desenvolvimento --no-edit || abortar "Merge"

echo "🚀 Enviando para o GitHub (Master)..."
git push origin master || abortar "Push Master"

echo "🌿 Voltando para Desenvolvimento..."
git checkout desenvolvimento || abortar "Retorno"

exibir_popup "Sucesso!" "O deploy foi concluído com sucesso." "Information"
echo "✨ Concluído!"