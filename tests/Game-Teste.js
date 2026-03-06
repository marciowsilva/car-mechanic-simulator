// src/core/Game-Teste.js - Versão mínima para teste

console.log('📦 Game-Teste.js iniciando...');

// Criar objeto global simples
window.gameState = { money: 5000, level: 1 };
window.db = {};

console.log('✅ Game-Teste.js carregado com sucesso!');
export {};

// Pequeno delay para ver no console
setTimeout(() => {
    console.log('📊 window.gameState:', window.gameState);
}, 100);