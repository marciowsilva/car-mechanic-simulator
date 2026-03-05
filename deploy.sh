#!/bin/bash

# Configurações
EXTENSAO=".meulog"
DATA_ATUAL=$(date +"%d-%m-%Y_%H-%M-%S")
NOME_ARQUIVO="${DATA_ATUAL}${EXTENSAO}"

# Função de Notificação (Detecta OS)
enviar_notificacao() {
    local titulo=$1
    local mensagem=$2
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        notify-send "$titulo" "$mensagem"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "display notification \"$mensagem\" with title \"$titulo\""
    fi
}

# Função de erro fatal
abortar() {
    echo "❌ ERRO CRÍTICO: $1"
    enviar_notificacao "Falha no Git!" "Ocorreu um erro durante: $1"
    exit 1
}

echo "🧹 Removendo arquivos antigos *${EXTENSAO}..."
rm -f *"$EXTENSAO" || abortar "Remoção de arquivo antigo"

echo "📝 Criando log: $NOME_ARQUIVO"
echo "Log gerado em: $DATA_ATUAL" > "$NOME_ARQUIVO"

# Fluxo Git com verificações estritas
echo "📦 Preparando commit..."
git add .
git commit -m "Auto-deploy: $DATA_ATUAL" --allow-empty # Permite rodar mesmo sem mudanças

echo "📤 Subindo para desenvolvimento..."
git push || abortar "Push para desenvolvimento"

echo "🔄 Trocando para Master e realizando Merge..."
git checkout master || abortar "Checkout master"
git merge desenvolvimento --no-edit || abortar "Merge com desenvolvimento"

echo "🚀 Enviando Master para o GitHub..."
git push origin master || abortar "Push origin master"

echo "🌿 Retornando para Desenvolvimento..."
git checkout desenvolvimento || abortar "Retorno para desenvolvimento"

echo "🔍 Diferença final entre branches:"
git diff master..desenvolvimento

# Notificação de Sucesso
enviar_notificacao "Git Sync OK" "Tudo foi enviado com sucesso para o GitHub!"
echo "✨ Processo finalizado com sucesso em $(date +%H:%M:%S)."