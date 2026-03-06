// corrigir-tudo.mjs - Script completo de correção

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=================================');
console.log('🔧 CORREÇÃO COMPLETA DA ESTRUTURA');
console.log('=================================\n');

// 1. Criar pastas necessárias
console.log('📁 Criando pastas...');
['tests', 'src/systems/customers'].forEach(pasta => {
    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true });
        console.log(`   ✅ ${pasta} criada`);
    }
});

// 2. Mover CustomerManager para o lugar correto
if (fs.existsSync('src/systems/CustomerManager.js')) {
    console.log('\n📦 Movendo CustomerManager.js...');
    const destino = 'src/systems/customers/CustomerManager.js';
    
    if (fs.existsSync(destino)) {
        console.log('   ⚠️  Arquivo já existe em customers/, comparando...');
        const stats1 = fs.statSync('src/systems/CustomerManager.js');
        const stats2 = fs.statSync(destino);
        
        if (stats1.size > stats2.size) {
            fs.copyFileSync('src/systems/CustomerManager.js', destino);
            console.log('   ✅ Substituído pelo arquivo maior');
        } else {
            console.log('   ✅ Mantido o existente (é maior)');
        }
        fs.unlinkSync('src/systems/CustomerManager.js');
    } else {
        fs.renameSync('src/systems/CustomerManager.js', destino);
        console.log('   ✅ Movido com sucesso');
    }
}

// 3. Resolver duplicata do career-mode.js
console.log('\n📦 Resolvendo career-mode.js...');
const careerInCars = 'src/cars/career-mode.js';
const careerInSystems = 'src/systems/career-mode.js';

if (fs.existsSync(careerInCars) && fs.existsSync(careerInSystems)) {
    const stats1 = fs.statSync(careerInCars);
    const stats2 = fs.statSync(careerInSystems);
    
    console.log(`   📊 cars: ${stats1.size} bytes`);
    console.log(`   📊 systems: ${stats2.size} bytes`);
    
    if (stats2.size >= stats1.size) {
        fs.unlinkSync(careerInCars);
        console.log('   ✅ Mantido em systems, removido de cars');
    } else {
        fs.unlinkSync(careerInSystems);
        fs.renameSync(careerInCars, careerInSystems);
        console.log('   ✅ Mantido o de cars (maior), movido para systems');
    }
}

// 4. Padronizar nomes de arquivos
console.log('\n📦 Padronizando nomes...');

// CarModelLoader vs car-model-loader
if (fs.existsSync('src/cars/car-model-loader.js') && !fs.existsSync('src/cars/CarModelLoader.js')) {
    fs.renameSync('src/cars/car-model-loader.js', 'src/cars/CarModelLoader.js');
    console.log('   ✅ car-model-loader.js → CarModelLoader.js');
}

// AdvancedAchievements vs achievements-advanced
if (fs.existsSync('src/systems/achievements/AdvancedAchievements.js') && 
    !fs.existsSync('src/systems/achievements/achievements-advanced.js')) {
    fs.renameSync('src/systems/achievements/AdvancedAchievements.js', 
                  'src/systems/achievements/achievements-advanced.js');
    console.log('   ✅ AdvancedAchievements.js → achievements-advanced.js');
}

// 5. Mover arquivos de teste
console.log('\n📦 Movendo arquivos de teste...');
const testes = [
    'src/core/Game-Minimo.js',
    'src/core/Game-Teste.js',
    'src/ui/teste.html'
];

testes.forEach(arquivo => {
    if (fs.existsSync(arquivo)) {
        const nome = path.basename(arquivo);
        fs.renameSync(arquivo, `tests/${nome}`);
        console.log(`   ✅ ${nome} movido para tests/`);
    }
});

// 6. Verificar e atualizar imports no Exports.js e UIManager.js
console.log('\n📝 Atualizando imports...');

function atualizarImports(arquivo) {
    if (!fs.existsSync(arquivo)) return;
    
    let conteudo = fs.readFileSync(arquivo, 'utf8');
    let modificado = false;
    
    // Atualizar caminho do CustomerManager
    if (conteudo.includes('"/src/systems/CustomerManager.js"')) {
        conteudo = conteudo.replace(
            /["']\/src\/systems\/CustomerManager\.js["']/g,
            '"/src/systems/customers/CustomerManager.js"'
        );
        modificado = true;
    }
    
    // Atualizar caminho do career-mode se necessário
    if (conteudo.includes('"/src/cars/career-mode.js"')) {
        conteudo = conteudo.replace(
            /["']\/src\/cars\/career-mode\.js["']/g,
            '"/src/systems/career-mode.js"'
        );
        modificado = true;
    }
    
    if (modificado) {
        fs.writeFileSync(arquivo, conteudo);
        console.log(`   ✅ ${path.basename(arquivo)} atualizado`);
    }
}

atualizarImports('src/core/Exports.js');
atualizarImports('src/ui/UIManager.js');

console.log('\n=================================');
console.log('✅ CORREÇÕES CONCLUÍDAS!');
console.log('=================================');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Revise os arquivos em src/systems/customers/');
console.log('2. Decida qual sistema de clientes manter');
console.log('3. Teste o jogo');
console.log('4. Execute node validar-repositorio.js novamente');