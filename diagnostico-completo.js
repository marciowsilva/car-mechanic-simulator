// diagnostico-completo.js - Diagnóstico completo do jogo

console.log('=================================');
console.log('🏥 DIAGNÓSTICO COMPLETO');
console.log('=================================');

// Verificar se as principais classes existem
console.log('\n📋 VERIFICANDO CLASSES GLOBAIS:');

const classesParaVerificar = [
    'Game', 'Database', 'Car', 'CarModels', 'CarPart', 'Job',
    'Garage', 'Scene3D', 'Inventory', 'CustomerSystem',
    'DailyChallenges', 'UsedPartsMarket', 'UIManager'
];

classesParaVerificar.forEach(nome => {
    if (window[nome]) {
        console.log(`✅ window.${nome} existe`);
    } else {
        console.log(`❌ window.${nome} NÃO existe`);
    }
});

// Verificar elementos da UI
console.log('\n🖥️ VERIFICANDO ELEMENTOS DA UI:');

const elementosUI = [
    'game-container', 'ui-overlay', 'top-panel', 'tool-panel',
    'car-parts-panel', 'bottom-panel', 'interaction-info'
];

elementosUI.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) {
        console.log(`✅ #${id} encontrado`);
    } else {
        console.log(`❌ #${id} NÃO encontrado`);
    }
});

// Verificar renderizador 3D
console.log('\n🎮 VERIFICANDO RENDERIZADOR 3D:');

if (typeof THREE !== 'undefined') {
    console.log('✅ THREE.js carregado');
    console.log(`   Versão: ${THREE.REVISION}`);
} else {
    console.log('❌ THREE.js NÃO carregado');
}

// Verificar performance
console.log('\n⚡ VERIFICANDO PERFORMANCE:');

const memoria = performance.memory;
if (memoria) {
    console.log(`💾 Memória usada: ${Math.round(memoria.usedJSHeapSize / 1024 / 1024)} MB`);
    console.log(`💾 Memória total: ${Math.round(memoria.jsHeapSizeLimit / 1024 / 1024)} MB`);
}

// Detectar possíveis problemas
console.log('\n⚠️ POSSÍVEIS PROBLEMAS:');

// Verificar erros no console
const erros = performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('404'));

if (erros.length > 0) {
    console.log(`❌ ${erros.length} recursos não encontrados (404)`);
    erros.forEach(err => console.log(`   - ${err.name}`));
} else {
    console.log('✅ Nenhum erro 404 detectado');
}

console.log('=================================');
console.log('✅ DIAGNÓSTICO CONCLUÍDO');
console.log('=================================');