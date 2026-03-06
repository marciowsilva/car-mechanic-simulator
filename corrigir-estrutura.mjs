// corrigir-estrutura.mjs - Script de correção ES Module

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=================================');
console.log('🔧 CORRIGINDO ESTRUTURA DO PROJETO');
console.log('=================================\n');

// 1. Criar pasta customers se não existir
if (!fs.existsSync('src/systems/customers')) {
    fs.mkdirSync('src/systems/customers', { recursive: true });
    console.log('✅ Pasta src/systems/customers criada');
}

// 2. Mover CustomerManager para a pasta correta
if (fs.existsSync('src/systems/CustomerManager.js')) {
    console.log('📦 Movendo CustomerManager.js para customers/...');
    
    // Verificar se já existe em customers
    if (fs.existsSync('src/systems/customers/CustomerManager.js')) {
        console.log('⚠️  CustomerManager.js já existe em customers/');
        
        // Comparar tamanhos para decidir
        const stats1 = fs.statSync('src/systems/CustomerManager.js');
        const stats2 = fs.statSync('src/systems/customers/CustomerManager.js');
        
        if (stats1.size > stats2.size) {
            console.log('   O arquivo na raiz é maior, substituindo...');
            fs.copyFileSync('src/systems/CustomerManager.js', 'src/systems/customers/CustomerManager.js');
            fs.unlinkSync('src/systems/CustomerManager.js');
            console.log('   ✅ Substituído');
        } else {
            console.log('   O arquivo em customers é maior, removendo duplicata...');
            fs.unlinkSync('src/systems/CustomerManager.js');
            console.log('   ✅ Duplicata removida');
        }
    } else {
        // Mover simplesmente
        fs.renameSync('src/systems/CustomerManager.js', 'src/systems/customers/CustomerManager.js');
        console.log('✅ Movido com sucesso!');
    }
} else {
    console.log('✅ CustomerManager.js já está no local correto ou não existe');
}

// 3. Verificar se existe CustomerSystem.js e CustomerManager.js duplicados
if (fs.existsSync('src/systems/customers/CustomerSystem.js') && 
    fs.existsSync('src/systems/customers/CustomerManager.js')) {
    
    console.log('\n⚠️  DOIS ARQUIVOS DE CLIENTE ENCONTRADOS:');
    
    // Comparar tamanhos
    const stats1 = fs.statSync('src/systems/customers/CustomerSystem.js');
    const stats2 = fs.statSync('src/systems/customers/CustomerManager.js');
    
    console.log(`   📊 CustomerSystem.js: ${stats1.size} bytes`);
    console.log(`   📊 CustomerManager.js: ${stats2.size} bytes`);
    
    if (stats1.size > stats2.size) {
        console.log('   ✅ CustomerSystem.js é maior (pode ser o mais completo)');
        console.log('   💡 Sugestão: Revisar e unificar funcionalidades mantendo CustomerSystem.js');
    } else {
        console.log('   ✅ CustomerManager.js é maior (pode ser o mais completo)');
        console.log('   💡 Sugestão: Revisar e unificar funcionalidades mantendo CustomerManager.js');
    }
}

// 4. Verificar Exports.js e atualizar caminho se necessário
if (fs.existsSync('src/core/Exports.js')) {
    console.log('\n📝 Verificando Exports.js...');
    
    let conteudo = fs.readFileSync('src/core/Exports.js', 'utf8');
    let modificado = false;
    
    // Verificar caminho antigo do CustomerManager
    if (conteudo.includes('"/src/systems/CustomerManager.js"') || 
        conteudo.includes("'/src/systems/CustomerManager.js'")) {
        
        console.log('⚠️  Caminho antigo encontrado em Exports.js');
        conteudo = conteudo.replace(
            /["']\/src\/systems\/CustomerManager\.js["']/g, 
            '"/src/systems/customers/CustomerManager.js"'
        );
        modificado = true;
    }
    
    // Verificar se CustomerManager está na lista com caminho correto
    if (!conteudo.includes('customers/CustomerManager.js') && 
        !conteudo.includes('CustomerManager')) {
        console.log('⚠️  CustomerManager não encontrado em Exports.js');
        console.log('   💡 Lembre-se de adicionar manualmente se necessário');
    }
    
    if (modificado) {
        fs.writeFileSync('src/core/Exports.js', conteudo);
        console.log('✅ Exports.js atualizado');
    } else {
        console.log('✅ Exports.js já está correto');
    }
}

// 5. Verificar imports no UIManager.js
if (fs.existsSync('src/ui/UIManager.js')) {
    console.log('\n📝 Verificando UIManager.js...');
    
    let conteudo = fs.readFileSync('src/ui/UIManager.js', 'utf8');
    
    if (conteudo.includes('CustomerManager') && 
        !conteudo.includes('customers/CustomerManager')) {
        
        console.log('⚠️  Import de CustomerManager com caminho antigo');
        conteudo = conteudo.replace(
            /['"]\/src\/systems\/CustomerManager\.js['"]/g,
            "'/src/systems/customers/CustomerManager.js'"
        );
        fs.writeFileSync('src/ui/UIManager.js', conteudo);
        console.log('✅ UIManager.js atualizado');
    } else {
        console.log('✅ UIManager.js já está correto');
    }
}

console.log('\n=================================');
console.log('✅ CORREÇÕES CONCLUÍDAS!');
console.log('=================================');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Execute node validar-repositorio.js para verificar');
console.log('2. Teste o jogo para garantir que tudo funciona');
console.log('3. Se tudo estiver ok, faça commit das alterações');