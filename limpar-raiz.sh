#!/bin/bash

# limpar-raiz.sh - Script para mover arquivos restantes da raiz

echo "================================="
echo "🧹 LIMPEZA DA RAIZ DO PROJETO"
echo "================================="
echo ""

# Criar backup primeiro
BACKUP_DIR="backup-final-$(date +%Y%m%d-%H%M%S)"
echo "📦 Criando backup em $BACKUP_DIR..."
mkdir -p $BACKUP_DIR
cp -r * $BACKUP_DIR/ 2>/dev/null
echo "✅ Backup criado"
echo ""

# Listar tudo que está na raiz
echo "📋 Arquivos e pastas na raiz:"
ls -la
echo ""

# Perguntar se quer continuar
read -p "❓ Deseja organizar todos os arquivos? (s/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "❌ Operação cancelada"
    exit 1
fi

echo ""
echo "📦 Movendo arquivos para src/..."

# Função para mover com verificação
move_to_src() {
    if [ -f "$1" ]; then
        # Extrair nome do arquivo sem caminho
        filename=$(basename "$1")
        
        # Determinar destino baseado no nome
        case "$filename" in
            game.js|database.js|state*.js|main.js)
                dest="src/core/$filename"
                ;;
            car*.js)
                dest="src/cars/$filename"
                ;;
            garage*.js|lifts.js|workbench*.js)
                dest="src/garage/$filename"
                ;;
            inventory.js|customer*.js|daily*.js|achievement*.js|economy*.js|skill*.js|challenge*.js|market*.js|career*.js|tournament*.js)
                dest="src/systems/$filename"
                ;;
            ui.js|style.css|index.html|*.css|*.html)
                dest="src/ui/$filename"
                ;;
            constant*.js|helper*.js|logger*.js|util*.js)
                dest="src/utils/$filename"
                ;;
            *.glb|*.gltf|*.bin|*.obj|*.fbx)
                dest="src/assets/models/$filename"
                ;;
            *.jpg|*.jpeg|*.png|*.gif|*.svg|*.webp)
                dest="src/assets/textures/$filename"
                ;;
            *.mp3|*.wav|*.ogg|*.m4a)
                dest="src/assets/sounds/$filename"
                ;;
            *)
                dest="src/outros/$filename"
                mkdir -p src/outros
                ;;
        esac
        
        # Mover arquivo
        mv "$1" "$dest"
        echo "   ✅ Movido: $filename → $dest"
    fi
}

# Mover todos os arquivos .js
echo ""
echo "📁 Movendo arquivos JavaScript..."
for file in *.js; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover arquivos .css
echo ""
echo "🎨 Movendo arquivos CSS..."
for file in *.css; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover arquivos .html
echo ""
echo "📄 Movendo arquivos HTML..."
for file in *.html; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover modelos 3D
echo ""
echo "🚗 Movendo modelos 3D..."
for file in *.glb *.gltf *.bin *.obj *.fbx; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover texturas
echo ""
echo "🎨 Movendo texturas..."
for file in *.jpg *.jpeg *.png *.gif *.svg *.webp; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover sons
echo ""
echo "🔊 Movendo sons..."
for file in *.mp3 *.wav *.ogg *.m4a; do
    [ -f "$file" ] && move_to_src "$file"
done

# Mover pastas (se houver)
echo ""
echo "📂 Movendo pastas..."
for dir in models textures sounds; do
    if [ -d "$dir" ] && [ "$dir" != "src" ] && [ "$dir" != "backup"* ]; then
        if [ "$dir" == "models" ]; then
            mv "$dir"/* src/assets/models/ 2>/dev/null
        elif [ "$dir" == "textures" ]; then
            mv "$dir"/* src/assets/textures/ 2>/dev/null
        elif [ "$dir" == "sounds" ]; then
            mv "$dir"/* src/assets/sounds/ 2>/dev/null
        fi
        rmdir "$dir" 2>/dev/null
        echo "   ✅ Pasta $dir movida"
    fi
done

# Remover diretórios vazios
echo ""
echo "🧹 Removendo diretórios vazios..."
find . -type d -empty -delete 2>/dev/null

echo ""
echo "================================="
echo "✅ LIMPEZA CONCLUÍDA!"
echo "================================="
echo ""

# Mostrar resultado
echo "📁 Estrutura final do src/:"
find src -type f -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g' | head -20
echo "..."

echo ""
echo "📋 Arquivos restantes na raiz:"
ls -la | grep -v "^total" | grep -v "src" | grep -v "backup"
echo ""
echo "⚠️ Se houver arquivos acima, verifique manualmente"