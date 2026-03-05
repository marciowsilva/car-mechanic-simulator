// testar-imports-leve.js - Versão leve com timeout
console.clear();
console.log('=================================');
console.log('🔍 TESTANDO IMPORTS (VERSÃO LEVE)');
console.log('=================================');

const tests = [
    { name: 'Game', path: '../core/Game.js' },
    { name: 'Database', path: '../core/Database.js' },
    { name: 'UIManager', path: '../ui/UIManager.js' },
    { name: 'Scene3D', path: '../garage/Scene3D.js' },
    { name: 'Constants', path: '../utils/constants.js' }
];

async function testarComTimeout(promise, timeoutMs) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });

    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(() => clearTimeout(timeoutHandle));
}

async function testarImport(index) {
    if (index >= tests.length) {
        console.log('=================================');
        console.log('✅ TESTE CONCLUÍDO');
        console.log('=================================');
        return;
    }

    const test = tests[index];
    console.log(`\n📦 Testando ${test.name} (${index + 1}/${tests.length})...`);
    
    try {
        const start = performance.now();
        const module = await testarComTimeout(import(test.path), 3000);
        const time = (performance.now() - start).toFixed(0);
        console.log(`   ✅ Carregado em ${time}ms`);
        console.log(`   📋 Exporta: ${Object.keys(module).join(', ')}`);
        
        // Pequeno delay entre imports
        setTimeout(() => testarImport(index + 1), 100);
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        if (error.message.includes('circular')) {
            console.log('   ⚠️  POSSÍVEL IMPORTAÇÃO CIRCULAR!');
        }
        setTimeout(() => testarImport(index + 1), 100);
    }
}

// Iniciar testes
testarImport(0);