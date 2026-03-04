// test-models.js - Script para testar modelos GLB

import { CarModelLoader } from './car-model-loader.js';

class ModelTester {
    constructor() {
        this.loader = new CarModelLoader();
        this.results = [];
        console.log('🔧 Iniciando teste de modelos GLB...');
    }

    async testAllModels() {
        const types = ['sedan', 'hatch', 'suv', 'pickup', 'sports', 'classic'];
        
        console.log('\n📋 Testando todos os modelos GLB:');
        console.log('=================================');
        
        for (const type of types) {
            await this.testModel(type);
        }
        
        this.printSummary();
    }

    async testModel(type) {
        process.stdout.write(`🔍 Testando ${type}.glb... `);
        
        const startTime = performance.now();
        
        try {
            const model = await this.loader.loadModel(type);
            const endTime = performance.now();
            const loadTime = (endTime - startTime).toFixed(2);
            
            // Verificar se o modelo tem malhas
            let meshCount = 0;
            model.traverse((child) => {
                if (child.isMesh) meshCount++;
            });
            
            const result = {
                type,
                success: true,
                loadTime,
                meshCount
            };
            
            this.results.push(result);
            
            console.log(`✅ (${loadTime}ms, ${meshCount} malhas)`);
            
            // Limpar da memória após teste
            this.disposeModel(model);
            
        } catch (error) {
            this.results.push({
                type,
                success: false,
                error: error.message
            });
            
            console.log(`❌ ERRO: ${error.message}`);
        }
    }

    disposeModel(model) {
        model.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    printSummary() {
        console.log('\n=================================');
        console.log('📊 RESUMO DOS TESTES GLB');
        console.log('=================================');
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        
        console.log(`✅ Sucessos: ${successful}`);
        console.log(`❌ Falhas: ${failed}`);
        
        if (failed > 0) {
            console.log('\n⚠️  Modelos com falha:');
            this.results.filter(r => !r.success).forEach(r => {
                console.log(`   - ${r.type}.glb: ${r.error}`);
            });
        }
        
        if (successful > 0) {
            console.log('\n⏱️  Tempos de carregamento:');
            this.results.filter(r => r.success).forEach(r => {
                console.log(`   - ${r.type}.glb: ${r.loadTime}ms (${r.meshCount} malhas)`);
            });
        }
        
        console.log('\n=================================');
        
        // Estatísticas de cache
        const cacheStats = this.loader.getCacheStats();
        console.log(`📦 Cache: ${cacheStats.size} modelos em memória`);
        console.log(`📊 Estatísticas:`, cacheStats.stats);
    }
}

// Executar testes
const tester = new ModelTester();
await tester.testAllModels();

// Expor para acesso no console
window.modelTester = tester;
console.log('🌐 ModelTester disponível globalmente');
console.log('📝 Use: modelTester.testModel("sedan")');