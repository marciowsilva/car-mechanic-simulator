// src/core/Game-Minimo.js - Versão mínima para teste

console.log('📦 Game-Minimo.js carregado!');

// Imports mínimos
import { Database } from '/src/core/Database.js';
import { constants } from '/src/utils/constants.js';

// Objeto global simples
export const gameState = { money: 5000, level: 1 };
export const db = new Database();

window.gameState = gameState;
window.db = db;

console.log('✅ Game-Minimo inicializado');