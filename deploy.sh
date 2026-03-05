#!/bin/bash

EXTENSAO=".meulog"
DATA_ATUAL=$(date +"%d-%m-%Y_%H-%M-%S")
NOME_ARQUIVO="${DATA_ATUAL}${EXTENSAO}"

# Função de Notificação específica para Windows via Git Bash
enviar_notificacao() {
    local titulo=$1
    local mensagem=$2
    
    # Usamos o comando "PowerShell -Command" com aspas simples externas
    # e garantimos que o ícone seja um padrão do sistema (Information)
    powershell.exe -NoProfile -Command "
        [reflection.assembly]::loadwithpartialname('System.Windows.Forms') | Out-Null;
        \$balao = New-Object System.Windows.Forms.NotifyIcon;
        \$balao.Icon = [System.Drawing.SystemIcons]::Information;
        \$balao.BalloonTipTitle = \"$titulo\";
        \$balao.BalloonTipText = \"$mensagem\";
        \$balao.Visible = \$true;
        \$balao.ShowBalloonTip(5000);
        Start-Sleep -Seconds 1;
        \$balao.Dispose();
    "
}

abortar() {
    echo "❌ ERRO CRÍTICO: $1"
    enviar_notificacao "Falha no Git!" "Erro em: $1"
    exit 1
}

# --- Início do Processo ---

echo "🧹 Removendo arquivos *$EXTENSAO..."
rm -f *"$EXTENSAO"

echo "📝 Criando log: $NOME_ARQUIVO"
echo "Log: $DATA_ATUAL" > "$NOME_ARQUIVO"

echo "📦 Commitando..."
git add .
git commit -m "Auto-deploy: $DATA_ATUAL" --allow-empty

echo "📤 Push Desenvolvimento..."
git push || abortar "Push Desenvolvimento"

echo "🔄 Merge para Master..."
git checkout master || abortar "Checkout Master"
git merge desenvolvimento --no-edit || abortar "Merge"

echo "🚀 Push Master..."
git push origin master || abortar "Push Master"

echo "🌿 Voltando para Desenvolvimento..."
git checkout desenvolvimento || abortar "Retorno"

# Notificação Final
enviar_notificacao "Sucesso!" "O script terminou e tudo está no GitHub."
echo "✨ Concluído!"