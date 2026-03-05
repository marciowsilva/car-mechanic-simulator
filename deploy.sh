#!/bin/bash

# Configurações
EXTENSAO=".meulog"
DATA_ATUAL=$(date +"%d-%m-%Y_%H-%M-%S")
NOME_ARQUIVO="${DATA_ATUAL}${EXTENSAO}"

# Função para verificar se o comando anterior deu certo
verificar_erro() {
    if [ $? -ne 0 ]; then
        echo "❌ ERRO: O comando anterior falhou. Abortando script."
        exit 1
    fi
}

echo "🧹 Removendo arquivos antigos com a extensão $EXTENSAO..."
rm -f *$EXTENSAO

echo "📝 Criando novo arquivo: $NOME_ARQUIVO"
echo "Check-in realizado em: $DATA_ATUAL" > "$NOME_ARQUIVO"

# Fluxo Git
echo "📦 Adicionando arquivos e realizando commit..."
git add .
git commit -m "Auto-deploy: $DATA_ATUAL"
# O commit pode falhar se não houver nada novo, então não encerramos o script aqui
# mas verificamos o push rigorosamente.

echo "📤 Subindo para desenvolvimento..."
git push
verificar_erro

echo "🔄 Indo para master e realizando merge..."
git checkout master && git merge desenvolvimento
verificar_erro

echo "🚀 Enviando master para o GitHub..."
git push origin master
verificar_erro

echo "🌿 Voltando para desenvolvimento..."
git checkout desenvolvimento
verificar_erro

echo "🔍 Diferença atual (master vs desenvolvimento):"
git diff master..desenvolvimento

echo "✅ Missão cumprida! Tudo no GitHub e branches sincronizadas."